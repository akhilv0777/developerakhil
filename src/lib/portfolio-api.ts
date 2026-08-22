import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PortfolioData } from "./portfolio-types";

// ---------------------------------------------------------------------
// Data layer: public content comes from GET /api/portfolio (no auth).
// Shared by the public frontend and the admin console.
// ---------------------------------------------------------------------

export function usePortfolioQuery() {
  return useQuery<PortfolioData>({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const response = await fetch("/api/portfolio", {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to load portfolio content");
      const json = await response.json();
      return json;
    },
    staleTime: 30_000,
  });
}

export function useSavePortfolioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: PortfolioData) => {
      const response = await fetch("/api/portfolio", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const detail = Array.isArray(body.details)
          ? ` (${body.details.join("; ")})`
          : "";
        throw new Error((body.error || "Failed to save changes") + detail);
      }
      return undefined;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useResetPortfolioMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/portfolio", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to reset content");
      }
      await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}

export function useAuthQuery() {
  return useQuery<{ authenticated: boolean; username?: string }>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/me", { credentials: "include" });
      if (response.status === 401) return { authenticated: false };
      if (!response.ok) throw new Error("Failed to check session");
      return response.json();
    },
    staleTime: 60_000,
    retry: false,
  });
}
