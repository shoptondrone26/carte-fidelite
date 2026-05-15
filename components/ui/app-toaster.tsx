"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      theme="dark"
      position="top-center"
      closeButton
      toastOptions={{ classNames: { toast: "text-base" } }}
    />
  );
}
