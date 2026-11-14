"use client";

import { useSyncExternalStore } from "react";
import { read, readServer, subscribe, type Store, type StoreKey } from "@/lib/storage";

export function useStore<K extends StoreKey>(key: K): Store[K] {
  return useSyncExternalStore(
    subscribe,
    () => read(key),
    () => readServer(key),
  );
}

const noopSubscribe = () => () => {};

/** false during SSR + hydration, true afterwards — use to avoid flashing session-dependent UI */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useSession() {
  return useStore("session");
}

export function useCurrentCustomer() {
  const session = useSession();
  const customers = useStore("customers");
  return session.customerId ? customers.find((c) => c.id === session.customerId) ?? null : null;
}

export function useCurrentPro() {
  const session = useSession();
  const pros = useStore("pros");
  return session.proId ? pros.find((p) => p.id === session.proId) ?? null : null;
}

export function useActiveServices() {
  return useStore("services").filter((s) => s.active);
}
