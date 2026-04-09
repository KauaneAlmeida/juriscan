"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  LayoutDashboard,
  History,
  FileText,
  Settings,
  LogOut,
  Loader2,
  MessageSquareHeart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useProfile } from "@/hooks/useProfile";
import { PLANS, type PlanId } from "@/lib/pagarme/config";
import NotificationBell from "@/components/Notifications/NotificationBell";

const navItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", tourId: "menu-dashboard" },
  { id: "chat-juridico", icon: MessageSquare, label: "Chat Jurídico", href: "/chat", tourId: "menu-chat" },
  { id: "historico", icon: History, label: "Histórico", href: "/historico", tourId: "menu-historico" },
] as const;

const navItemsBottom = [
  { id: "relatorios", icon: FileText, label: "Relatórios", href: "/relatorios", tourId: "menu-relatorios" },
  { id: "configuracoes", icon: Settings, label: "Configurações", href: "/configuracoes", tourId: "menu-configuracoes" },
  { id: "feedback", icon: MessageSquareHeart, label: "Feedback Beta", href: "/feedback", tourId: "menu-feedback" },
] as const;

interface SidebarProps {
  highlightCredits?: boolean;
  highlightNavigation?: boolean;
  highlightMenuItem?: string;
  onItemClick?: () => void;
  /** When true, sidebar fills its parent container instead of being fixed */
  embedded?: boolean;
}

