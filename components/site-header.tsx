"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

const linkClass = (isActive: boolean) =>
  `text-sm font-medium transition-colors ${isActive ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}`;

export function SiteHeader() {
  const pathname = usePathname();
  const { status } = useSession();

  const isAuthenticated = status === "authenticated";

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-base font-semibold text-slate-900">
          Cestovatelsky denik
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/" className={linkClass(pathname === "/")}>
            Clanky
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className={linkClass(pathname.startsWith("/dashboard"))}>
                Dashboard
              </Link>
              <Link href="/dashboard/trips/new" className={linkClass(pathname === "/dashboard/trips/new")}>
                Pridat clanek
              </Link>
              <button
                type="button"
                className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Odhlasit se
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              Prihlasit se
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
