import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during the static prerender and the hydration pass, true afterwards. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
