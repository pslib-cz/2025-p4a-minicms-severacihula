"use client";

import {
  Button,
  Link as NextUiLink,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type DashboardShellProps = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/dashboard/trips", label: "Moje cesty" },
  { href: "/dashboard/trips/new", label: "Nova cesta" },
];

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar maxWidth="xl" isBordered>
        <NavbarBrand>
          <p className="font-semibold text-slate-900">Cestovatelsky denik</p>
        </NavbarBrand>

        <NavbarContent justify="start">
          {navLinks.map((link) => (
            <NavbarItem key={link.href} isActive={pathname === link.href}>
              <NextUiLink as={Link} color="foreground" href={link.href}>
                {link.label}
              </NextUiLink>
            </NavbarItem>
          ))}
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem>
            <Button
              color="danger"
              variant="light"
              onPress={() => signOut({ callbackUrl: "/login" })}
            >
              Odhlasit
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <div className="mx-auto max-w-6xl p-6">{children}</div>
    </div>
  );
}
