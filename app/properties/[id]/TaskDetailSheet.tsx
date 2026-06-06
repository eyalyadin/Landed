"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, Send, X } from "lucide-react";

// TaskItem mirrors the extended type in TasksBoard.tsx
export type TaskItem = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  status: string;
  priority: string;
  dueDate: string | null;
  contractorName: string | null;
  notes: string | null;
  createdAt: string;
  attachments: { id: number; telegramFileId: string; caption: string | null }[];
};

type Vendor = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  category: string;
  serviceArea: string;
  notes: string | null;
  isPreferred: boolean;
  contactPerson: string | null;
  rating: number | null;
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const CATEGORY_LABELS: Record<string, string> = {
  repair: "Repair",
  payment_followup: "Payment Follow-up",
  contract_renewal: "Contract Renewal",
  tenant_issue: "Tenant Issue",
  inspection: "Inspection",
  maintenance: "Maintenance",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  waiting_on_tenant: "Waiting on Tenant",
  waiting_on_vendor: "Waiting on Vendor",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  waiting_on_tenant: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  waiting_on_vendor: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
};

const VENDOR_CATEGORY_LABELS: Record<string, string> = {
  ac_hvac: "AC/HVAC",
  electrician: "Electrician",
  plumbing: "Plumbing",
  painting: "Painting",
  locksmith: "Locksmith",
  handyman: "Handyman",
  cleaning: "Cleaning",
  appliance_repair: "Appliance Repair",
  pest_control: "Pest Control",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

interface Props {
  task: TaskItem | null;
  propertyId: number;
  tenant: { id: number; name: string; telegramLinked: boolean } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailSheet({ task, propertyId, tenant, open, onOpenChange }: Props) {
  const router = useRouter();

  // Edit form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("repair");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Vendor state
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoaded, setVendorsLoaded] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Notify tenant state
  const [notifyDraft, setNotifyDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);

  // Seed edit state from task whenever it changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority ?? "medium");
    setCategory(task.category ?? "repair");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setNotes(task.notes ?? "");
    setSaveError(null);
    setAssignError(null);
    setNotifyDraft("");
    setSentOk(false);
    setNotifyError(null);
    setSelectedVendorId(
      task.contractorName
        ? (vendors.find((v) => v.name === task.contractorName)?.id?.toString() ?? "")
        : ""
    );
  }, [task?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load vendors once on first open
  useEffect(() => {
    if (!open || vendorsLoaded) return;
    fetch("/api/vendors")
      .then((r) => r.json())
      .then((data: Vendor[]) => {
        setVendors(data);
        setVendorsLoaded(true);
        // Try to pre-select if task already has a contractorName
        if (task?.contractorName) {
          const match = data.find((v) => v.name === task.contractorName);
          if (match) setSelectedVendorId(String(match.id));
        }
      })
      .catch(() => setVendorsLoaded(true));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task) return null;

  const selectedVendor = vendors.find((v) => String(v.id) === selectedVendorId) ?? null;
  const today = new Date();
  const isOverdue =
    task.dueDate !== null &&
    new Date(task.dueDate) < today &&
    task.status !== "completed";

  async function handleSave() {
    if (!task) return;
    setSaving(true);
    setSaveError(null);
    const res = await fetch(`/api/jobs/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || undefined,
        description: description.trim() || null,
        priority,
        category,
        dueDate: dueDate || null,
        notes: notes.trim() || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      router.refresh();
      onOpenChange(false);
    } else {
      const d = await res.json().catch(() => ({}));
      setSaveError((d as { error?: string }).error ?? "Save failed");
    }
  }

  async function handleAssign() {
    if (!task || !selectedVendor) return;
    setAssigning(true);
    setAssignError(null);
    const res = await fetch(`/api/jobs/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractorName: selectedVendor.name,
        status: "waiting_on_vendor",
      }),
    });
    setAssigning(false);
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setAssignError((d as { error?: string }).error ?? "Assign failed");
    }
  }

  async function handleDraftNotice() {
    if (!selectedVendor || !tenant) return;
    setDrafting(true);
    setNotifyError(null);
    const res = await fetch("/api/tasks/draft-vendor-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: tenant.id,
        vendorName: selectedVendor.name,
        vendorPhone: selectedVendor.phone,
        jobTitle: task?.title ?? "",
      }),
    });
    setDrafting(false);
    const d = await res.json().catch(() => ({}));
    if (d.draft) {
      setNotifyDraft(d.draft);
    } else {
      setNotifyError("Could not generate draft");
    }
  }

  async function handleSendNotice() {
    if (!tenant || !notifyDraft.trim()) return;
    setSending(true);
    setNotifyError(null);
    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: tenant.id, body: notifyDraft }),
    });
    setSending(false);
    if (res.ok) {
      setSentOk(true);
      setTimeout(() => setSentOk(false), 4000);
      setNotifyDraft("");
    } else {
      const d = await res.json().catch(() => ({}));
      setNotifyError((d as { error?: string }).error ?? "Send failed");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-sm font-semibold leading-tight">
                Repair Request
              </SheetTitle>
              <SheetDescription className="sr-only">
                Edit repair request details and assign a vendor
              </SheetDescription>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[task.status] ?? "bg-muted text-muted-foreground"}`}
                >
                  {STATUS_LABELS[task.status] ?? task.status}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${PRIORITY_COLORS[task.priority] ?? "bg-muted text-muted-foreground"}`}
                >
                  {PRIORITY_LABELS[task.priority] ?? task.priority}
                </span>
                {isOverdue && (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                    Overdue
                  </span>
                )}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 px-5 py-5">

          {/* ── Edit fields ── */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Details
            </p>
            <div className="space-y-3">
              {/* Title */}
              <div>
                <p className="mb-1 text-xs font-medium text-foreground">Title</p>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short description of the problem"
                  className="h-8 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <p className="mb-1 text-xs font-medium text-foreground">Description</p>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details about the issue…"
                  className="min-h-[72px] text-sm"
                />
              </div>

              {/* Priority + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-foreground">Priority</p>
                  <Select value={priority} onValueChange={(v) => { if (v !== null) setPriority(v); }}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v} className="text-sm">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-foreground">Category</p>
                  <Select value={category} onValueChange={(v) => { if (v !== null) setCategory(v); }}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v} className="text-sm">{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due date */}
              <div>
                <p className="mb-1 text-xs font-medium text-foreground">Due date</p>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Notes */}
              <div>
                <p className="mb-1 text-xs font-medium text-foreground">Notes</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes…"
                  className="min-h-[60px] text-sm"
                />
              </div>

              {saveError && <p className="text-xs text-destructive">{saveError}</p>}
              <Button onClick={handleSave} disabled={saving} size="sm" className="w-full h-8">
                {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </section>

          {/* ── Photos ── */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Photos
            </p>
            {task.attachments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No photos attached</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {task.attachments.map((att) => (
                  <div key={att.id} className="relative">
                    <img
                      src={`/api/photo/${att.telegramFileId}`}
                      alt={att.caption ?? "Maintenance photo"}
                      className="h-20 w-20 rounded-md border border-border object-cover"
                    />
                    {att.caption && (
                      <p className="mt-0.5 w-20 truncate text-[10px] text-muted-foreground">
                        {att.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Assign vendor ── */}
          <section>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Assign repair professional
            </p>
            {task.contractorName && (
              <div dir="auto" className="mb-2 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <span className="font-medium">Currently assigned:</span> {task.contractorName}
              </div>
            )}
            <Select value={selectedVendorId} onValueChange={(v) => { if (v !== null) setSelectedVendorId(v); }}>
              <SelectTrigger className="h-8 text-sm w-full">
                <SelectValue placeholder="Select a vendor…" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)} className="text-sm">
                    {v.isPreferred ? "⭐ " : ""}{v.name}
                    {" · "}{VENDOR_CATEGORY_LABELS[v.category] ?? v.category}
                    {v.rating != null ? ` · ★${v.rating.toFixed(1)}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedVendor && (
              <div className="mt-2 rounded-md border border-border bg-muted/30 p-2.5 space-y-0.5 text-xs">
                <p><span className="font-medium">Phone:</span> {selectedVendor.phone}</p>
                {selectedVendor.contactPerson && (
                  <p><span className="font-medium">Contact:</span> {selectedVendor.contactPerson}</p>
                )}
                {selectedVendor.serviceArea && (
                  <p><span className="font-medium">Area:</span> {selectedVendor.serviceArea}</p>
                )}
                {selectedVendor.notes && (
                  <p className="text-muted-foreground">{selectedVendor.notes}</p>
                )}
              </div>
            )}

            {assignError && <p className="mt-1 text-xs text-destructive">{assignError}</p>}
            <Button
              onClick={handleAssign}
              disabled={!selectedVendor || assigning}
              variant="outline"
              size="sm"
              className="mt-2 w-full h-8 text-[12px]"
            >
              {assigning ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              {assigning ? "Assigning…" : "Assign vendor → Waiting on Vendor"}
            </Button>
          </section>

          {/* ── Notify tenant ── */}
          {tenant?.telegramLinked && (
            <section>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Notify tenant
              </p>
              {!selectedVendor ? (
                <p className="text-xs text-muted-foreground">Assign a vendor above to enable tenant notification.</p>
              ) : (
                <div className="space-y-2">
                  {!notifyDraft && !sentOk && (
                    <Button
                      onClick={handleDraftNotice}
                      disabled={drafting}
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-[12px]"
                    >
                      {drafting ? (
                        <>
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Thinking…
                        </>
                      ) : (
                        <>
                          <Lightbulb className="mr-1.5 h-3.5 w-3.5" />
                          Draft message for tenant
                        </>
                      )}
                    </Button>
                  )}

                  {sentOk && (
                    <p className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      ✓ Message sent to <span dir="auto">{tenant.name}</span>
                    </p>
                  )}

                  {notifyDraft && (
                    <>
                      <Textarea
                        value={notifyDraft}
                        onChange={(e) => setNotifyDraft(e.target.value)}
                        className="min-h-[80px] text-sm"
                        placeholder="Message to tenant…"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSendNotice}
                          disabled={sending || !notifyDraft.trim()}
                          size="sm"
                          className="flex-1 h-8 text-[12px]"
                        >
                          {sending ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {sending ? "Sending…" : <>Send to <span dir="auto">{tenant.name}</span></>}
                        </Button>
                        <Button
                          onClick={() => setNotifyDraft("")}
                          variant="outline"
                          size="sm"
                          className="h-8 text-[12px]"
                        >
                          Discard
                        </Button>
                      </div>
                    </>
                  )}

                  {notifyError && <p className="text-xs text-destructive">{notifyError}</p>}
                </div>
              )}
            </section>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}
