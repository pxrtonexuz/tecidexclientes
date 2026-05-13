"use client";

import { useState } from "react";
import Image from "next/image";
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
      { label: "Kanban", href: "/crm/kanban" },
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
      { label: "Chat", href: "/atendente/chat" },
    ],
  },
];


const navItemBase =
  "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-180 cursor-pointer";

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
    background: "rgba(15, 107, 63, 0.22)",
    border: "1px solid rgba(57, 217, 138, 0.26)",
    boxShadow: "0 2px 12px rgba(57, 217, 138, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
    color: "#39d98a",
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
                  className={cn(navItemBase, !isActive && "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
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
        className={cn(navItemBase, !isActive && "text-muted-foreground hover:text-foreground hover:bg-muted/50")}
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
                  "text-muted-foreground hover:text-foreground hover:bg-muted/50 w-full",
                  isActive && "text-[#39d98a]"
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
          isActive ? "text-[#39d98a]" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                style={childActive ? { color: "#39d98a", background: "rgba(15,107,63,0.22)" } : undefined}
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

export function Sidebar({ companyName, userEmail }: { companyName?: string; userEmail?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
        collapsed ? "w-16" : "w-64"
      )}
      style={{
        background: "rgba(4, 21, 13, 0.9)",
        backdropFilter: "blur(44px) saturate(155%)",
        WebkitBackdropFilter: "blur(44px) saturate(155%)",
        borderRight: "1px solid rgba(255, 255, 255, 0.11)",
        boxShadow: "4px 0 32px rgba(0, 0, 0, 0.4), inset -1px 0 0 rgba(255, 255, 255, 0.06)",
      }}
    >
      {/* Header — Tecidex logo */}
      <div
        className="flex items-center justify-center px-4 py-5"
        style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.09)" }}
      >
        {!collapsed ? (
          <Image
            src="/LogoTecidexPlataforma.png"
            alt="Tecidex"
            width={132}
            height={52}
            className="object-contain"
          />
        ) : (
          <Image
            src="/LogoTecidexPlataforma.png"
            alt="Tecidex"
            width={36}
            height={36}
            className="object-contain"
          />
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-all duration-180 hover:scale-110"
        style={{
          background: "rgba(5, 12, 8, 0.9)",
          border: "1px solid rgba(57, 217, 138, 0.28)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        }}
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-muted-foreground" />
          : <ChevronLeft className="w-3 h-3 text-muted-foreground" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
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
      <div className="px-3 pb-4 pt-3 space-y-3" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.09)" }}>
        {collapsed ? (
          <TooltipProvider delay={0}>
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
          </TooltipProvider>
        ) : (
          <>
            {/* User info row */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
                style={{
                  background: "rgba(255, 255, 255, 0.11)",
                  border: "1px solid rgba(57, 217, 138, 0.28)",
                  color: "#39d98a",
                }}
              >
                {(companyName ?? userEmail ?? "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                  {companyName ?? "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                  Admin
                </p>
              </div>
            </div>

            {/* Logout */}
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
