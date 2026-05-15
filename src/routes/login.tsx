import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isValidCameroonPhone, normalizePhone, phoneToAuthEmail } from "@/lib/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidCameroonPhone(phone)) {
      toast.error("Enter a valid Cameroonian phone number (9 digits starting with 6).");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToAuthEmail(phone),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Wrong phone or password.");
    } else {
      toast.success("Welcome back!");
      navigate({ to: "/" });
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="text-center mb-6">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="text-3xl font-bold mt-3">Welcome back</h1>
        <p className="text-muted-foreground mt-1">Sign in to your TrustFix account</p>
      </div>
      <form onSubmit={submit} className="rounded-2xl bg-card border border-border p-6 space-y-4">
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
            <p className="text-xs text-muted-foreground mt-1">Will sign in as {normalizePhone(phone)}</p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 mt-1 text-base"
          />
        </div>
        <Button type="submit" disabled={loading} size="lg" className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
        <p className="text-sm text-center text-muted-foreground">
          New to TrustFix? <Link to="/signup" className="text-primary font-medium">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
