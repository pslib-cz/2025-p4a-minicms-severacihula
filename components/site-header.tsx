"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const linkClass = (isActive: boolean) =>
  `rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out ${
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export function SiteHeader() {
  const pathname = usePathname();
  const { status } = useSession();

  const isAuthenticated = status === "authenticated";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-slate-900 transition-colors hover:text-blue-700">
          Cestovatelský deník
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/" className={linkClass(pathname === "/")}>
            Články
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className={linkClass(pathname.startsWith("/dashboard"))}>
                Dashboard
              </Link>
              <Link href="/dashboard/trips/new" className={linkClass(pathname === "/dashboard/trips/new")}>
                Přidat článek
              </Link>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Odhlásit se
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            >
              Přihlásit se
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
