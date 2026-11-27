"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function Sheet({ ...props }: React.ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

function SheetContent({
  className,
  children,
  title,
  description,
  footer,
}: {
  className?: string;
  children: React.ReactNode;
  title: string;
  description?: string;
  footer?: React.ReactNode;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[70] bg-[#05060f]/70 backdrop-blur-sm data-[state=open]:animate-[fade-in_180ms_ease]" />
      <Dialog.Content
        className={cn(
          "sheet-content fixed z-[71] flex flex-col border border-white/10 bg-[#14162b] text-white shadow-2xl outline-none",
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl",
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-h-none sm:w-[420px] sm:rounded-none sm:border-y-0 sm:border-r-0",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div>
            <Dialog.Title className="font-display text-2xl leading-none">{title}</Dialog.Title>
            {description ? (
              <Dialog.Description className="mt-2 text-sm text-white/70">{description}</Dialog.Description>
            ) : (
              <Dialog.Description className="sr-only">Crew member details</Dialog.Description>
            )}
          </div>
          <Dialog.Close className="grid h-11 w-11 place-items-center rounded-full bg-white/10 hover:bg-white/15" aria-label="Close">
            <X className="h-5 w-5" />
          </Dialog.Close>
        </div>
        <div className={cn("min-h-0 flex-1 px-5 pt-4", footer ? "flex flex-col overflow-hidden" : "overflow-y-auto pb-6")}>
          {children}
        </div>
        {footer ? <div className="border-t border-white/10 px-5 py-3">{footer}</div> : null}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

export { Sheet, SheetContent };
