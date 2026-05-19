import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { NEIGHBORHOODS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectGroup, SelectLabel,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const PROFESSION_GROUPS = {
  Technical: ["Plumber", "Electrician", "Mechanic"],
  "Beauty & Grooming": ["Hair Care", "Dressing"],
  Other: [] as string[],
} as const;

type Group = keyof typeof PROFESSION_GROUPS;

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [professionGroup, setProfessionGroup] = useState<Group | "">("");
  const [category, setCategory] = useState("");
  const [customProfession, setCustomProfession] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [cniNumber, setCniNumber] = useState("");
  const [bio, setBio] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("worker_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!professionGroup) {
      toast.error("Choose a profession category.");
      return;
    }
    let finalCategory = category;
    if (professionGroup === "Other") {
      if (!customProfession.trim()) {
        toast.error("Please specify your profession.");
        return;
      }
      finalCategory = customProfession.trim();
    } else if (!category) {
      toast.error("Choose your specific profession.");
      return;
    }
    if (!neighborhood) {
      toast.error("Choose your neighborhood.");
      return;
    }
    if (!cniNumber.trim() || cniNumber.trim().length < 4) {
      toast.error("Your National ID (CNI) number is required.");
      return;
    }
    if (!file) {
      toast.error("Please upload a photo of your National ID card (CNI).");
      return;
    }
    setSubmitting(true);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/id-card.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("verification-docs")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setSubmitting(false);
      toast.error("Could not upload ID: " + upErr.message);
      return;
    }

    // Upload portfolio images (Beauty & Grooming)
    const portfolioPaths: string[] = [];
    if (professionGroup === "Beauty & Grooming" && portfolioFiles.length) {
      for (const f of portfolioFiles) {
        const pExt = f.name.split(".").pop() || "jpg";
        const pPath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${pExt}`;
        const { error: pErr } = await supabase.storage
          .from("portfolios")
          .upload(pPath, f, { contentType: f.type });
        if (!pErr) portfolioPaths.push(pPath);
      }
    }

    await supabase.from("user_roles").upsert(
      { user_id: user.id, role: "worker" },
      { onConflict: "user_id,role" },
    );

    const { error: wpErr } = await supabase.from("worker_profiles").upsert({
      user_id: user.id,
      service_category: finalCategory,
      profession_group: professionGroup,
      custom_profession: professionGroup === "Other" ? customProfession.trim() : null,
      portfolio_url: professionGroup === "Beauty & Grooming" && portfolioUrl ? portfolioUrl.trim() : null,
      portfolio_images: portfolioPaths,
      neighborhood,
      bio,
      cni_number: cniNumber.trim(),
      id_card_path: path,
      is_verified: false,
      is_available: false,
    });

    await supabase.from("profiles").update({ neighborhood }).eq("id", user.id);

    setSubmitting(false);
    if (wpErr) {
      toast.error(wpErr.message);
    } else {
      toast.success("Submitted! Our team will verify your ID shortly.");
      navigate({ to: "/dashboard" });
    }
  };

  const subOptions = professionGroup && professionGroup !== "Other"
    ? PROFESSION_GROUPS[professionGroup]
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="text-center mb-8">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold mt-3">Join as Artisan</h1>
        <p className="text-muted-foreground mt-1">
          Tell clients what you do and upload your ID for verification.
        </p>
      </div>
      <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-6 space-y-5">
        <div>
          <Label>Profession <span className="text-destructive">*</span></Label>
          <Select
            value={professionGroup}
            onValueChange={(v) => {
              setProfessionGroup(v as Group);
              setCategory("");
              setCustomProfession("");
            }}
          >
            <SelectTrigger className="h-12 mt-1"><SelectValue placeholder="Choose a category" /></SelectTrigger>
            <SelectContent>
              {(Object.keys(PROFESSION_GROUPS) as Group[]).map((g) => (
                <SelectGroup key={g}>
                  <SelectLabel>{g}</SelectLabel>
                  {PROFESSION_GROUPS[g].length > 0 ? (
                    PROFESSION_GROUPS[g].map((s) => (
                      <SelectItem key={s} value={`${g}::${s}`} onSelect={() => {}}>
                        {s}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={`${g}::__group__`}>{g} (specify)</SelectItem>
                  )}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          {/* hidden helper: parse selection */}
          <SelectionParser
            value={professionGroup && (category || customProfession) ? null : null}
          />
        </div>

        {/* Group + specific selector (alt simpler approach below replaces above grouping) */}
        {false && subOptions.length > 0 && (
          <div>
            <Label>Specific profession</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 mt-1"><SelectValue placeholder="Pick one" /></SelectTrigger>
              <SelectContent>
                {subOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {professionGroup === "Other" && (
          <div>
            <Label htmlFor="custom">Specify Profession <span className="text-destructive">*</span></Label>
            <Input
              id="custom" required value={customProfession}
              onChange={(e) => setCustomProfession(e.target.value)}
              placeholder="e.g. Solar Installer"
              maxLength={80}
              className="h-12 mt-1"
            />
          </div>
        )}

        {professionGroup === "Beauty & Grooming" && (
          <div className="space-y-4 rounded-xl bg-muted/40 border border-border p-4">
            <div>
              <Label htmlFor="portfolio">Portfolio link (optional)</Label>
              <Input
                id="portfolio" type="url" value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://instagram.com/your-handle"
                maxLength={255}
                className="h-12 mt-1"
              />
            </div>
            <div>
              <Label>Upload portfolio images (optional)</Label>
              <label className="mt-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-5 hover:border-primary transition cursor-pointer bg-background">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {portfolioFiles.length
                    ? `${portfolioFiles.length} image(s) selected`
                    : "Tap to add images"}
                </span>
                <input
                  type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => setPortfolioFiles(Array.from(e.target.files ?? []).slice(0, 8))}
                />
              </label>
              {portfolioFiles.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {portfolioFiles.map((f, i) => (
                    <li key={i} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setPortfolioFiles(portfolioFiles.filter((_, j) => j !== i))}
                        className="ml-2 text-destructive hover:opacity-80"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div>
          <Label>Neighborhood</Label>
          <Select value={neighborhood} onValueChange={setNeighborhood}>
            <SelectTrigger className="h-12 mt-1"><SelectValue placeholder="Where are you based?" /></SelectTrigger>
            <SelectContent>
              {NEIGHBORHOODS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="cni">National ID (CNI) number <span className="text-destructive">*</span></Label>
          <Input
            id="cni" required value={cniNumber}
            onChange={(e) => setCniNumber(e.target.value)}
            placeholder="e.g. 123456789"
            maxLength={32}
            className="h-12 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="bio">Short bio (optional)</Label>
          <Textarea id="bio" maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)}
            placeholder="Years of experience, specialties, etc." className="mt-1" />
        </div>
        <div>
          <Label>National ID card (CNI) photo <span className="text-destructive">*</span></Label>
          <label className="mt-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 hover:border-primary transition cursor-pointer bg-muted/40">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : "Tap to upload (JPG or PNG)"}
            </span>
            <input
              type="file" accept="image/*" className="hidden" required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            Stored privately. Only TrustFix admins will see this. Required for verification.
          </p>
        </div>
        <Button type="submit" disabled={submitting} size="lg" className="w-full">
          {submitting ? "Submitting…" : "Submit for verification"}
        </Button>
      </form>
    </div>
  );
}

// no-op helper kept to avoid breaking layout
function SelectionParser({ value: _value }: { value: unknown }) {
  return null;
}
