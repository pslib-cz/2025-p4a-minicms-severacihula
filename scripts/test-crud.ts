import { PrismaClient } from "@prisma/client";
import { spawn, type ChildProcess } from "node:child_process";

const BASE_URL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3010";
const TEST_EMAIL = "anna@example.com";
const TEST_PASSWORD = "test1234";

type StepResult = {
  name: string;
  pass: boolean;
  detail: string;
};

class CookieJar {
  private readonly store = new Map<string, string>();

  applyHeaders(headers: HeadersInit = {}): HeadersInit {
    const result = new Headers(headers);
    if (this.store.size > 0) {
      result.set("cookie", Array.from(this.store.values()).join("; "));
    }
    return result;
  }

  update(response: Response) {
    const setCookie = response.headers.getSetCookie?.() ?? [];
    for (const rawCookie of setCookie) {
      const [pair] = rawCookie.split(";");
      const [name] = pair.split("=");
      this.store.set(name, pair);
    }
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(
  jar: CookieJar,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: jar.applyHeaders(init.headers),
    redirect: "manual",
  });
  jar.update(response);
  return response;
}

async function waitForServerReady(timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/csrf`);
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until timeout.
    }
    await wait(500);
  }
  throw new Error("Server did not become ready in time.");
}

function startServer(): ChildProcess {
  return spawn(
    process.execPath,
    ["./node_modules/next/dist/bin/next", "dev", "-p", "3010"],
    {
      cwd: process.cwd(),
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
}

function stopServer(processRef: ChildProcess) {
  if (!processRef.killed && processRef.pid) {
    processRef.kill();
  }
}

function printStep(step: StepResult) {
  const status = step.pass ? "PASS" : "FAIL";
  console.log(`[${status}] ${step.name} - ${step.detail}`);
}

async function run() {
  const prisma = new PrismaClient();
  const server = startServer();
  const steps: StepResult[] = [];

  try {
    await waitForServerReady();

    const authJar = new CookieJar();

    const csrfResponse = await request(authJar, "/api/auth/csrf");
    if (!csrfResponse.ok) {
      steps.push({
        name: "Setup login",
        pass: false,
        detail: `Unable to get CSRF token (${csrfResponse.status}).`,
      });
      throw new Error("Login setup failed");
    }

    const csrf = (await csrfResponse.json()) as { csrfToken: string };

    const loginBody = new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      callbackUrl: `${BASE_URL}/dashboard/trips`,
      json: "true",
    });

    const loginResponse = await request(authJar, "/api/auth/callback/credentials", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: loginBody,
    });

    const hasSessionCookie = loginResponse.headers
      .getSetCookie?.()
      .some((cookie) => cookie.startsWith("next-auth.session-token="));

    steps.push({
      name: "Setup login",
      pass: Boolean(hasSessionCookie),
      detail: hasSessionCookie
        ? "Session cookie obtained successfully."
        : "Session cookie missing after credentials login.",
    });

    if (!hasSessionCookie) {
      throw new Error("Authentication failed");
    }

    const tagsResponse = await request(authJar, "/api/tags");
    const tags = (await tagsResponse.json()) as Array<{ id: string }>;

    if (!tags.length) {
      throw new Error("No tags available for test payload.");
    }

    const uniqueSlug = `script-smoke-${Date.now()}`;

    const createPayload = {
      title: "Script Smoke Trip",
      slug: uniqueSlug,
      content: "<p>Smoke test content</p>",
      description: "Smoke test description",
      publishDate: new Date().toISOString(),
      published: false,
      tagIds: [tags[0].id],
    };

    const createResponse = await request(authJar, "/api/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(createPayload),
    });

    const createdTrip = (await createResponse.json()) as { id: string; title: string };

    const createPass = createResponse.status === 201 && Boolean(createdTrip.id);
    steps.push({
      name: "CRUD create",
      pass: createPass,
      detail: createPass
        ? `Trip created with id ${createdTrip.id}.`
        : `Unexpected create status ${createResponse.status}.`,
    });

    if (!createPass) {
      throw new Error("Create failed");
    }

    const patchResponse = await request(authJar, `/api/trips/${createdTrip.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...createPayload,
        title: "Script Smoke Trip Updated",
        published: true,
      }),
    });

    const patchedTrip = (await patchResponse.json()) as { title: string };

    const patchPass = patchResponse.ok && patchedTrip.title === "Script Smoke Trip Updated";
    steps.push({
      name: "CRUD update",
      pass: patchPass,
      detail: patchPass
        ? "Trip updated successfully."
        : `Unexpected update response (${patchResponse.status}).`,
    });

    if (!patchPass) {
      throw new Error("Patch failed");
    }

    const deleteResponse = await request(authJar, `/api/trips/${createdTrip.id}`, {
      method: "DELETE",
    });

    const listResponse = await request(authJar, "/api/trips");
    const list = (await listResponse.json()) as Array<{ id: string }>;
    const stillExists = list.some((trip) => trip.id === createdTrip.id);

    const deletePass = deleteResponse.status === 204 && !stillExists;
    steps.push({
      name: "CRUD delete",
      pass: deletePass,
      detail: deletePass
        ? "Trip deleted and no longer visible in list."
        : `Delete status ${deleteResponse.status}, stillExists=${stillExists}.`,
    });

    const userTwo = await prisma.user.findUnique({
      where: { email: "petr@example.com" },
      select: { id: true },
    });

    if (!userTwo) {
      throw new Error("User 2 not found in database.");
    }

    const foreignTrip = await prisma.trip.findFirst({
      where: { userId: userTwo.id },
      select: { id: true },
      orderBy: { publishDate: "desc" },
    });

    if (!foreignTrip) {
      throw new Error("No trip found for user 2.");
    }

    const ownershipResponse = await request(authJar, `/api/trips/${foreignTrip.id}`, {
      method: "DELETE",
    });

    const ownershipPass =
      ownershipResponse.status === 403 || ownershipResponse.status === 401;

    steps.push({
      name: "Ownership check",
      pass: ownershipPass,
      detail: ownershipPass
        ? `Access blocked with status ${ownershipResponse.status}.`
        : `Unexpected status ${ownershipResponse.status}.`,
    });

    for (const step of steps) {
      printStep(step);
    }

    const hasFailure = steps.some((step) => !step.pass);
    process.exitCode = hasFailure ? 1 : 0;
  } catch (error) {
    for (const step of steps) {
      printStep(step);
    }
    console.error("Smoke test aborted:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    stopServer(server);
  }
}

run();
