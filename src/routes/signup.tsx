import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Briefcase, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { isValidCameroonPhone, normalizePhone, phoneToAuthEmail } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { refreshRoles } = useAuth();
  const [step, setStep] = useState<"role" | "form">("role");
  const [role, setRole] = useState<"customer" | "worker">("customer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidCameroonPhone(phone)) {
      toast.error("Enter a valid Cameroonian phone (9 digits starting with 6).");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const normalized = normalizePhone(phone);
    const { data, error } = await supabase.auth.signUp({
      email: phoneToAuthEmail(phone),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, phone: normalized },
      },
    });
    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? "Could not create account.");
      return;
    }
    // Insert role
    await supabase.from("user_roles").insert({ user_id: data.user.id, role });
    // Update profile fields (trigger creates row)
    await supabase.from("profiles").update({
      full_name: fullName,
      phone: normalized,
    }).eq("id", data.user.id);

    await refreshRoles();
    setLoading(false);
    toast.success("Account created!");
    navigate({ to: role === "worker" ? "/onboarding" : "/" });
  };

  if (step === "role") {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <div className="text-center mb-6">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold mt-3">Join TrustFix</h1>
          <p className="text-muted-foreground mt-1">How will you use TrustFix?</p>
        </div>
        <div className="space-y-3">
          {([
            { v: "customer" as const, icon: User, title: "I need a worker", desc: "Find verified plumbers, electricians and more." },
            { v: "worker" as const, icon: Briefcase, title: "I am a worker", desc: "Get found by clients in your neighborhood." },
          ]).map(({ v, icon: Icon, title, desc }) => (
            <button
              key={v}
              onClick={() => { setRole(v); setStep("form"); }}
              className="w-full text-left rounded-2xl bg-card border border-border hover:border-primary p-5 flex items-start gap-4 transition-all"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold">{title}</div>
                <div className="text-sm text-muted-foreground">{desc}</div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-sm text-center text-muted-foreground mt-6">
          Already on TrustFix? <Link to="/login" className="text-primary font-medium">Sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">{role === "worker" ? "Worker sign up" : "Create account"}</h1>
        <button onClick={() => setStep("role")} className="text-sm text-muted-foreground mt-1 hover:text-foreground">← Change account type</button>
      </div>
      <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-6 space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 mt-1 text-base" />
        </div>
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone" required value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="6xx xxx xxx"
            className="h-12 mt-1 text-base"
            inputMode="tel"
          />
          {phone && (
            <p className="text-xs text-muted-foreground mt-1">Saved as {normalizePhone(phone)}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password" type="password" required minLength={6}
            value={password} onChange={(e) => setPassword(e.target.value)}
            className="h-12 mt-1 text-base"
          />
        </div>
        <Button type="submit" disabled={loading} size="lg" className="w-full">
          {loading ? "Creating…" : "Create account"}
        </Button>
      </form>
    </div>
  );
}
