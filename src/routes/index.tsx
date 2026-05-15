import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Phone, MessageSquare, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SERVICE_CATEGORIES, NEIGHBORHOODS_BY_CITY } from "@/lib/constants";
import logo from "/icons/trustfix-512.png?url";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "TrustFix — Verified plumbers, electricians & artisans in Cameroon" },
      { name: "description", content: "Skip the guesswork. TrustFix connects you with ID-verified local workers across Cameroon. Call, WhatsApp, or message — instantly." },
    ],
  }),
});

function HomePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string>("");
  const [neighborhood, setNeighborhood] = useState<string>("");

  const runSearch = () => {
    navigate({
      to: "/services",
      search: {
        category: category || undefined,
        neighborhood: neighborhood || undefined,
      },
    });
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-warm)" }} />
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" /> ID-verified workers only
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-bold leading-[1.05] text-foreground">
              Trusted hands,<br />
              <span className="text-primary">a tap away.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-md">
              Plumbers, electricians, mechanics — every TrustFix worker has been
              verified with a National ID. No surprises, no hassle.
            </p>
            <div className="mt-7 rounded-2xl bg-card border border-border p-3 shadow-[var(--shadow-card)] grid sm:grid-cols-[1fr_1fr_auto] gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12">
                  <div className="flex items-center gap-2 truncate">
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Service" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={neighborhood} onValueChange={setNeighborhood}>
                <SelectTrigger className="h-12">
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Location" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NEIGHBORHOODS_BY_CITY).map(([city, hoods]) => (
                    <SelectGroup key={city}>
                      <SelectLabel>{city}</SelectLabel>
                      {hoods.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <Button size="lg" className="h-12 gap-2" onClick={runSearch}>
                <Search className="h-4 w-4" /> Search
              </Button>
            </div>
            <div className="mt-3">
              <Link to="/signup" className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline">
                Are you a worker? Sign up →
              </Link>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div
              className="absolute inset-0 blur-3xl opacity-40 -z-10"
              style={{ background: "var(--gradient-primary)" }}
            />
            <img
              src={logo}
              alt="TrustFix"
              width={360}
              height={360}
              className="rounded-3xl shadow-[var(--shadow-elevated)]"
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold">Pick a service</h2>
            <p className="text-muted-foreground mt-1">Trusted help for everyday problems.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SERVICE_CATEGORIES.slice(0, 8).map((c) => (
            <Link
              key={c}
              to="/services"
              search={{ category: c }}
              className="group rounded-2xl bg-card border border-border p-5 hover:border-primary hover:shadow-[var(--shadow-card)] transition-all"
            >
              <div className="text-base font-semibold group-hover:text-primary transition-colors">{c}</div>
              <div className="text-xs text-muted-foreground mt-1">Browse →</div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-bold text-center">How TrustFix works</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-10">
            {[
              { icon: Search, title: "Search", desc: "Pick a service and your neighborhood." },
              { icon: ShieldCheck, title: "Choose verified", desc: "Every worker has been ID-checked by our team." },
              { icon: Phone, title: "Connect", desc: "Call, WhatsApp, or send a message — instantly." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl bg-card border border-border p-6">
                <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold mt-4">{title}</h3>
                <p className="text-muted-foreground mt-2 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA for workers */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl p-10 md:p-14 text-primary-foreground relative overflow-hidden" style={{ background: "var(--gradient-primary)" }}>
          <h2 className="text-3xl md:text-4xl font-bold max-w-2xl">Are you a skilled worker? Get found by clients near you.</h2>
          <p className="mt-3 text-primary-foreground/90 max-w-xl">
            Join TrustFix, get ID-verified, and start receiving messages and calls from clients in your neighborhood.
          </p>
          <Link to="/signup" className="inline-block mt-6">
            <Button size="lg" variant="secondary" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Sign up as worker
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
