import * as React from "react";
import { cn } from "@/lib/cn";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-base text-slate-900 transition-colors outline-none placeholder:text-slate-400 focus-visible:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
