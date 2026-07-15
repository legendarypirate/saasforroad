"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  fetchCurrentTenant,
  getTenantDomain,
  isPlatformHost,
  type TenantInfo,
} from "@/lib/tenant";

type TenantState = {
  tenant: TenantInfo | null;
  loading: boolean;
  domain: string;
  unknownDomain: boolean;
  isPlatform: boolean;
  refresh: () => Promise<void>;
};

const TenantContext = createContext<TenantState | null>(null);

function isDevHost(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local")
  );
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [unknownDomain, setUnknownDomain] = useState(false);
  const [isPlatform, setIsPlatform] = useState(false);
  const [domain, setDomain] = useState("localhost");

  const refresh = useCallback(async () => {
    setLoading(true);
    const host = getTenantDomain();
    setDomain(host);

    if (isPlatformHost(host)) {
      setTenant(null);
      setUnknownDomain(false);
      setIsPlatform(true);
      setLoading(false);
      return;
    }

    setIsPlatform(false);
    const data = await fetchCurrentTenant();
    if (data) {
      setTenant(data);
      setUnknownDomain(false);
    } else if (isDevHost(host)) {
      setTenant(null);
      setUnknownDomain(false);
    } else {
      setTenant(null);
      setUnknownDomain(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onNotFoundPage = pathname === "/tenant-not-found";
  const onPlatformHome = pathname === "/" && isPlatform;

  useEffect(() => {
    if (isPlatform && onNotFoundPage) {
      router.replace("/");
      return;
    }
    if (!loading && unknownDomain && !onNotFoundPage) {
      router.replace("/tenant-not-found");
    }
  }, [loading, unknownDomain, onNotFoundPage, isPlatform, router]);

  const value = useMemo(
    () => ({
      tenant,
      loading,
      domain,
      unknownDomain,
      isPlatform,
      refresh,
    }),
    [tenant, loading, domain, unknownDomain, isPlatform, refresh]
  );

  if (loading && !onNotFoundPage && !onPlatformHome) {
    return (
      <TenantContext.Provider value={value}>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#0b1014",
            color: "#8b9aab",
            fontFamily: "inherit",
          }}
        >
          Loading…
        </div>
      </TenantContext.Provider>
    );
  }

  if (unknownDomain && !onNotFoundPage) {
    return (
      <TenantContext.Provider value={value}>
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#0b1014",
            color: "#8b9aab",
          }}
        >
          Redirecting…
        </div>
      </TenantContext.Provider>
    );
  }

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}

export function useTenantOptional() {
  return useContext(TenantContext);
}
