"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        if (response.status === 409) {
          setError("E-mail je již používán");
        } else if (response.status === 400) {
          setError("Vyplňte prosím všechna pole správně.");
        } else {
          setError(payload?.error ?? "Registrace selhala. Zkuste to prosím znovu.");
        }
        return;
      }

      window.location.href = "/login";
    } catch {
        setError("Registrace selhala. Zkuste to prosím znovu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <form className="w-full space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold">Vytvořit účet</h1>
        <p className="text-sm text-slate-600">Zaregistruj nový účet a začni vytvářet cestopisy.</p>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="name">
            Jméno
          </label>
          <input
            id="name"
            type="text"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-slate-900 outline-none transition-all duration-200 ease-in-out focus:border-transparent focus:ring-2 focus:ring-blue-600"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

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
            minLength={6}
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
          {isSubmitting ? "Vytvářím účet..." : "Registrovat"}
        </button>

        <p className="text-sm text-slate-600">
          Už máš účet?{" "}
          <Link className="font-medium text-slate-900 underline" href="/login">
            Přihlásit se
          </Link>
        </p>
      </form>
    </main>
  );
}
