import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  CalendarCheck,
  CalendarDays,
  HeartHandshake,
  LogOut,
  Pill,
  Settings,
  ShieldCheck,
  Siren,
  Stethoscope,
  Volume2,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { apiGet } from "@/lib/api";
import { endSession } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/permissions";
import type { CircleOut, UserOut } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AppContextValue {
  me: UserOut | null;
  circles: CircleOut[];
  circle: CircleOut | null;
  role: string;
  demoRole: string | null;
  setDemoRole: (role: string | null) => void;
  elderMode: boolean;
  toggleElderMode: () => void;
}

const AppContext = createContext<AppContextValue>({
  me: null,
  circles: [],
  circle: null,
  role: "",
  demoRole: null,
  setDemoRole: () => {},
  elderMode: false,
  toggleElderMode: () => {},
});

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  return useContext(AppContext);
}

const NAV = [
  { to: "/app", label: "Today", icon: CalendarCheck, end: true },
  { to: "/app/elder", label: "Elder View", icon: Volume2 },
  { to: "/app/medications", label: "Medications", icon: Pill },
  { to: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/app/appointments", label: "Appointments", icon: Stethoscope },
  { to: "/app/health", label: "Health Log", icon: Activity },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/members", label: "Consent Center", icon: ShieldCheck },
  { to: "/app/emergency", label: "Emergency Card", icon: Siren },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export default function AppShell() {
  const navigate = useNavigate();
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();
  const [circleId, setCircleId] = useState<string>(() => localStorage.getItem("cc_circle_id") ?? "");
  const [elderMode, setElderMode] = useState<boolean>(() => localStorage.getItem("cc_elder_mode") === "1");
  const [demoRole, setDemoRoleState] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("cc_demo_role") || null;
    }
    return null;
  });

  const setDemoRole = (newRole: string | null) => {
    setDemoRoleState(newRole);
    if (newRole) {
      localStorage.setItem("cc_demo_role", newRole);
    } else {
      localStorage.removeItem("cc_demo_role");
    }
  };

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<UserOut>("/auth/me"),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const circlesQuery = useQuery({
    queryKey: ["circles"],
    queryFn: () => apiGet<CircleOut[]>("/circles/mine"),
    enabled: !!meQuery.data,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) navigate("/login", { replace: true });
  }, [meQuery.isError, navigate]);

  const circles = circlesQuery.data ?? [];
  useEffect(() => {
    if (circles.length > 0 && !circles.some((c) => c.id === circleId)) {
      setCircleId(circles[0].id);
    }
  }, [circles, circleId]);

  useEffect(() => {
    if (circleId) localStorage.setItem("cc_circle_id", circleId);
  }, [circleId]);

  useEffect(() => {
    document.documentElement.classList.toggle("elder-mode", elderMode);
  }, [elderMode]);

  const rawCircle = circles.find((c) => c.id === circleId) ?? null;
  const effectiveRole = demoRole || meQuery.data?.role || rawCircle?.role || "ELDER_OWNER";
  const circle = useMemo(() => {
    if (!rawCircle) return null;
    return {
      ...rawCircle,
      role: effectiveRole,
    };
  }, [rawCircle, effectiveRole]);

  const value = useMemo<AppContextValue>(
    () => ({
      me: meQuery.data ?? null,
      circles,
      circle,
      role: effectiveRole,
      demoRole,
      setDemoRole,
      elderMode,
      toggleElderMode: () =>
        setElderMode((v) => {
          const next = !v;
          localStorage.setItem("cc_elder_mode", next ? "1" : "0");
          return next;
        }),
    }),
    [meQuery.data, circles, circle, effectiveRole, demoRole, elderMode]
  );

  return (
    <AppContext.Provider value={value}>
      <div className="min-h-svh w-full bg-background flex flex-col">
        <header className="sticky top-0 z-40 border-b border-[#24444B] bg-[#132A2F] text-white w-full">
          <div className="flex h-14 w-full items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8">
            <NavLink to="/app" className="flex items-center gap-2 shrink-0">
              <HeartHandshake className="h-6 w-6 shrink-0 text-[#6EE7B7]" aria-hidden />
              <span className="font-heading text-lg font-semibold tracking-tight">CareCircle</span>
            </NavLink>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              {/* Offline & Sync Status Pill */}
              {!isOnline && (
                <Badge
                  variant="outline"
                  className="border-amber-400/50 bg-amber-500/20 text-amber-300 text-[11px] gap-1 cursor-pointer flex items-center px-2 py-0.5"
                  onClick={syncNow}
                  data-testid="offline-status-badge"
                  title="Click to attempt sync when online"
                >
                  <WifiOff className="h-3 w-3 shrink-0" />
                  <span className="hidden sm:inline">Offline</span>
                  {pendingCount > 0 && <span>({pendingCount})</span>}
                </Badge>
              )}
              {isOnline && pendingCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-teal-400/50 bg-teal-500/20 text-teal-300 text-[11px] gap-1 cursor-pointer flex items-center px-2 py-0.5 animate-pulse"
                  onClick={syncNow}
                  data-testid="syncing-status-badge"
                  title="Click to sync pending records now"
                >
                  <RefreshCw className={cn("h-3 w-3 shrink-0", isSyncing && "animate-spin")} />
                  <span>Sync ({pendingCount})</span>
                </Badge>
              )}

              {circles.length > 1 && (
                <Select value={circleId} onValueChange={(v: string) => setCircleId(v)}>
                  <SelectTrigger
                    className="h-9 w-[150px] sm:w-[180px] border-[#24444B] bg-[#1C3D43] text-white text-xs sm:text-sm"
                    data-testid="circle-switcher-select"
                  >
                    <SelectValue>{circle?.name ?? "Circle"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {circles.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Interactive Demo Role Switcher */}
              <div className="flex items-center gap-1.5" data-testid="role-switcher-container">
                <Select
                  value={effectiveRole}
                  onValueChange={(val: string) => setDemoRole(val)}
                >
                  <SelectTrigger
                    className="h-9 border-[#376974] bg-[#1C3D43] text-white text-xs font-medium px-2.5 sm:px-3 focus:ring-0 focus:ring-offset-0"
                    data-testid="role-switcher-select"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="hidden lg:inline text-[#9FB8B6] text-xs">Role:</span>
                      <span className="font-semibold text-[#6EE7B7] text-xs">
                        {effectiveRole === "ELDER_OWNER" && "👴 Elder"}
                        {effectiveRole === "CARETAKER" && "🩺 Caretaker"}
                        {effectiveRole === "FAMILY" && "👨‍👩‍👧 Family"}
                        {effectiveRole === "DOCTOR_VIEWER" && "👨‍⚕️ Doctor"}
                      </span>
                      {demoRole && (
                        <span className="rounded bg-[#0E494C] px-1 text-[10px] text-[#A7F3D0] hidden md:inline">Demo</span>
                      )}
                    </div>
                  </SelectTrigger>
                  <SelectContent className="border-[#24444B] bg-[#132A2F] text-white shadow-xl">
                    <SelectItem value="ELDER_OWNER" className="cursor-pointer hover:bg-[#1C3D43] focus:bg-[#1C3D43] focus:text-white">
                      👴 Elder / Patient View
                    </SelectItem>
                    <SelectItem value="CARETAKER" className="cursor-pointer hover:bg-[#1C3D43] focus:bg-[#1C3D43] focus:text-white">
                      🩺 Caretaker / Nurse View
                    </SelectItem>
                    <SelectItem value="FAMILY" className="cursor-pointer hover:bg-[#1C3D43] focus:bg-[#1C3D43] focus:text-white">
                      👨‍👩‍👧 Family Member View
                    </SelectItem>
                    <SelectItem value="DOCTOR_VIEWER" className="cursor-pointer hover:bg-[#1C3D43] focus:bg-[#1C3D43] focus:text-white">
                      👨‍⚕️ Doctor / Clinician (Read-Only)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <span className="hidden text-sm text-[#CBD5E1] xl:inline" data-testid="header-user-name">
                {meQuery.data?.full_name ?? ""}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-white hover:bg-[#1C3D43] hover:text-white shrink-0"
                onClick={() => endSession()}
                data-testid="sign-out-button"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex w-full flex-1 min-h-[calc(100svh-3.5rem)]">
          <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] w-64 shrink-0 flex-col justify-between border-r border-[#24444B] bg-[#132A2F] p-4 text-white lg:flex">
            <nav className="flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#CBD5E1] transition-colors hover:bg-[#1C3D43] hover:text-white",
                      isActive && "bg-[#116B70] text-white hover:bg-[#116B70]"
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="border-t border-[#24444B] pt-3 text-xs text-[#9FB8B6]">
              {circle ? (
                <p data-testid="sidebar-circle-summary">
                  {circle.name} · {circle.elder_name || "Elder"} · {circle.member_count} member
                  {circle.member_count === 1 ? "" : "s"}
                </p>
              ) : (
                <p>No care circle yet</p>
              )}
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            <nav className="flex gap-1 overflow-x-auto border-b bg-card px-3 py-2 lg:hidden">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground",
                      isActive && "bg-primary text-primary-foreground"
                    )
                  }
                >
                  <item.icon className="h-3.5 w-3.5" aria-hidden />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            {meQuery.isLoading ? (
              <div className="grid grid-cols-1 gap-6 p-4 md:p-8 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-8">
                  <div className="h-48 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-64 animate-pulse rounded-2xl bg-muted" />
                </div>
                <div className="space-y-6 lg:col-span-4">
                  <div className="h-40 animate-pulse rounded-2xl bg-muted" />
                  <div className="h-32 animate-pulse rounded-2xl bg-muted" />
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </main>
        </div>
      </div>
    </AppContext.Provider>
  );
}
