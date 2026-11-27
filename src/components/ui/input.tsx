import { cn } from "@/lib/utils";
import * as React from "react";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-full border border-white/15 bg-white/10 px-4 text-base text-white outline-none placeholder:text-white/40 focus-visible:border-cyan-200 focus-visible:ring-2 focus-visible:ring-cyan-200/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
