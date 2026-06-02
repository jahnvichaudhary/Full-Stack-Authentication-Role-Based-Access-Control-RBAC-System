import { useSyncExternalStore } from "react";
import { getCurrentUser } from "@/lib/auth";

function subscribe(cb: () => void) {
  window.addEventListener("auth:login", cb);
  window.addEventListener("auth:logout", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("auth:login", cb);
    window.removeEventListener("auth:logout", cb);
    window.removeEventListener("storage", cb);
  };
}

function getSnapshot() {
  return localStorage.getItem("token");
}

export function useAuth() {
  useSyncExternalStore(subscribe, getSnapshot, () => null);
  return getCurrentUser();
}
