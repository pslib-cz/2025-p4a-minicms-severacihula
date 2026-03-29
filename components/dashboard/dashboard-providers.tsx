"use client";

import { NextUIProvider } from "@nextui-org/react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

type DashboardProvidersProps = {
  children: React.ReactNode;
};

export function DashboardProviders({ children }: DashboardProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <NextUIProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </NextUIProvider>
  );
}
