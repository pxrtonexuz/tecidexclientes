"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: "rgba(5, 12, 8, 0.92)",
          border: "1px solid rgba(57, 217, 138, 0.28)",
          color: "#e2f0e8",
          backdropFilter: "blur(20px)",
          borderRadius: "12px",
          fontSize: "13px",
        },
      }}
      {...props}
    />
  );
}