export default function Sidebar({
  highlightCredits = false,
  highlightNavigation = false,
  highlightMenuItem,
  onItemClick,
  embedded = false,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, signOut, isSigningOut } = useAuth();
  const { balance, subscription, isLoading: isLoadingCredits } = useCredits();
  const { profile } = useProfile();
  const [avatarError, setAvatarError] = useState(false);

  // Reset avatar error on URL change (new upload)
  useEffect(() => {
    setAvatarError(false);
  }, [profile?.avatar_url]);

  // Helper: validate that a name is usable
  const isValidName = (name: unknown): name is string =>
    typeof name === "string" &&
    name.trim() !== "" &&
    name.trim().toLowerCase() !== "undefined";

  // User initials
  const getUserInitials = () => {
    const profileName = profile?.name;
    const metaName = user?.user_metadata?.name;
    const name = isValidName(profileName)
      ? profileName
      : isValidName(metaName)
        ? metaName
        : user?.email || "U";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Display name — prefer profile.name (kept fresh via settings)
  const getDisplayName = () => {
    if (isValidName(profile?.name)) return profile!.name.trim();
    const metaName = user?.user_metadata?.name;
    if (isValidName(metaName)) return metaName.trim();
    return user?.email?.split("@")[0] || "Usuário";
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Plan + credits math
  const currentPlanId = (subscription?.plan_id as PlanId) || "free";
  const currentPlan = PLANS[currentPlanId] ?? PLANS.free;
  const creditsTotal = currentPlan.credits;
  const creditsUsed = Math.max(0, creditsTotal - balance);
  const usagePercent = creditsTotal > 0
    ? Math.min(100, Math.max(0, (creditsUsed / creditsTotal) * 100))
    : 0;

  // Render a nav item with the new dark theme
  const renderNavItem = (item: (typeof navItems)[number] | (typeof navItemsBottom)[number]) => {
    const isActive = pathname === item.href;
    const isHighlighted = highlightMenuItem === item.id;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        id={`menu-item-${item.id}`}
        data-tour={item.tourId}
        onClick={onItemClick}
        className={`flex items-center gap-2.5 mx-2 my-px rounded-lg text-[13px] transition-colors duration-150 ${
          isActive
            ? "bg-[#162a45] text-[#4a9fd6] font-medium"
            : "text-[#7a9ab8] hover:bg-[#1a2433] hover:text-[#c8d8e8]"
        } ${
          isHighlighted
            ? "ring-2 ring-[#4a9fd6]/40 z-50 relative"
            : ""
        }`}
        style={{ padding: "9px 16px" }}
      >
        <Icon
          className="w-4 h-4 flex-shrink-0"
          style={{ opacity: isActive ? 1 : 0.7 }}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <aside
      data-tour="sidebar"
      className={`${
        embedded
          ? "relative h-full w-full"
          : "fixed left-0 top-0 h-screen w-[220px]"
      } flex flex-col z-10`}
      style={{
        backgroundColor: "#0f1923",
        borderRight: "1px solid #1e2d3d",
      }}
    >
      {/* 1. LOGO */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "20px 18px 16px",
          borderBottom: "1px solid #1e2d3d",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 30,
              height: 30,
              backgroundColor: "#1a4fd6",
              borderRadius: 7,
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 15,
              lineHeight: 1,
            }}
          >
            J
          </div>
          <span
            className="truncate"
            style={{
              color: "#e8edf5",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Juriscan
          </span>
        </Link>
        <NotificationBell iconClassName="text-[#7a9ab8] hover:text-[#c8d8e8] transition-colors" />
      </div>

      {/* 2. CREDITS BLOCK */}
      <div
        id="credits-card"
        data-tour="credits"
        className={`group relative ${
          highlightCredits ? "ring-[3px] ring-[#4a9fd6]/50 z-50" : ""
        }`}
        style={{
          margin: "14px 12px 10px",
          backgroundColor: "#1a2433",
          borderRadius: 10,
          padding: "12px 14px",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.5px",
            color: "#6b8aaa",
            fontWeight: 600,
            marginBottom: 4,
            textTransform: "uppercase",
          }}
        >
          Créditos
        </p>

        <div className="flex items-baseline justify-between gap-2">
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#e8edf5",
              lineHeight: 1.1,
            }}
          >
            {isLoadingCredits ? "—" : balance}
          </span>
          <span style={{ fontSize: 11, color: "#6b8aaa" }}>disponíveis</span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            backgroundColor: "#253545",
            height: 4,
            borderRadius: 2,
            marginTop: 8,
            marginBottom: 6,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${usagePercent}%`,
              height: "100%",
              borderRadius: 2,
              background: "linear-gradient(90deg, #1a4fd6, #3b82f6)",
              transition: "width 200ms ease-out",
            }}
          />
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, color: "#4a7a9b" }}>
            {isLoadingCredits
              ? "carregando..."
              : `${creditsUsed} de ${creditsTotal} usados`}
          </span>
          <Link
            href="/configuracoes?tab=plano"
            onClick={onItemClick}
            style={{ fontSize: 11, color: "#4a9fd6" }}
            className="hover:underline"
          >
            Comprar →
          </Link>
        </div>

        {/* Tooltip on hover */}
        <div
          role="tooltip"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          style={{
            backgroundColor: "#0b121b",
            color: "#c8d8e8",
            border: "1px solid #1e2d3d",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 11,
            lineHeight: 1.45,
            whiteSpace: "normal",
            width: 200,
            boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
          }}
        >
          Análise Preditiva = 5 cr · Jurimetria = 5 cr · Perfil Relator = 3 cr · Pesquisa = 2 cr
        </div>
      </div>

      {/* 3. NAVIGATION */}
      <nav
        id="sidebar-navigation"
        className={`flex-1 overflow-y-auto ${
          highlightNavigation
            ? "mx-1 rounded-xl ring-[3px] ring-[#4a9fd6]/40 z-50 relative"
            : ""
        }`}
        style={{ padding: "8px 0" }}
      >
        {navItems.map(renderNavItem)}

        <hr
          className="border-0"
          style={{
            height: 1,
            backgroundColor: "#1e2d3d",
            margin: "6px 12px",
          }}
        />

        {navItemsBottom.map(renderNavItem)}
      </nav>

      {/* 4. USER FOOTER */}
      <div
        style={{
          borderTop: "1px solid #1e2d3d",
          padding: "14px 16px",
        }}
      >
        <div className="flex items-center gap-2.5">
          <Link
            href="/configuracoes"
            onClick={onItemClick}
            className="flex items-center gap-2.5 flex-1 min-w-0 group"
          >
            {profile?.avatar_url && !avatarError ? (
              <img
                src={profile.avatar_url}
                alt={getDisplayName()}
                className="rounded-full object-cover flex-shrink-0"
                style={{ width: 30, height: 30 }}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  backgroundColor: "#1a4fd6",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {getUserInitials()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p
                className="truncate"
                style={{
                  color: "#9ab8cc",
                  fontSize: 13,
                  lineHeight: 1.25,
                }}
              >
                {getDisplayName()}
              </p>
              <p
                className="truncate"
                style={{
                  color: "#4a7a9b",
                  fontSize: 11,
                  lineHeight: 1.3,
                  marginTop: 1,
                }}
              >
                Plano {currentPlan.name}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label="Sair"
            title="Sair"
            className="p-1.5 rounded-md text-[#7a9ab8] hover:text-[#e8edf5] hover:bg-[#1a2433] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isSigningOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
