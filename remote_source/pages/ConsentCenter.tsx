import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Copy, KeyRound, RotateCcw, ShieldCheck, Trash2, UserCheck, X } from "lucide-react";
import { useApp } from "@/components/AppShell";
import NoCircle from "@/components/NoCircle";
import { apiErrorMessage, fmtDateTime, relativeFromNow } from "@/lib/format";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { can, ROLE_LABELS } from "@/lib/permissions";
import type { AuditOut, ChangeRequestOut, MemberOut, PasscodeOut, PasscodeStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OVERRIDE_ACTIONS = [
  { key: "log_doses", label: "Log doses" },
  { key: "add_notes", label: "Add care notes" },
  { key: "add_vitals", label: "Add vitals" },
  { key: "edit_appointments", label: "Edit appointments" },
  { key: "view_audit", label: "View audit log" },
];

// Members & Consent Center: passcode, approvals, roles, permissions, change requests, audit.
export default function ConsentCenter() {
  const { circle, role } = useApp();
  const circleId = circle?.id ?? null;
  const queryClient = useQueryClient();
  const [newPasscode, setNewPasscode] = useState<PasscodeOut | null>(null);
  const [permissionsFor, setPermissionsFor] = useState<MemberOut | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const passcodeQuery = useQuery({
    queryKey: ["passcode", circleId],
    queryFn: () => apiGet<PasscodeStatus>(`/circles/${circleId}/passcode`),
    enabled: !!circleId && can({ role, permissions: {} }, "manage_members"),
  });
  const membersQuery = useQuery({
    queryKey: ["members", circleId],
    queryFn: () => apiGet<MemberOut[]>(`/circles/${circleId}/pending-members`),
    enabled: !!circleId && can({ role, permissions: {} }, "manage_members"),
  });
  const allMembersQuery = useQuery({
    queryKey: ["members-all", circleId],
    queryFn: () => apiGet<MemberOut[]>(`/circles/${circleId}/members`),
    enabled: !!circleId,
  });
  const requestsQuery = useQuery({
    queryKey: ["change-requests", circleId],
    queryFn: () => apiGet<ChangeRequestOut[]>(`/circles/${circleId}/change-requests`),
    enabled: !!circleId,
  });
  const auditQuery = useQuery({
    queryKey: ["audit", circleId],
    queryFn: () => apiGet<AuditOut[]>(`/circles/${circleId}/audit`),
    enabled: !!circleId && can({ role, permissions: {} }, "view_audit"),
  });

  const rotate = useMutation({
    mutationFn: () => apiPost<PasscodeOut>(`/circles/${circleId}/passcode/rotate`),
    onSuccess: (p) => {
      setNewPasscode(p);
      queryClient.invalidateQueries({ queryKey: ["passcode", circleId] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const approve = useMutation({
    mutationFn: (memberId: string) => apiPost<MemberOut>(`/circles/${circleId}/members/${memberId}/approve`, { permissions: {} }),
    onSuccess: () => {
      toast.success("Member approved — they now have access.");
      queryClient.invalidateQueries({ queryKey: ["members", circleId] });
      queryClient.invalidateQueries({ queryKey: ["members-all", circleId] });
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: (memberId: string) => apiDelete<MemberOut>(`/circles/${circleId}/members/${memberId}`),
    onSuccess: () => {
      toast.success("Member removed — their access ends immediately.");
      queryClient.invalidateQueries({ queryKey: ["members-all", circleId] });
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const savePermissions = useMutation({
    mutationFn: () => apiPatch<MemberOut>(`/circles/${circleId}/members/${permissionsFor!.id}/permissions`, { permissions: overrides }),
    onSuccess: () => {
      toast.success("Permissions updated");
      queryClient.invalidateQueries({ queryKey: ["members-all", circleId] });
      setPermissionsFor(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const decideRequest = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "reject" }) =>
      apiPost<ChangeRequestOut>(`/circles/${circleId}/change-requests/${id}/${decision}`),
    onSuccess: (cr) => {
      toast.success(cr.status === "APPROVED" ? "Change request approved and applied." : "Change request rejected.");
      queryClient.invalidateQueries({ queryKey: ["change-requests", circleId] });
      queryClient.invalidateQueries({ queryKey: ["medications", circleId] });
      queryClient.invalidateQueries({ queryKey: ["doses", circleId] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  if (!circle) return <NoCircle />;

  const isElder = can({ role, permissions: {} }, "manage_members");
  const members = allMembersQuery.data ?? [];
  const pending = membersQuery.data ?? [];
  const requests = requestsQuery.data ?? [];
  const pendingRequests = requests.filter((r) => r.status === "PENDING");
  const decided = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-6 p-4 md:p-8" data-testid="consent-center-page">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Consent Center</h1>
        <p className="text-sm text-muted-foreground">
          The elder decides who joins, what they can do, and every change is on the record.
        </p>
      </div>

      {isElder && (
        <div className="rounded-2xl border bg-card p-6" data-testid="passcode-card">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <KeyRound className="h-5 w-5 text-primary" aria-hidden /> Circle passcode
          </h2>
          {newPasscode ? (
            <div className="mt-3 rounded-xl border border-[#86EFAC] bg-[#F0FDF4] p-4" data-testid="passcode-new-display">
              <p className="text-sm text-[#15803D]">New passcode — share it with the person you’re inviting:</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-[#15803D]" data-testid="passcode-value">{newPasscode.passcode}</p>
              <p className="mt-1 text-xs text-[#15803D]">
                Expires {fmtDateTime(newPasscode.expires_at)} · {newPasscode.max_uses} uses max
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard?.writeText(newPasscode.passcode)} data-testid="passcode-copy-button">
                  <Copy className="h-3.5 w-3.5" aria-hidden /> Copy
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setNewPasscode(null)} data-testid="passcode-dismiss-button">Dismiss</Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground" data-testid="passcode-status-line">
                {passcodeQuery.data?.has_passcode
                  ? `Active · ${passcodeQuery.data.uses}/${passcodeQuery.data.max_uses} uses${passcodeQuery.data.expires_at ? ` · expires ${relativeFromNow(passcodeQuery.data.expires_at)}` : ""}`
                  : "No passcode yet — generate one to invite someone."}
              </p>
              <Button size="sm" onClick={() => rotate.mutate()} disabled={rotate.isPending} data-testid="passcode-rotate-button">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden /> {passcodeQuery.data?.has_passcode ? "Rotate passcode" : "Generate passcode"}
              </Button>
            </div>
          )}
        </div>
      )}

      {isElder && (
        <div className="rounded-2xl border bg-card p-6" data-testid="pending-approvals-card">
          <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
            <UserCheck className="h-5 w-5 text-primary" aria-hidden /> Join requests
            {pending.length > 0 && <Badge data-testid="pending-count-badge">{pending.length}</Badge>}
          </h2>
          {pending.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {pending.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3" data-testid={`pending-member-${m.id}`}>
                  <div>
                    <p className="font-medium" data-testid={`pending-name-${m.id}`}>{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.email} · wants to join as {ROLE_LABELS[m.role] ?? m.role}</p>
                  </div>
                  <Button size="sm" onClick={() => approve.mutate(m.id)} disabled={approve.isPending} data-testid={`approve-member-${m.id}`}>
                    <Check className="h-3.5 w-3.5" aria-hidden /> Approve
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-2xl border bg-card p-6" data-testid="members-card">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden /> Members
        </h2>
        <div className="mt-3 space-y-2">
          {members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3" data-testid={`member-row-${m.id}`}>
              <div>
                <p className="font-medium" data-testid={`member-name-${m.id}`}>
                  {m.full_name}
                  {m.user_id === role ? "" : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ROLE_LABELS[m.role] ?? m.role} · {m.status.toLowerCase()} · {m.email}
                </p>
              </div>
              <div className="flex gap-2">
                {isElder && m.status === "ACTIVE" && m.role !== "ELDER_OWNER" && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPermissionsFor(m);
                        setOverrides({
                          log_doses: m.permissions["log_doses"] === undefined ? true : Boolean(m.permissions["log_doses"]),
                          add_notes: m.permissions["add_notes"] === undefined ? m.role !== "DOCTOR_VIEWER" : Boolean(m.permissions["add_notes"]),
                          add_vitals: Boolean(m.permissions["add_vitals"]),
                          edit_appointments: m.permissions["edit_appointments"] === undefined ? m.role !== "DOCTOR_VIEWER" : Boolean(m.permissions["edit_appointments"]),
                          view_audit: Boolean(m.permissions["view_audit"]),
                        });
                      }}
                      data-testid={`member-permissions-${m.id}`}
                    >
                      Permissions
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => remove.mutate(m.id)} data-testid={`member-remove-${m.id}`}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
          {members.length === 0 && <p className="text-sm text-muted-foreground">Loading members…</p>}
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6" data-testid="change-requests-card">
        <h2 className="font-heading text-lg font-semibold">Change requests</h2>
        <p className="text-sm text-muted-foreground">Family members propose medication changes; the elder or caretaker decides.</p>
        {pendingRequests.length > 0 && (
          <ul className="mt-3 space-y-2">
            {pendingRequests.map((r) => (
              <li key={r.id} className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3" data-testid={`change-request-${r.id}`}>
                <p className="text-sm">
                  <strong>{r.requested_by_name}</strong> proposes an edit to <strong>{r.entity_name}</strong>
                  {r.payload && Object.keys(r.payload).length > 0 && (
                    <span className="text-muted-foreground"> — {Object.entries(r.payload).map(([k, v]) => `${k}: ${String(v)}`).join(", ")}</span>
                  )}
                </p>
                {r.note && <p className="mt-1 text-sm text-muted-foreground">“{r.note}”</p>}
                {can({ role, permissions: {} }, "edit_medications") && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => decideRequest.mutate({ id: r.id, decision: "approve" })} disabled={decideRequest.isPending} data-testid={`change-request-approve-${r.id}`}>
                      <Check className="h-3.5 w-3.5" aria-hidden /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => decideRequest.mutate({ id: r.id, decision: "reject" })} disabled={decideRequest.isPending} data-testid={`change-request-reject-${r.id}`}>
                      <X className="h-3.5 w-3.5" aria-hidden /> Reject
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {pendingRequests.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No pending requests.</p>}
        {decided.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground" data-testid="change-requests-history">
            {decided.slice(0, 5).map((r) => (
              <li key={r.id}>
                {r.entity_name} — {r.status.toLowerCase()} by elder · {relativeFromNow(r.decided_at ?? r.created_at)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {can({ role, permissions: {} }, "view_audit") && (
        <div className="rounded-2xl border bg-card p-6" data-testid="audit-card">
          <h2 className="font-heading text-lg font-semibold">Audit log</h2>
          <p className="text-sm text-muted-foreground">Every mutation, with who and when. Immutable.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">When</th>
                  <th className="py-2 pr-4 font-medium">Who</th>
                  <th className="py-2 pr-4 font-medium">Action</th>
                  <th className="py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody data-testid="audit-table">
                {(auditQuery.data ?? []).slice(0, 20).map((a) => (
                  <tr key={a.id} className="border-t" data-testid={`audit-row-${a.id}`}>
                    <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">{relativeFromNow(a.created_at)}</td>
                    <td className="py-2 pr-4">{a.actor_name} <span className="text-muted-foreground">({ROLE_LABELS[a.actor_role] ?? a.actor_role})</span></td>
                    <td className="py-2 pr-4 font-mono text-xs">{a.action}</td>
                    <td className="py-2 text-muted-foreground">
                      {a.after_json && Object.keys(a.after_json).length > 0
                        ? Object.entries(a.after_json).slice(0, 2).map(([k, v]) => `${k}: ${String(v)}`).join(", ")
                        : a.entity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!permissionsFor} onOpenChange={(open) => !open && setPermissionsFor(null)}>
        <DialogContent data-testid="permissions-dialog">
          <DialogHeader>
            <DialogTitle>Permissions — {permissionsFor?.full_name}</DialogTitle>
            <DialogDescription>Overrides on top of the {ROLE_LABELS[permissionsFor?.role ?? ""] ?? ""} defaults.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {OVERRIDE_ACTIONS.map((a) => (
              <label key={a.key} className="flex items-center gap-3 rounded-xl border p-3 text-sm" data-testid={`permission-toggle-${a.key}`}>
                <Checkbox checked={!!overrides[a.key]} onCheckedChange={(checked) => setOverrides((o) => ({ ...o, [a.key]: checked === true }))} />
                {a.label}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => savePermissions.mutate()} disabled={savePermissions.isPending} data-testid="permissions-save-button">
              Save permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
