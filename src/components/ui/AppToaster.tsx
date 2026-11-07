"use client";

import type { CSSProperties } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from "lucide-react";
import { Toaster } from "sonner";

const iconClassName = "h-5 w-5 shrink-0";

export function AppToaster() {
  return (
    <Toaster
      closeButton
      containerAriaLabel="Notifikasi SiHEDAF"
      duration={4000}
      gap={10}
      icons={{
        success: (
          <CheckCircle2
            aria-hidden="true"
            className={`${iconClassName} text-primary-300`}
          />
        ),
        error: (
          <CircleAlert
            aria-hidden="true"
            className={`${iconClassName} text-af-700`}
          />
        ),
        info: (
          <Info
            aria-hidden="true"
            className={`${iconClassName} text-primary-500`}
          />
        ),
        warning: (
          <TriangleAlert
            aria-hidden="true"
            className={`${iconClassName} text-warn-500`}
          />
        ),
        loading: (
          <LoaderCircle
            aria-hidden="true"
            className={`${iconClassName} animate-spin text-primary-300`}
          />
        ),
        close: <X aria-hidden="true" className="h-4 w-4" />,
      }}
      mobileOffset={{ top: 12, left: 12, right: 12 }}
      offset={{ top: 20 }}
      position="top-center"
      style={
        {
          "--width": "min(380px, calc(100vw - 24px))",
        } as CSSProperties
      }
      swipeDirections={["right"]}
      theme="light"
      toastOptions={{
        closeButtonAriaLabel: "Tutup notifikasi",
        unstyled: true,
        classNames: {
          toast:
            "pointer-events-auto relative flex w-[min(380px,calc(100vw-24px))] items-start gap-3 rounded-[18px] border-[1.5px] px-4 py-4 pr-12 font-sans shadow-[0_18px_44px_rgba(0,39,88,0.16)]",
          default: "border-primary-900/15 bg-white",
          info: "border-primary-900/15 bg-white",
          success: "border-primary-200 bg-primary-50",
          error: "border-af-500/30 bg-af-50",
          warning: "border-warn-500/40 bg-warn-50",
          loading: "border-primary-900/15 bg-white",
          content: "min-w-0 flex-1",
          icon: "mt-0.5 flex shrink-0 items-center",
          title: "text-[0.9375rem] font-semibold leading-[1.4] text-primary-900",
          description: "mt-0.5 text-[0.875rem] leading-[1.45] text-primary-900/80",
          closeButton:
            "absolute top-2.5 right-2.5 grid h-8 w-8 place-items-center rounded-full border border-primary-900/15 bg-white text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300",
          actionButton:
            "rounded-full bg-primary-900 px-3.5 py-2 text-[0.875rem] font-semibold text-white transition-colors hover:bg-primary-800 focus-visible:outline-2 focus-visible:outline-primary-300",
          cancelButton:
            "rounded-full border border-primary-900/20 bg-white px-3.5 py-2 text-[0.875rem] font-semibold text-primary-900 transition-colors hover:bg-paper-deep focus-visible:outline-2 focus-visible:outline-primary-300",
        },
      }}
      visibleToasts={1}
    />
  );
}
