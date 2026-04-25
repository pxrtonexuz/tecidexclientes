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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

function NavSection({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
}) {
  const isActive = item.href
    ? pathname === item.href
    : item.children?.some((c) => pathname.startsWith(c.href)) ?? false;

  const [open, setOpen] = useState(isActive);

  if (item.href) {
    const Icon = item.icon;
    const linkClass = cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
      "hover:bg-accent hover:text-accent-foreground",
      isActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
    );
    if (collapsed) {
      return (
        <TooltipProvider delay={0}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link href={item.href} className={linkClass}>
                  <Icon className="w-5 h-5 shrink-0" />
                </Link>
              }
            />
            <TooltipContent side="right">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return (
      <Link href={item.href} className={linkClass}>
        <Icon className="w-5 h-5 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  }

  const Icon = item.icon;

  if (collapsed) {
    const divClass = cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors",
      "hover:bg-accent hover:text-accent-foreground",
      isActive ? "text-primary" : "text-muted-foreground"
    );
    return (
      <TooltipProvider delay={0}>
        <Tooltip>
          <TooltipTrigger
            render={
              <div className={divClass}>
                <Icon className="w-5 h-5 shrink-0" />
              </div>
            }
          />
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 shrink-0" />
          <span>{item.label}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="mt-1 ml-8 space-y-1">
          {item.children?.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                "block px-3 py-2 rounded-md text-sm cursor-pointer transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                pathname === child.href
                  ? "text-primary font-medium"
                  : "text-muted-foreground"
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ companyName }: { companyName?: string }) {
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
        "relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-xs">T</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight truncate">
                {companyName ?? "Tecidex"}
              </p>
              <p className="text-xs text-muted-foreground">Nexuz AI</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-xs">T</span>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-sidebar-border border border-sidebar-border flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
        aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <NavSection
            key={item.label}
            item={item}
            collapsed={collapsed}
            pathname={pathname}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        {collapsed ? (
          <TooltipProvider delay={0}>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-center px-0 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                  </Button>
                }
              />
              <TooltipContent side="right">
                <p>Sair</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="text-sm">Sair</span>
          </Button>
        )}
      </div>
    </aside>
  );
}
