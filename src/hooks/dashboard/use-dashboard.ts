"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/http/client";
import type { DashboardData } from "@/services/dashboard";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiFetch("/api/dashboard");
      if (res.ok) {
        const json = await res.json();
        const payload: DashboardData = json.data ?? json;
        setData(payload);
      } else {
        const json = await res.json().catch(() => ({}));
        setErrorMessage(json.error || "Failed to load dashboard data.");
      }
    } catch {
      setErrorMessage("Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function initialFetch() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const res = await apiFetch("/api/dashboard");
        if (res.ok) {
          const json = await res.json();
          const payload: DashboardData = json.data ?? json;
          if (!ignore) {
            setData(payload);
          }
        } else if (!ignore) {
          const json = await res.json().catch(() => ({}));
          setErrorMessage(json.error || "Failed to load dashboard data.");
        }
      } catch {
        if (!ignore) {
          setErrorMessage("Failed to load dashboard data.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void initialFetch();

    return () => {
      ignore = true;
    };
  }, []);

  const collections = data?.collections ?? [];
  const movieCount = data?.counts?.movies ?? 0;
  const seriesCount = data?.counts?.series ?? 0;

  return {
    isLoading,
    errorMessage,
    movieCount,
    seriesCount,
    collections,
    refetch: loadData,
  };
}
