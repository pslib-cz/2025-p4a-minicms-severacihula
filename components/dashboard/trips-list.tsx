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
      <p className="text-xs text-slate-500 sm:hidden">Tabulku lze posouvat vodorovně.</p>
      <div className="relative overflow-x-auto rounded-xl border border-slate-200">
        <Table
          aria-label="Seznam cestovatelských deníků"
          className="min-w-[760px] rounded-xl"
          classNames={{
            wrapper: "shadow-none p-0",
            th: "sticky top-0 z-10 bg-slate-100/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 sm:px-6 sm:py-4",
            td: "px-4 py-3 align-middle sm:px-6 sm:py-4",
          }}
        >
          <TableHeader>
            <TableColumn>Název</TableColumn>
            <TableColumn>Datum publikace</TableColumn>
            <TableColumn>Status</TableColumn>
            <TableColumn>Akce</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Zatím nemáš žádné cesty.">
            {pagedTrips.map((trip, index) => (
              <TableRow key={trip.id} className={index % 2 === 1 ? "bg-slate-50" : "bg-white"}>
                <TableCell>
                  <span className="block max-w-sm break-words text-sm font-medium text-slate-900 sm:max-w-md">
                    {trip.title}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">
                    {new Date(trip.publishDate).toLocaleDateString("cs-CZ")}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip
                    className={
                      trip.published
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-slate-200 bg-slate-100 text-slate-700"
                    }
                    variant="flat"
                  >
                    {trip.published ? "Publikováno" : "Koncept"}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      as={Link}
                      href={`/dashboard/trips/${trip.id}/edit`}
                      isIconOnly
                      variant="flat"
                      className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-600 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-900"
                      aria-label="Upravit cestu"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 1 1 3.182 3.182L8.25 19.463 3 21l1.537-5.25L16.862 4.487Z" />
                      </svg>
                    </Button>
                    <Button
                      isIconOnly
                      color="danger"
                      variant="light"
                      className="h-9 w-9 rounded-lg border border-red-200 bg-white text-red-500 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600"
                      isLoading={deleteMutation.isPending}
                      onPress={() => deleteMutation.mutate(trip.id)}
                      aria-label="Smazat cestu"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.75h4.5m-8.25 3h12m-1.5 0-.663 10.612A2.25 2.25 0 0 1 13.592 19.5h-3.184a2.25 2.25 0 0 1-2.245-2.138L7.5 6.75m3 3.75v5.25m3-5.25v5.25" />
                      </svg>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent sm:hidden" />
      </div>

      <div className="flex justify-center sm:justify-end">
        <Pagination page={page} total={pageCount} onChange={setPage} />
      </div>
    </div>
  );
}
