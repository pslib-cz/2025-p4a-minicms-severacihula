import { TripForm } from "@/components/dashboard/trip-form";

type EditTripPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Editace cesty</h1>
      <TripForm mode="edit" tripId={id} />
    </section>
  );
}
