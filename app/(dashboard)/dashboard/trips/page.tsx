import { Button } from "@nextui-org/react";
import Link from "next/link";
import { TripsList } from "@/components/dashboard/trips-list";

export default function DashboardTripsPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Moje cesty</h1>
        <Button as={Link} href="/dashboard/trips/new" color="primary">
          Pridat novou cestu
        </Button>
      </div>
      <TripsList />
    </section>
  );
}
