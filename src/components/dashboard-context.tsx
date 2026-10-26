"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_CLIENT_ID, getClient, type ClientProfile } from "@/lib/clients";
import { DEFAULT_RANGE, type RangeKey } from "@/lib/data";

interface DashboardState {
  clientId: string;
  client: ClientProfile;
  range: RangeKey;
  setClientId: (id: string) => void;
  setRange: (range: RangeKey) => void;
}

const DashboardContext = createContext<DashboardState | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState(DEFAULT_CLIENT_ID);
  const [range, setRange] = useState<RangeKey>(DEFAULT_RANGE);

  const value = useMemo(
    () => ({ clientId, client: getClient(clientId), range, setClientId, setRange }),
    [clientId, range],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard(): DashboardState {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
