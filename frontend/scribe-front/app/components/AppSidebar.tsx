"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Mic, Calendar, Users, Settings, Plus, LogOut, BarChart2, Menu } from "lucide-react";
import { MeetingAvatar } from "./MeetingAvatar";
import { clearToken } from "@/app/lib/auth";
import { apiFetch } from "@/app/lib/api";
import { useRecording } from "@/app/lib/recording-context";

interface AppSidebarProps {
  children?: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Réunions", icon: Calendar },
  { href: "/dashboard", label: "Tableau de bord", icon: BarChart2 },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function AppSidebar({ children }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { meetingId: recordingMeetingId, recordingState } = useRecording();
  const isRecording = recordingMeetingId !== null && (recordingState === "recording" || recordingState === "paused");

  useEffect(() => {
    apiFetch("/account/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((p) => { if (p?.email) setEmail(p.email); })
      .catch(() => {});
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-20 flex flex-col h-full border-r border-sidebar-border transition-transform duration-200 lg:relative lg:translate-x-0 lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 240, background: "var(--sidebar)" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 pt-[18px] pb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center bg-primary"
            >
              <Mic size={11} color="white" strokeWidth={2.5} />
            </div>
            <span className="text-[13.5px] font-medium text-foreground tracking-tight">
              Metis
            </span>
          </div>
          <Link
            href="/reunions/new"
            className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            <Plus size={14} strokeWidth={2} />
          </Link>
        </div>

        <div className="h-px mx-3 mb-2 bg-sidebar-border" />

        {/* Navigation */}
        <nav className="px-1.5 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors relative ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-primary" />
                )}
                <Icon size={15} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile footer */}
        <div className="px-3 py-3 flex items-center gap-2.5 border-t border-sidebar-border">
          <MeetingAvatar name={email} size={26} />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] truncate font-medium text-foreground">
              {email || "…"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={14} strokeWidth={2} />
          </button>
        </div>
      </aside>

      {/* Recording floating badge */}
      {isRecording && (
        <Link
          href={`/reunions/${recordingMeetingId}`}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg bg-background border border-border transition-colors hover:bg-muted"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-[12.5px] font-medium text-red-600">
            {recordingState === "paused" ? "En pause" : "Enregistrement en cours"}
          </span>
        </Link>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-medium text-foreground">Metis</span>
        </div>
        {children}
      </main>
    </div>
  );
}
