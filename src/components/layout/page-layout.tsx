import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageLayoutProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function PageLayout({ children, className, contentClassName }: PageLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background p-6", className)}>
      <div className={cn("mx-auto", contentClassName)}>{children}</div>
    </div>
  );
}
