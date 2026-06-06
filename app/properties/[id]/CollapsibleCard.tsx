"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function CollapsibleCard({
  headerLeft,
  headerRight,
  children,
  contentClassName,
  defaultOpen = true,
}: {
  headerLeft: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="border-border shadow-none">
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-5 py-4 border-b border-border hover:bg-muted/30 transition-colors rounded-t-lg"
        style={{ borderBottom: isOpen ? undefined : "none" }}
      >
        <div className="flex items-center gap-2 min-w-0">{headerLeft}</div>
        <div className="flex items-center gap-2 shrink-0">
          {headerRight && (
            <div onClick={(e) => e.stopPropagation()}>
              {headerRight}
            </div>
          )}
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      {isOpen && (
        <CardContent className={contentClassName ?? "p-4"}>
          {children}
        </CardContent>
      )}
    </Card>
  );
}
