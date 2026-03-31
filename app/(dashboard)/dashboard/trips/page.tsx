import { Button } from "@nextui-org/react";
import Link from "next/link";
import { TripsList } from "@/components/dashboard/trips-list";

export default function DashboardTripsPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Moje cesty</h1>
        <Button
          as={Link}
          href="/dashboard/trips/new"
          color="primary"
          className="bg-blue-600 text-white transition-all duration-200 ease-in-out hover:bg-blue-700"
        >
          Přidat novou cestu
        </Button>
      </div>
      <TripsList />
    </section>
  );
}
