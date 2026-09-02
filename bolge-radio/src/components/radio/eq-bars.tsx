import { cn } from "@/lib/utils";

export function EqBars({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex h-4 items-end gap-0.5 text-live", className)}
      aria-hidden="true"
    >
      <span className={cn("eq-bar", !active && "animate-none scale-y-[0.35]")} />
      <span className={cn("eq-bar", !active && "animate-none scale-y-[0.5]")} />
      <span className={cn("eq-bar", !active && "animate-none scale-y-[0.4]")} />
    </span>
  );
}
