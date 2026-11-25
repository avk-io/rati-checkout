import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "default" | "outline";
  size?: "default" | "sm";
};

const base =
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";

const variants = {
  default: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
};

const sizes = {
  default: "",
  sm: "px-2.5 py-1 text-xs",
};

function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

export { Button };
