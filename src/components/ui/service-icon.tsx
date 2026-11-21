import {
  AppWindow,
  Bot,
  Compass,
  Cpu,
  Layers,
  LayoutTemplate,
} from "lucide-react";
import type { ServiceAccent, ServiceIconName } from "@/content/services";
import { cn } from "@/lib/cn";

const accentClasses: Record<ServiceAccent, string> = {
  blue: "bg-primary-soft text-electric border-electric/15",
  violet: "bg-violet-soft text-violet border-violet/15",
  cyan: "bg-cyan-soft text-[#0891B2] border-cyan/25",
  navy: "bg-navy-soft text-navy border-navy/15",
};

export function ServiceIcon({
  name,
  accent = "blue",
  className,
  iconClassName,
}: {
  name: ServiceIconName;
  accent?: ServiceAccent;
  className?: string;
  iconClassName?: string;
}) {
  const iconClass = cn("h-5 w-5", iconClassName);

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
        accentClasses[accent],
        className,
      )}
    >
      {name === "bot" && <Bot className={iconClass} />}
      {name === "app-window" && <AppWindow className={iconClass} />}
      {name === "cpu" && <Cpu className={iconClass} />}
      {name === "layers" && <Layers className={iconClass} />}
      {name === "layout-template" && <LayoutTemplate className={iconClass} />}
      {name === "compass" && <Compass className={iconClass} />}
    </span>
  );
}
