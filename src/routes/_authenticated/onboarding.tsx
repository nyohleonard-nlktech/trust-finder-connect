import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Upload, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { NEIGHBORHOODS, SERVICE_CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

function Onboarding() {
  const { user, isWorker } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [cniNumber, setCniNumber] = useState("");
  const [bio, setBio] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("worker_profiles").select("user_id").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setExisting(!!data));
  }, [user]);

  useEffect(() => {
    if (isWorker === false && existing === false) {
      // If user signed up as customer, route them away
    }
  }, [isWorker, existing]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!category || !neighborhood) {
      toast.error("Choose service category and neighborhood.");
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

    // Ensure worker role exists
    await supabase.from("user_roles").upsert(
      { user_id: user.id, role: "worker" },
      { onConflict: "user_id,role" },
    );

    const { error: wpErr } = await supabase.from("worker_profiles").upsert({
      user_id: user.id,
      service_category: category,
      neighborhood,
      bio,
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="text-center mb-8">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold mt-3">Worker onboarding</h1>
        <p className="text-muted-foreground mt-1">
          Tell clients what you do and upload your ID for verification.
        </p>
      </div>
      <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-6 space-y-5">
        <div>
          <Label>Service category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-12 mt-1"><SelectValue placeholder="Pick what you do" /></SelectTrigger>
            <SelectContent>
              {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
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
          <Label htmlFor="bio">Short bio (optional)</Label>
          <Textarea id="bio" maxLength={500} value={bio} onChange={(e) => setBio(e.target.value)}
            placeholder="Years of experience, specialties, etc." className="mt-1" />
        </div>
        <div>
          <Label>National ID card photo</Label>
          <label className="mt-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 hover:border-primary transition cursor-pointer bg-muted/40">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : "Tap to upload (JPG or PNG)"}
            </span>
            <input
              type="file" accept="image/*" className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="text-xs text-muted-foreground mt-2">
            Stored privately. Only TrustFix admins will see this.
          </p>
        </div>
        <Button type="submit" disabled={submitting} size="lg" className="w-full">
          {submitting ? "Submitting…" : "Submit for verification"}
        </Button>
      </form>
    </div>
  );
}
