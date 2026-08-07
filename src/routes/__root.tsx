import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { supabase } from "@/integrations/supabase/client";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CenteredState } from "@/components/layout/centered-state";

function NotFoundComponent() {
  return (
    <CenteredState>
      <h1 className="text-7xl font-bold text-foreground">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-6">
        <Link
          to="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </CenteredState>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <CenteredState>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        This page didn't load
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong on our end. You can try refreshing or head back home.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          Go home
        </a>
      </div>
    </CenteredState>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DailyVerse AI — Affiliate Content Automation" },
      {
        name: "description",
        content:
          "Generate trending product ideas, AI-written Pinterest pins, and images. Built for affiliate marketers.",
      },
      { name: "author", content: "DailyVerse AI" },
      { property: "og:title", content: "DailyVerse AI — Affiliate Content Automation" },
      {
        property: "og:description",
        content:
          "Generate trending product ideas, AI-written Pinterest pins, and images. Built for affiliate marketers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/brand/logo.jpg", type: "image/jpeg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        queryClient.invalidateQueries();
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}

function Header() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    const checkAuth = () => {
      const isDemo =
        typeof window !== "undefined" && localStorage.getItem("dailyverse_demo_mode") === "true";
      void supabase.auth.getSession().then(({ data }) => {
        if (active) setSignedIn(Boolean(data.session) || isDemo);
      });
    };
    checkAuth();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const isDemo =
        typeof window !== "undefined" && localStorage.getItem("dailyverse_demo_mode") === "true";
      setSignedIn(Boolean(session) || isDemo);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    if (typeof window !== "undefined") {
      localStorage.removeItem("dailyverse_demo_mode");
    }
    await supabase.auth.signOut();
    setSignedIn(false);
    void router.navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/brand/logo.jpg"
            alt="DailyVerse Logo"
            className="h-8 w-8 rounded-full object-cover border border-[#C8A96A]/30 shadow-xs"
            loading="lazy"
          />
          <div className="flex flex-col">
            <span className="font-serif text-sm font-bold tracking-tight text-[#1E4734]">
              DAILY VERSE
            </span>
            <span className="text-[9px] tracking-widest text-[#C8A96A] uppercase font-semibold">
              Skincare That Works
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Home
          </Link>
          {signedIn ? (
            <>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Link to="/pins" className="text-sm text-muted-foreground hover:text-foreground">
                Pins
              </Link>
              <Link to="/settings" className="text-sm text-muted-foreground hover:text-foreground">
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
