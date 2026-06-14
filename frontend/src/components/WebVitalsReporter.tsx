"use client";

import { useReportWebVitals } from 'next/web-vitals';
import { API_BASE } from '@/config';

export default function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      path: typeof window !== "undefined" ? window.location.pathname : "/"
    });

    const url = `${API_BASE}/admin/speed/web-vitals`;

    // Send the telemetry payload
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true
      }).catch((err) => console.error("Failed to report vital metric:", err));
    }
  });

  return null;
}
