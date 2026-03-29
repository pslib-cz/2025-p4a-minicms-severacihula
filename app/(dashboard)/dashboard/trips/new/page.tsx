import { TripForm } from "@/components/dashboard/trip-form";

export default function NewTripPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Nova cesta</h1>
      <TripForm mode="create" />
    </section>
  );
}
