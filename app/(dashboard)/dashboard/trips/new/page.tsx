import { TripForm } from "@/components/dashboard/trip-form";

export default function NewTripPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Nová cesta</h1>
      </div>
      <TripForm mode="create" />
    </section>
  );
}
