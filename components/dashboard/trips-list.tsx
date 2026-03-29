"use client";

import {
  Button,
  Chip,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Trip = {
  id: string;
  title: string;
  publishDate: string;
  published: boolean;
};

const PAGE_SIZE = 5;

const fetchTrips = async () => {
  const response = await fetch("/api/trips");
  if (!response.ok) {
    throw new Error("Nepodarilo se nacist cesty.");
  }
  return (await response.json()) as Trip[];
};

export function TripsList() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const tripsQuery = useQuery({
    queryKey: ["trips"],
    queryFn: fetchTrips,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Mazani selhalo.");
      }
    },
    onSuccess: () => {
      toast.success("Cesta byla smazana.");
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Mazani selhalo.");
    },
  });

  const trips = tripsQuery.data ?? [];

  const pageCount = Math.max(1, Math.ceil(trips.length / PAGE_SIZE));
  const pagedTrips = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return trips.slice(start, start + PAGE_SIZE);
  }, [page, trips]);

  if (tripsQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-8">
        <Spinner size="sm" />
        <span>Nacitam cesty...</span>
      </div>
    );
  }

  if (tripsQuery.isError) {
    return <p className="text-danger">Nepodarilo se nacist seznam cest.</p>;
  }

  return (
    <div className="space-y-4">
      <Table aria-label="Seznam cestovatelskych deniku">
        <TableHeader>
          <TableColumn>Nazev</TableColumn>
          <TableColumn>Datum publikace</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Akce</TableColumn>
        </TableHeader>
        <TableBody emptyContent="Zatim nemas zadne cesty.">
          {pagedTrips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell>{trip.title}</TableCell>
              <TableCell>
                {new Date(trip.publishDate).toLocaleDateString("cs-CZ")}
              </TableCell>
              <TableCell>
                <Chip color={trip.published ? "success" : "warning"} variant="flat">
                  {trip.published ? "Publikovano" : "Draft"}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    as={Link}
                    href={`/dashboard/trips/${trip.id}/edit`}
                    size="sm"
                    variant="flat"
                  >
                    Editovat
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    isLoading={deleteMutation.isPending}
                    onPress={() => deleteMutation.mutate(trip.id)}
                  >
                    Smazat
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-end">
        <Pagination page={page} total={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}
