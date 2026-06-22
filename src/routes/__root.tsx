import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Toaster } from "@/components/ui/sonner";
import { SupportFooter } from "@/components/SupportFooter";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary font-display">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#BC542A" },
      { title: "TrustFix — Verified Local Services in Cameroon" },
      { name: "description", content: "Find verified plumbers, electricians, and trusted workers near you. Direct call, WhatsApp, or message — all in one place." },
      { property: "og:title", content: "TrustFix — Verified Local Services in Cameroon" },
      { property: "og:description", content: "Find verified plumbers, electricians, and trusted workers near you. Direct call, WhatsApp, or message — all in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "TrustFix — Verified Local Services in Cameroon" },
      { name: "twitter:description", content: "Find verified plumbers, electricians, and trusted workers near you. Direct call, WhatsApp, or message — all in one place." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f97cb4a1-8a7f-42e5-8caf-7e18b2a7b5b0/id-preview-1249a557--9d79922d-cfa0-45a5-b5ad-743a7e5f5064.lovable.app-1778857955104.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f97cb4a1-8a7f-42e5-8caf-7e18b2a7b5b0/id-preview-1249a557--9d79922d-cfa0-45a5-b5ad-743a7e5f5064.lovable.app-1778857955104.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Inter:wght@400;500;600;700&display=swap" },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icons/trustfix-192.png" },
      { rel: "icon", type: "image/png", href: "/icons/trustfix-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
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
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <SupportFooter />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
