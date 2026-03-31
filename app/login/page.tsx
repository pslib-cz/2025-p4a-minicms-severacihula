"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("anna@example.com");
  const [password, setPassword] = useState("test1234");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError("Neplatný e-mail nebo heslo.");
      return;
    }

    window.location.href = result.url ?? "/dashboard";
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form className="w-full space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold text-slate-900">Přihlášení</h1>
        <p className="text-sm text-slate-600">
          Testovací účet: anna@example.com / test1234
        </p>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-slate-900 outline-none transition-all duration-200 ease-in-out focus:border-transparent focus:ring-2 focus:ring-blue-600"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="password">
            Heslo
          </label>
          <input
            id="password"
            type="password"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-slate-900 outline-none transition-all duration-200 ease-in-out focus:border-transparent focus:ring-2 focus:ring-blue-600"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition-all duration-200 ease-in-out hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Přihlašuji..." : "Přihlásit se"}
        </button>
    
        <Link
          href="/register"
          className="mt-4 block text-center text-sm text-gray-600 hover:underline"
        >
          Nemáte účet? Zaregistrovat se
        </Link>
      </form>
    </main>
  );
}
