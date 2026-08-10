"use client";

import { useEffect } from "react";

function setPwaStatus(status: "unsupported" | "registered" | "updating" | "error") {
  document.documentElement.dataset.pwaStatus = status;
}

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    if (!("serviceWorker" in navigator)) {
      setPwaStatus("unsupported");
      return;
    }

    let active = true;
    void navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (!active) return;
        setPwaStatus("registered");
        registration.addEventListener("updatefound", () => {
          if (active) setPwaStatus("updating");
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPwaStatus("error");
        console.warn("[GrowPilot] Service Worker registration failed", error);
      });

    return () => {
      active = false;
    };
  }, []);

  return null;
}
