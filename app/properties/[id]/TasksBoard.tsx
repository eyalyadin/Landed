"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export type TaskItem = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  status: string;
  dueDate: string | null;
};

type TaskTransition = {
  jobId: number;
  suggestedStatus: string;
  reason: string;
};

const COLUMNS: { status: string; label: string }[] = [
  { status: "new", label: "New" },
  { status: "in_progress", label: "In Progress" },
  { status: "waiting_on_tenant", label: "Waiting on Tenant" },
  { status: "waiting_on_vendor", label: "Waiting on Vendor" },
  { status: "completed", label: "Completed" },
];

const CATEGORY_LABELS: Record<string, string> = {
  repair: "Repair",
  payment_followup: "Payment Follow-up",
  contract_renewal: "Contract Renewal",
  tenant_issue: "Tenant Issue",
  inspection: "Inspection",
  maintenance: "Maintenance",
};

const COLUMN_HEADER: Record<string, string> = {
  new: "bg-zinc-200/60 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  waiting_on_tenant:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  waiting_on_vendor:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
};

export function TasksBoard({
  propertyId,
  jobs,
}: {
  propertyId: number;
  jobs: TaskItem[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>(jobs);
  const [suggestions, setSuggestions] = useState<TaskTransition[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [dragId, setDragId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const today = new Date();

  // Non-blocking: fetch AI task-move suggestions after mount
  useEffect(() => {
    fetch("/api/tasks/suggest-transitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions as TaskTransition[]);
        }
      })
      .catch(() => {}); // graceful — this is a hint, not critical
  }, [propertyId]);

  async function moveTask(id: number, newStatus: string) {
    const prev = tasks;
    // Optimistic update
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));

    const res = await fetch(`/api/maintenance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      setTasks(prev); // roll back
    } else {
      router.refresh();
    }
  }

  function acceptSuggestion(jobId: number, suggestedStatus: string) {
    moveTask(jobId, suggestedStatus);
    setDismissedIds((s) => new Set([...s, jobId]));
  }

  function dismissSuggestion(jobId: number) {
    setDismissedIds((s) => new Set([...s, jobId]));
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        const isDragOver = dragOverCol === col.status;

        return (
          <div
            key={col.status}
            className={`min-w-[220px] flex-shrink-0 rounded-lg border transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/30"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.status);
            }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverCol(null);
              if (dragId !== null) {
                const task = tasks.find((t) => t.id === dragId);
                if (task && task.status !== col.status) {
                  moveTask(dragId, col.status);
                }
                setDragId(null);
              }
            }}
          >
            {/* Column header */}
            <div
              className={`flex items-center justify-between rounded-t-lg px-3 py-2 ${COLUMN_HEADER[col.status]}`}
            >
              <span className="text-xs font-semibold">{col.label}</span>
              <span className="text-xs font-medium opacity-70">{colTasks.length}</span>
            </div>

            {/* Cards */}
            <div className="min-h-[60px] space-y-2 p-2">
              {colTasks.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                  <p className="text-xs text-muted-foreground/60">—</p>
                </div>
              ) : (
                colTasks.map((task) => {
                  const isOverdue =
                    task.dueDate !== null &&
                    new Date(task.dueDate) < today &&
                    task.status !== "completed";
                  const suggestion = suggestions.find(
                    (s) => s.jobId === task.id && !dismissedIds.has(task.id)
                  );

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDragId(task.id)}
                      onDragEnd={() => setDragId(null)}
                      className={[
                        "rounded-md border bg-card p-2.5 cursor-grab active:cursor-grabbing transition-opacity select-none",
                        dragId === task.id ? "opacity-40" : "",
                        isOverdue
                          ? "border-l-[3px] border-l-destructive border-t-border border-r-border border-b-border"
                          : "border-border",
                      ].join(" ")}
                    >
                      {/* AI suggestion banner */}
                      {suggestion && (
                        <div className="mb-2 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs dark:border-amber-800 dark:bg-amber-950/40">
                          <p className="mb-1.5 leading-snug text-amber-800 dark:text-amber-200">
                            <span className="font-medium">Tenant: </span>
                            {suggestion.reason}
                            <span className="text-amber-600 dark:text-amber-400">
                              {" "}
                              → move to{" "}
                              <strong>
                                {COLUMNS.find((c) => c.status === suggestion.suggestedStatus)?.label}
                              </strong>
                            </span>
                          </p>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() =>
                                acceptSuggestion(task.id, suggestion.suggestedStatus)
                              }
                              className="rounded bg-amber-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-amber-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => dismissSuggestion(task.id)}
                              className="rounded px-2 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/30"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Title */}
                      <p
                        dir="auto"
                        className="text-[13px] font-medium leading-tight text-foreground"
                      >
                        {task.title}
                      </p>

                      {/* Description */}
                      {task.description && (
                        <p
                          dir="auto"
                          className="mt-0.5 line-clamp-2 text-xs text-muted-foreground"
                        >
                          {task.description}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {CATEGORY_LABELS[task.category] ?? task.category}
                        </span>
                        {task.dueDate && (
                          <span
                            className={`text-[11px] tabular-nums ${
                              isOverdue ? "font-medium text-destructive" : "text-muted-foreground"
                            }`}
                          >
                            {new Date(task.dueDate).toLocaleDateString("en-GB")}
                          </span>
                        )}
                      </div>

                      {/* Fallback select for mobile / no-drag contexts */}
                      <select
                        value={task.status}
                        onChange={(e) => moveTask(task.id, e.target.value)}
                        className="mt-2 w-full cursor-pointer rounded border border-border bg-card px-1.5 py-1 text-[11px] text-muted-foreground md:hidden"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.status} value={c.status}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
