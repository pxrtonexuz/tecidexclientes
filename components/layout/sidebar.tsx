"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Package,
  Bot,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string }[];
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "CRM",
    icon: Users,
    children: [
      { label: "CRM Chat", href: "/crm/conversas" },
      { label: "Lista de Leads", href: "/crm/leads" },
    ],
  },
  {
    label: "Inteligência",
    icon: BarChart3,
    children: [
      { label: "Produto", href: "/inteligencia/produto" },
      { label: "Atendimento", href: "/inteligencia/atendimento" },
      { label: "Financeiro", href: "/inteligencia/financeiro" },
    ],
  },
  {
    label: "Catálogo",
    icon: Package,
    children: [
      { label: "Modelos", href: "/catalogo/modelos" },
      { label: "Tecidos", href: "/catalogo/tecidos" },
      { label: "Atributos", href: "/catalogo/atributos" },
    ],
  },
  {
    label: "Atendente IA",
    icon: Bot,
    children: [
      { label: "Saúde da IA", href: "/atendente/saude" },
    ],
  },
];


const navItemBase =
  "flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-all duration-180 cursor-pointer";

function TecidexMark({ collapsed }: { collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        T
      </div>
    );
  }

  return (
    <div>
      <p className="text-[1.18rem] font-medium uppercase tracking-[0.34em] text-white drop-shadow-[0_0_18px_rgba(16,185,129,0.18)]">
        Tecidex
      </p>
      <div className="mt-2 h-px w-14 bg-[#10b981]/70" />
    </div>
  );
}

function NavSection({
  item,
  collapsed,
  pathname,
  onExpand,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
  onExpand: () => void;
}) {
  const isActive = item.href
    ? pathname === item.href
    : item.children?.some((c) => pathname.startsWith(c.href)) ?? false;

  const [open, setOpen] = useState(isActive);
  const router = useRouter();

  const activeStyle: React.CSSProperties = {
    background: "rgba(16, 185, 129, 0.10)",
    border: "1px solid rgba(16, 185, 129, 0.23)",
    boxShadow: "0 10px 26px rgba(16, 185, 129, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.055)",
    color: "#6ee7b7",
  };

  if (item.href) {
    const Icon = item.icon;
    if (collapsed) {
      return (
        <TooltipProvider delay={0}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href={item.href}
                  className={cn(navItemBase, "justify-center", !isActive && "text-muted-foreground hover:text-foreground hover:bg-white/[0.045]")}
                  style={isActive ? activeStyle : undefined}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                </Link>
              }
            />
            <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <Link
        href={item.href}
        className={cn(navItemBase, !isActive && "text-muted-foreground hover:text-foreground hover:bg-white/[0.045]")}
        style={isActive ? activeStyle : undefined}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  }

  const Icon = item.icon;

  if (collapsed) {
    const firstChild = item.children?.[0]?.href;
    return (
      <TooltipProvider delay={0}>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => {
                  onExpand();
                  setOpen(true);
                  if (firstChild) router.push(firstChild);
                }}
                className={cn(
                  navItemBase,
                  "justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.045] w-full",
                  isActive && "text-[#6ee7b7]"
                )}
                style={isActive ? activeStyle : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
              </button>
            }
          />
          <TooltipContent side="right"><p>{item.label}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          navItemBase,
          "w-full justify-between",
          isActive ? "text-[#6ee7b7]" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.045]"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 shrink-0" />
          <span>{item.label}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1 ml-8 space-y-0.5">
          {item.children?.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block px-3 py-2 rounded-[8px] text-sm cursor-pointer transition-all duration-180",
                  childActive
                    ? "font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.045]"
                )}
                style={childActive ? { color: "#6ee7b7", background: "rgba(16,185,129,0.10)" } : undefined}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  companyName,
  userEmail,
  preferredName,
  fullName,
  accessRole,
  avatarUrl,
}: {
  companyName?: string;
  userEmail?: string;
  preferredName?: string;
  fullName?: string;
  accessRole?: string;
  avatarUrl?: string;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const displayName = preferredName || fullName || companyName || userEmail || "Usuario";
  const role = accessRole || "Admin";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen transition-all duration-300",
        collapsed ? "w-16" : "w-[244px]"
      )}
      style={{
        background: "rgba(11, 13, 25, 0.97)",
        backdropFilter: "blur(24px) saturate(135%)",
        WebkitBackdropFilter: "blur(24px) saturate(135%)",
        borderRight: "1px solid rgba(35, 39, 57, 0.78)",
        boxShadow: "8px 0 30px rgba(0, 0, 0, 0.24), inset -1px 0 0 rgba(255, 255, 255, 0.025)",
      }}
    >
      {/* Header — Tecidex logo */}
      <div
        className={cn("flex min-h-[88px] items-center px-4", collapsed ? "justify-center" : "justify-start")}
        style={{ borderBottom: "1px solid rgba(35, 39, 57, 0.72)" }}
      >
        <TecidexMark collapsed={collapsed} />
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[88px] z-10 w-6 h-6 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-180 hover:scale-110"
        style={{
          background: "rgba(10, 14, 22, 0.96)",
          border: "1px solid rgba(16, 185, 129, 0.24)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-muted-foreground" />
          : <ChevronLeft className="w-3 h-3 text-muted-foreground" />}
      </button>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto py-4 space-y-2", collapsed ? "px-2" : "px-4")}>
        {navItems.map((item) => (
          <NavSection
            key={item.label}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
            onExpand={() => setCollapsed(false)}
          />
        ))}
      </nav>

      {/* Footer — User section */}
      <div className="px-3 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid rgba(35, 39, 57, 0.72)" }}>
        {collapsed ? (
          <TooltipProvider delay={0}>
            <div className="space-y-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Link
                      href="/perfil"
                      className="flex h-10 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.045] hover:text-foreground"
                    >
                      <SlidersHorizontal className="w-4 h-4 shrink-0" />
                    </Link>
                  }
                />
                <TooltipContent side="right"><p>Configuracoes</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center p-2 rounded-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer transition-all duration-180"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                    </button>
                  }
                />
                <TooltipContent side="right"><p>Sair</p></TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-lg border border-[rgba(35,39,57,0.72)] bg-white/[0.025] p-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden text-sm font-semibold"
                style={{
                  background: "rgba(255, 255, 255, 0.11)",
                  border: "1px solid rgba(16, 185, 129, 0.24)",
                  color: "#6ee7b7",
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                  {role}
                </p>
              </div>
              <TooltipProvider delay={0}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Link
                        href="/perfil"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.055] hover:text-foreground"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Link>
                    }
                  />
                  <TooltipContent side="top"><p>Configuracoes</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors duration-180"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sair</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
