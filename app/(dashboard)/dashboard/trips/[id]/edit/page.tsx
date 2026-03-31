import { TripForm } from "@/components/dashboard/trip-form";

type EditTripPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Editace cesty</h1>
      </div>
      <TripForm mode="edit" tripId={id} />
    </section>
  );
}
