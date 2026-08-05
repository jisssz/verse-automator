import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CenteredStateProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function CenteredState({ children, className, contentClassName }: CenteredStateProps) {
  return (
    <div
      className={cn("flex min-h-screen items-center justify-center bg-background px-4", className)}
    >
      <div className={cn("max-w-md text-center", contentClassName)}>{children}</div>
    </div>
  );
}
