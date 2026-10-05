import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/cn";

type ContainerProps<T extends ElementType> = {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

export function Container<T extends ElementType = "div">({
  as,
  className,
  ...props
}: ContainerProps<T>) {
  const Component: ElementType = as ?? "div";
  return (
    <Component
      className={cn("mx-auto w-full max-w-6xl px-6 sm:px-8", className)}
      {...props}
    />
  );
}
