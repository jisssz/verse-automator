import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  Package,
  Pin,
  Sparkles,
  Image as ImageIcon,
  Activity,
  BarChart3,
  Settings,
  Plus,
  Play,
  ArrowRight,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const navItems = [
    { name: "Dashboard", href: "/_authenticated/dashboard", icon: LayoutDashboard, category: "Navigation" },
    { name: "Campaigns", href: "/_authenticated/campaigns", icon: FolderKanban, category: "Navigation" },
    { name: "Products Catalog", href: "/_authenticated/products", icon: Package, category: "Navigation" },
    { name: "Pinterest Pins", href: "/_authenticated/pins", icon: Pin, category: "Navigation" },
    { name: "Content Generator", href: "/_authenticated/content-generator", icon: Sparkles, category: "AI Tools" },
    { name: "Image Generator (FLUX.1)", href: "/_authenticated/image-generator", icon: ImageIcon, category: "AI Tools" },
    { name: "Automation Control", href: "/_authenticated/automation", icon: Activity, category: "Workflows" },
    { name: "Analytics & ROI", href: "/_authenticated/analytics", icon: BarChart3, category: "Analytics" },
    { name: "Settings & API Keys", href: "/_authenticated/settings", icon: Settings, category: "System" },
  ];

  const quickActions = [
    { name: "Create New Campaign", href: "/_authenticated/campaigns", icon: Plus, badge: "Quick Action" },
    { name: "Generate Luxury Pin Copy", href: "/_authenticated/content-generator", icon: Sparkles, badge: "AI Generator" },
    { name: "Render Product Visuals", href: "/_authenticated/image-generator", icon: ImageIcon, badge: "FLUX Engine" },
    { name: "Trigger n8n Syndication Pipeline", href: "/_authenticated/automation", icon: Play, badge: "Automation" },
  ];

  const filteredNav = navItems.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const filteredActions = quickActions.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    onOpenChange(false);
    setQuery("");
    void navigate({ to: href as never });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border border-[#E7E2D9] bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl">
        <DialogTitle className="sr-only">Quick Command & Navigation Search</DialogTitle>
        <div className="flex items-center px-4 border-b border-[#E7E2D9] bg-[#F8F6F2]/50">
          <Search className="h-4 w-4 text-[#C8A96A] shrink-0 mr-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, search pages, or trigger AI workflows... (Cmd + K)"
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-[#666666]/60 h-14"
            autoFocus
          />
          <Badge variant="outline" className="text-[10px] border-[#E7E2D9] text-[#666666] font-mono shrink-0">
            ESC
          </Badge>
        </div>

        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          {filteredActions.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-semibold text-[#666666]/70 uppercase tracking-wider mb-1">
                Quick Actions
              </p>
              <div className="space-y-0.5">
                {filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.name}
                      onClick={() => handleSelect(action.href)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs text-[#222222] hover:bg-[#1E4734] hover:text-white transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-[#E7E2D9]/40 group-hover:bg-white/20 text-[#1E4734] group-hover:text-white transition-colors">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium">{action.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[9px] bg-[#E7E2D9]/50 group-hover:bg-white/20 group-hover:text-white text-[#1E4734]">
                          {action.badge}
                        </Badge>
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Pages */}
          {filteredNav.length > 0 && (
            <div>
              <p className="px-3 text-[10px] font-semibold text-[#666666]/70 uppercase tracking-wider mb-1">
                Platform Navigation
              </p>
              <div className="space-y-0.5">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleSelect(item.href)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs text-[#222222] hover:bg-[#1E4734] hover:text-white transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-[#1E4734] group-hover:text-[#C8A96A] transition-colors" />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-[#666666] group-hover:text-white/80">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filteredNav.length === 0 && filteredActions.length === 0 && (
            <div className="py-8 text-center text-xs text-[#666666]">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-[#E7E2D9] bg-[#F8F6F2]/50 flex items-center justify-between text-[11px] text-[#666666]">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E7E2D9] font-mono text-[10px]">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white border border-[#E7E2D9] font-mono text-[10px]">↵</kbd> Select
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
