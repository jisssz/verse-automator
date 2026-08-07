import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Pin,
  Sparkles,
  Image as ImageIcon,
  BarChart3,
  Sliders,
  Settings,
  User as UserIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Plus,
  Crown,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const isDemoMode =
      typeof window !== "undefined" && localStorage.getItem("dailyverse_demo_mode") === "true";

    if (isDemoMode) {
      return {
        user: {
          id: "00000000-0000-0000-0000-000000000000",
          email: "creator@dailyverse.ai",
          user_metadata: { display_name: "Demo Creator" },
        } as unknown as User,
      };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();
  const navigate = useNavigate();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem("dailyverse_demo_mode");
    }
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    void router.navigate({ to: "/auth", replace: true });
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Campaigns", icon: FolderKanban, to: "/dashboard" },
    { label: "Products", icon: Layers, to: "/dashboard" },
    { label: "Pinterest Pins", icon: Pin, to: "/pins" },
    { label: "Content Generator", icon: Sparkles, to: "/dashboard" },
    { label: "Image Generator", icon: ImageIcon, to: "/dashboard" },
    { label: "Analytics", icon: BarChart3, to: "/dashboard" },
    { label: "Automation", icon: Sliders, to: "/settings" },
    { label: "Settings", icon: Settings, to: "/settings" },
  ];

  return (
    <div className="min-h-screen flex bg-[#F8F6F2] text-[#222222]">
      {/* Luxury Dark Emerald Sidebar */}
      <aside
        className={`relative flex flex-col bg-[#132E22] text-[#F8F6F2] border-r border-[#28543E] transition-all duration-300 z-30 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#28543E]">
          <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <img
              src="/brand/logo.jpg"
              alt="DAILY VERSE logo"
              className="h-9 w-9 shrink-0 rounded-lg object-cover border border-[#C8A96A]/40 shadow-sm"
              loading="lazy"
            />
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-serif text-sm font-bold tracking-tight text-[#F8F6F2]">
                  DAILY VERSE
                </span>
                <span className="text-[9px] tracking-widest text-[#C8A96A] uppercase font-semibold">
                  Skincare That Works
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-[#C8A96A] hover:bg-[#1E4734] transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-[#C8A96A]/80 uppercase">
              Platform Navigation
            </div>
          )}
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#F8F6F2]/80 hover:bg-[#1E4734] hover:text-[#FFFFFF] transition-all group"
            >
              <item.icon className="h-4 w-4 text-[#C8A96A] group-hover:scale-110 transition-transform shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* User Profile & Logout Section */}
        <div className="p-3 border-t border-[#28543E] space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1E4734]/50 border border-[#28543E]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C8A96A] text-[#132E22] font-semibold text-xs shrink-0">
                DC
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-medium text-[#F8F6F2] truncate">Demo Creator</span>
                <span className="text-[10px] text-[#C8A96A] truncate">creator@dailyverse.ai</span>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-destructive-foreground/90 hover:bg-destructive/20 hover:text-white transition-all"
          >
            <LogOut className="h-4 w-4 text-amber-400 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area with Luxury Header */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E7E2D9] px-6 flex items-center justify-between gap-4 sticky top-0 z-20 shadow-xs">
          {/* Search Input */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
              <Input
                type="search"
                placeholder="Search campaigns, beauty products, pins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-[#F8F6F2] border-[#E7E2D9] focus-visible:ring-[#1E4734] text-xs h-9"
              />
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => void navigate({ to: "/dashboard" })}
              size="sm"
              className="bg-[#1E4734] hover:bg-[#355E4D] text-white shadow-sm font-medium text-xs h-9 px-4"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5 text-[#C8A96A]" /> New Campaign
            </Button>
            <div className="h-4 w-px bg-[#E7E2D9]" />
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7E2D9] bg-[#FFFFFF] text-[#222222] hover:bg-[#F3EFE8] transition-colors">
              <Bell className="h-4 w-4 text-[#666666]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C8A96A]" />
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E4734] text-[#C8A96A] font-semibold text-xs border border-[#C8A96A]/30">
              <UserIcon className="h-4 w-4" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
