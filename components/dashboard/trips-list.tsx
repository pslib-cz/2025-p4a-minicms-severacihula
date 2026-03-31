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
    throw new Error("Nepodařilo se načíst cesty.");
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
        throw new Error(payload?.error ?? "Mazání selhalo.");
      }
    },
    onSuccess: () => {
      toast.success("Cesta byla smazána.");
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Mazání selhalo.");
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
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-8 text-slate-600 shadow-sm">
        <Spinner size="sm" />
        <span>Načítám cesty...</span>
      </div>
    );
  }

  if (tripsQuery.isError) {
    return <p className="text-danger">Nepodařilo se načíst seznam cest.</p>;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Table aria-label="Seznam cestovatelských deníků" className="rounded-xl">
        <TableHeader>
          <TableColumn>Název</TableColumn>
          <TableColumn>Datum publikace</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Akce</TableColumn>
        </TableHeader>
        <TableBody emptyContent="Zatím nemáš žádné cesty.">
          {pagedTrips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell>{trip.title}</TableCell>
              <TableCell>
                {new Date(trip.publishDate).toLocaleDateString("cs-CZ")}
              </TableCell>
              <TableCell>
                <Chip color={trip.published ? "success" : "warning"} variant="flat">
                  {trip.published ? "Publikováno" : "Koncept"}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    as={Link}
                    href={`/dashboard/trips/${trip.id}/edit`}
                    size="sm"
                    variant="flat"
                    className="transition-all duration-200 ease-in-out hover:bg-blue-50 hover:text-blue-700"
                  >
                    Editovat
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    className="transition-all duration-200 ease-in-out"
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
