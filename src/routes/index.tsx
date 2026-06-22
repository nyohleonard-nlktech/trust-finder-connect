import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck, Phone, MessageSquare, Search, MapPin,
  Zap, CheckCircle2, ArrowRight, Sparkles, Users, Star, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SERVICE_CATEGORIES, NEIGHBORHOODS_BY_CITY } from "@/lib/constants";
import { fetchVerifiedWorkers } from "@/lib/workers";
import { WorkerCard } from "@/components/WorkerCard";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "TrustFix — Verified plumbers, electricians & artisans in Cameroon" },
      { name: "description", content: "Skip the guesswork. TrustFix connects you with ID-verified local workers across Cameroon. Call, WhatsApp, or message — instantly." },
    ],
  }),
});

const WHATSAPP_URL = "https://wa.me/237659498770";

function HomePage() {
  const [category, setCategory] = useState<string>("all");
  const [neighborhood, setNeighborhood] = useState<string>("all");

  const filters = useMemo(() => ({
    category: category === "all" ? undefined : category,
    neighborhood: neighborhood === "all" ? undefined : neighborhood,
  }), [category, neighborhood]);

  const { data: workers, isLoading } = useQuery({
    queryKey: ["workers", "home", filters],
    queryFn: () => fetchVerifiedWorkers(filters),
  });

  const workerCount = workers?.length ?? 0;
  const [visibleCount, setVisibleCount] = useState(6);
  const visibleWorkers = workers?.slice(0, visibleCount) ?? [];

  return (
    <div className="bg-background text-foreground">
      {/* ============== HERO ============== */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        {/* Mesh gradient bg */}
        <div className="absolute inset-0 -z-20" style={{ background: "var(--gradient-mesh)" }} />
        {/* Floating orange blobs */}
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-[#FF7043] opacity-20 blur-3xl animate-float-slow -z-10" />
        <div className="absolute top-1/3 -right-40 h-[460px] w-[460px] rounded-full bg-[#7C3AED] opacity-20 blur-3xl animate-float-slower -z-10" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-[#BC542A] opacity-25 blur-3xl animate-float-slow -z-10" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />

        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28 grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center w-full">
          {/* Left */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-xs font-semibold text-[#FF9A6B] animate-fade-up">
              <ShieldCheck className="h-3.5 w-3.5" /> ID-Verified Workers Only
            </span>

            <h1
              className="mt-6 font-display font-extrabold leading-[1.02] tracking-tight text-foreground animate-fade-up"
              style={{ fontSize: "clamp(2.75rem, 7vw, 5rem)", animationDelay: "120ms" }}
            >
              Find <span className="text-gradient-orange">Trusted</span><br />
              Artisans &amp;<br />
              Workers in Cameroon.
            </h1>

            <p
              className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "240ms" }}
            >
              Verified plumbers, electricians, mechanics, and technicians in
              Bamenda, Douala, and Yaoundé. Safe, fast, and reliable.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-up" style={{ animationDelay: "360ms" }}>
              <Link to="/services" className="sm:w-auto w-full">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-14 px-7 rounded-xl text-base font-semibold gap-2 shadow-[var(--shadow-glow)] hover:scale-[1.03] transition-transform"
                  style={{ background: "var(--gradient-primary)", color: "#fff" }}
                >
                  Find a Worker <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/signup" className="sm:w-auto w-full">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-14 px-7 rounded-xl text-base font-semibold border-white/15 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/30"
                >
                  Join as a Worker
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 animate-fade-up" style={{ animationDelay: "480ms" }}>
              {[
                { icon: CheckCircle2, label: "ID-Verified Only" },
                { icon: Zap, label: "Instant Contact" },
                { icon: MapPin, label: "Local to Your City" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-[#22C55E]" /> {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating worker card stack */}
          <div className="relative h-[480px] hidden lg:block">
            <div className="absolute inset-0 blur-3xl opacity-50" style={{ background: "var(--gradient-primary)" }} />
            <HeroWorkerCard
              name="Jean-Paul M."
              trade="Electrician"
              city="Douala"
              initials="JP"
              className="absolute top-4 left-2 w-[300px] rotate-[-6deg] animate-fade-up"
              style={{ animationDelay: "500ms" }}
            />
            <HeroWorkerCard
              name="Aïcha N."
              trade="Plumber"
              city="Yaoundé"
              initials="AN"
              className="absolute top-24 right-0 w-[300px] rotate-[5deg] animate-fade-up"
              style={{ animationDelay: "650ms" }}
            />
            <HeroWorkerCard
              name="Samuel T."
              trade="Mechanic"
              city="Bamenda"
              initials="ST"
              className="absolute bottom-2 left-10 w-[300px] rotate-[-2deg] animate-fade-up animate-glow-pulse"
              style={{ animationDelay: "800ms" }}
            />
          </div>
        </div>
      </section>

      {/* ============== SEARCH BAR ============== */}
      <section className="relative border-y border-white/5 bg-[#0D0D14] py-12">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-center text-sm text-muted-foreground mb-5">
            Search from <span className="text-foreground font-semibold">{workerCount > 0 ? `${workerCount}+` : "100+"}</span> verified workers across Cameroon
          </p>
          <div className="glass rounded-2xl p-3 grid md:grid-cols-[1fr_1fr_auto] gap-2 shadow-[var(--shadow-elevated)]">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 text-base">
                <div className="flex items-center gap-2 truncate">
                  <Search className="h-4 w-4 text-[#FF7043] shrink-0" />
                  <SelectValue placeholder="Select a service" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All services</SelectItem>
                {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={neighborhood} onValueChange={setNeighborhood}>
              <SelectTrigger className="h-14 bg-white/[0.03] border-white/10 text-base">
                <div className="flex items-center gap-2 truncate">
                  <MapPin className="h-4 w-4 text-[#FF7043] shrink-0" />
                  <SelectValue placeholder="Select city" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {Object.entries(NEIGHBORHOODS_BY_CITY).map(([city, hoods]) => (
                  <SelectGroup key={city}>
                    <SelectLabel>{city}</SelectLabel>
                    <SelectItem value={`city:${city}`}>All {city}</SelectItem>
                    {hoods.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="lg"
              className="h-14 px-8 rounded-xl text-base font-semibold gap-2 hover:scale-[1.03] transition-transform"
              style={{ background: "var(--gradient-primary)", color: "#fff" }}
              onClick={() => document.getElementById("workers")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Search className="h-5 w-5" /> Search Workers
            </Button>
          </div>
        </div>
      </section>

      {/* ============== SOCIAL PROOF ============== */}
      <section className="py-14">
        <div className="mx-auto max-w-6xl px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Users, num: `${Math.max(workerCount, 100)}+`, label: "Workers", sub: "Verified and active" },
            { icon: Building2, num: "4", label: "Cities", sub: "Bamenda · Douala · Yaoundé · Buea" },
            { icon: Star, num: "98%", label: "Trust Rate", sub: "Client satisfaction" },
            { icon: Phone, num: "Direct", label: "Contact", sub: "No middlemen" },
          ].map(({ icon: Icon, num, label, sub }) => (
            <div key={label} className="glass rounded-2xl p-6 text-center">
              <Icon className="h-5 w-5 mx-auto text-[#FF7043] mb-2" />
              <div className="text-3xl md:text-4xl font-extrabold text-gradient-orange font-display">{num}</div>
              <div className="text-sm font-semibold mt-1 text-foreground">{label}</div>
              <div className="text-xs text-muted-foreground mt-1">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============== WORKERS GRID ============== */}
      <section id="workers" className="py-16 relative">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold font-display">
              Verified Workers <span className="text-gradient-orange">Near You</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
              Every worker is ID-checked by the TrustFix team before they appear here.
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">Loading workers…</div>
          ) : !workers?.length ? (
            <div className="text-center py-16 px-6 rounded-2xl glass">
              <p className="text-muted-foreground">
                No workers found in this specific neighborhood yet. Try searching in a nearby area!
              </p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleWorkers.map((w) => <WorkerCard key={w.user_id} w={w} />)}
              </div>
              {workerCount > visibleCount && (
                <div className="text-center mt-10">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setVisibleCount((n) => n + 6)}
                    className="h-12 px-7 rounded-xl border-white/15 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/30"
                  >
                    Load more workers
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section className="py-20 relative">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(600px 400px at 50% 50%, rgba(188,84,42,0.12), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-5xl font-extrabold font-display">
              3 Steps to Hire with <span className="text-gradient-orange">Confidence</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* connecting dotted line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] border-t-2 border-dashed border-white/10" />
            {[
              { n: "01", icon: Search, title: "Search", desc: "Pick a service and your neighborhood." },
              { n: "02", icon: ShieldCheck, title: "Choose Verified", desc: "Every worker has been ID-checked by our team." },
              { n: "03", icon: Phone, title: "Connect Instantly", desc: "Call, WhatsApp, or message directly — no waiting." },
            ].map(({ n, icon: Icon, title, desc }) => (
              <div key={title} className="glass rounded-3xl p-8 relative hover:border-[#BC542A]/40 transition-colors">
                <div className="text-5xl font-extrabold text-gradient-orange font-display opacity-80">{n}</div>
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#BC542A]/15 text-[#FF7043] mt-4">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-bold mt-4 font-display">{title}</h3>
                <p className="text-muted-foreground mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== WORKER CTA ============== */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="relative overflow-hidden rounded-3xl glass p-10 md:p-14 grid md:grid-cols-[1.4fr_1fr] gap-10 items-center">
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5"
              style={{ background: "var(--gradient-primary)" }}
            />
            <div
              className="absolute -right-32 -bottom-32 h-[400px] w-[400px] rounded-full blur-3xl opacity-30"
              style={{ background: "var(--gradient-primary)" }}
            />
            <div className="relative">
              <Sparkles className="h-6 w-6 text-[#FF7043] mb-3" />
              <h2 className="text-3xl md:text-5xl font-extrabold font-display leading-[1.05]">
                Are you a <span className="text-gradient-orange">skilled worker?</span>
              </h2>
              <p className="text-muted-foreground mt-5 text-lg max-w-xl">
                Get found by clients near you. Join TrustFix, get ID-verified, and start receiving jobs in your neighborhood.
              </p>
              <Link to="/signup" className="inline-block mt-7">
                <Button
                  size="lg"
                  className="h-14 px-7 rounded-xl text-base font-semibold gap-2 shadow-[var(--shadow-glow)] hover:scale-[1.03] transition-transform"
                  style={{ background: "var(--gradient-primary)", color: "#fff" }}
                >
                  Sign Up as a Worker <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="relative space-y-3">
              {["Free to join", "More clients, more income", "Your own verified profile"].map((b) => (
                <div key={b} className="flex items-center gap-3 glass rounded-xl px-5 py-4">
                  <span className="grid place-items-center h-8 w-8 rounded-full bg-[#22C55E]/15 text-[#22C55E] shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <span className="font-medium">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============== CONTACT / SUPPORT ============== */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4">
          <div className="glass rounded-3xl p-10 md:p-14 text-center">
            <h2 className="text-3xl md:text-4xl font-extrabold font-display">
              We read every message.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Questions, complaints, suggestions, or tech issues — reach out anytime.
            </p>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-8">
              <Button
                size="lg"
                className="h-14 px-7 rounded-xl text-base font-semibold gap-2 hover:scale-[1.03] transition-transform"
                style={{ background: "#22C55E", color: "#06180D" }}
              >
                <MessageSquare className="h-5 w-5" /> Chat with TrustFix on WhatsApp
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-6">
              Or sign in to use the in-app support chat for ticketed help.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function HeroWorkerCard({
  name, trade, city, initials, className, style,
}: {
  name: string; trade: string; city: string; initials: string;
  className?: string; style?: React.CSSProperties;
}) {
  return (
    <div
      className={`glass rounded-2xl p-5 shadow-[var(--shadow-elevated)] ${className ?? ""}`}
      style={style}
    >
      <div className="flex items-center gap-3">
        <div
          className="h-12 w-12 rounded-full grid place-items-center font-bold text-white shrink-0"
          style={{ background: "var(--gradient-primary)" }}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{name}</div>
          <div className="text-xs text-[#FF7043] truncate">{trade}</div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          Available
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-white/[0.05] text-muted-foreground">
          <MapPin className="h-3 w-3" /> {city}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-[#BC542A]/15 text-[#FF7043]">
          <ShieldCheck className="h-3 w-3" /> Verified
        </span>
      </div>
    </div>
  );
}
