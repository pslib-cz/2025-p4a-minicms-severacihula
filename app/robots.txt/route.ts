export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const body = [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${baseUrl}/sitemap.xml`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
