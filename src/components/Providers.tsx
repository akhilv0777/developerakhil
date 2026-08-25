"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <ToastContainer position="top-left" autoClose={5000} theme="colored" newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
