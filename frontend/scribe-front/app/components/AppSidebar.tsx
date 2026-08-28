"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Mic, Calendar, Users, Settings, Plus, LogOut } from "lucide-react";
import { MeetingAvatar } from "./MeetingAvatar";
import { clearToken } from "@/app/lib/auth";
import { apiFetch } from "@/app/lib/api";

interface AppSidebarProps {
  children?: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Réunions", icon: Calendar },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function AppSidebar({ children }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    apiFetch("/account/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((p) => { if (p?.email) setEmail(p.email); });
  }, []);

  function handleLogout() {
    clearToken();
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-background">
      <aside
        className="flex flex-col shrink-0 h-full border-r border-sidebar-border"
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
              Scribe
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

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {children}
      </main>
    </div>
  );
}
