import { ShieldCheck, IdCard, UserCheck, Clock, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * Honest, plain-language description of the verification process exactly as it
 * works today: worker uploads CNI -> manual admin review -> approval in 24-48h.
 */
export function VerificationInfo({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();

  const steps = [
    { icon: IdCard, title: t("verif.s1.title"), desc: t("verif.s1.desc") },
    { icon: UserCheck, title: t("verif.s2.title"), desc: t("verif.s2.desc") },
    { icon: Clock, title: t("verif.s3.title"), desc: t("verif.s3.desc") },
  ];

  return (
    <section id="verification" className={compact ? "" : "py-16"}>
      <div className={compact ? "" : "mx-auto max-w-5xl px-4"}>
        <div className="glass rounded-3xl p-6 md:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#BC542A]/15 px-3 py-1.5 text-xs font-semibold text-[#FF9A6B]">
            <ShieldCheck className="h-3.5 w-3.5" /> {t("verif.badge")}
          </span>
          <h2
            className={`mt-4 font-extrabold font-display ${
              compact ? "text-xl md:text-2xl" : "text-2xl md:text-4xl"
            }`}
          >
            {t("verif.title")}
          </h2>
          <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-3xl">
            {t("verif.intro")}
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#BC542A]/15 text-[#FF7043]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] p-5">
            <p className="flex items-center gap-2 font-semibold text-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              {t("verif.limits.title")}
            </p>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {t("verif.limits.body")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
