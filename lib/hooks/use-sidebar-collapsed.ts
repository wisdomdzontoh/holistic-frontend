"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "ha.sidebar.collapsed";
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Sidebar collapse state, persisted to localStorage and shared across components. */
export function useSidebarCollapsed(): [boolean, (next: boolean) => void] {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);

  const setCollapsed = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Private mode / blocked storage — the toggle still works for this page view.
    }
    listeners.forEach((l) => l());
  }, []);

  return [collapsed, setCollapsed];
}
