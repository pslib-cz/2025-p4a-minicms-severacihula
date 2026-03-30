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
          setError("Email already in use");
        } else if (response.status === 400) {
          setError("Please fill all fields correctly.");
        } else {
          setError(payload?.error ?? "Registration failed. Please try again.");
        }
        return;
      }

      window.location.href = "/login";
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <form className="w-full space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-semibold">Create Account</h1>
        <p className="text-sm text-slate-600">Register a new account to start creating trips.</p>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            minLength={6}
            className="w-full rounded border border-slate-300 px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Creating account..." : "Register"}
        </button>

        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-medium text-slate-900 underline" href="/login">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
