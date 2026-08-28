import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Lang = "en" | "fr";

const STORAGE_KEY = "trustfix.lang";

/* ------------------------------------------------------------------ */
/* Dictionary                                                          */
/* ------------------------------------------------------------------ */

const en = {
  // Header / nav
  "nav.home": "Home",
  "nav.find": "Find a Worker",
  "nav.dashboard": "Dashboard",
  "nav.myRequests": "My Requests",
  "nav.admin": "Admin",
  "nav.support": "Support",
  "nav.signOut": "Sign out",
  "nav.signIn": "Sign in",
  "nav.join": "Join",
  "nav.language": "Language",

  // Hero
  "hero.badge": "ID-Verified Workers Only",
  "hero.title1": "Find",
  "hero.title2": "Trusted",
  "hero.title3": "Artisans & Workers in Cameroon.",
  "hero.sub":
    "Verified plumbers, electricians, mechanics, and technicians in Bamenda, Douala, and Yaoundé. Safe, fast, and reliable.",
  "hero.cta1": "Find a Worker",
  "hero.cta2": "Join as a Worker",
  "hero.badge1": "ID-Verified Only",
  "hero.badge2": "Instant Contact",
  "hero.badge3": "Local to Your City",
  "hero.available": "Available",
  "hero.verified": "Verified",

  // Search
  "search.countPrefix": "Search from",
  "search.countSuffix": "verified workers listed today",
  "search.allServices": "All services",
  "search.allLocations": "All locations",
  "search.selectService": "Select a service",
  "search.selectCity": "Select city",
  "search.button": "Search Workers",
  "search.all": "All",

  // Stats (honest)
  "stats.disclaimer":
    "These are live counts read directly from the TrustFix database — no placeholder or sample numbers.",
  "stats.workers": "Verified workers",
  "stats.workersSub": "Live count · growing weekly",
  "stats.areas": "Areas covered",
  "stats.areasSub": "Neighborhoods with a listed worker",
  "stats.checked": "ID-checked",
  "stats.checkedSub": "Every listed worker passed manual ID review",
  "stats.contact": "Contact",
  "stats.contactDirect": "Direct",
  "stats.contactSub": "No middlemen",

  // Workers grid
  "workers.title1": "Verified Workers",
  "workers.title2": "Near You",
  "workers.sub": "Every worker is ID-checked by the TrustFix team before they appear here.",
  "workers.loading": "Loading workers…",
  "workers.emptyTitle": "We don't have a verified worker for that choice yet.",
  "workers.emptyBody":
    "TrustFix lists only ID-verified artisans, and we are onboarding more every week. Try a nearby neighborhood or “All services”, or message us so we prioritise this trade in your area.",
  "workers.showAll": "Show all verified workers",
  "workers.tellUs": "Tell us what you need",
  "workers.loadMore": "Load more workers",

  // Card
  "card.live": "Live",
  "card.away": "Away",
  "card.verified": "Verified",

  // How it works
  "how.title1": "3 Steps to Hire with",
  "how.title2": "Confidence",
  "how.s1.title": "Search",
  "how.s1.desc": "Pick a service and your neighborhood.",
  "how.s2.title": "Choose Verified",
  "how.s2.desc": "Every worker has been ID-checked by our team.",
  "how.s3.title": "Connect Instantly",
  "how.s3.desc": "Call, WhatsApp, or message directly — no waiting.",

  // Worker CTA
  "cta.title1": "Are you a",
  "cta.title2": "skilled worker?",
  "cta.body":
    "Get found by clients near you. Join TrustFix, get ID-verified, and start receiving jobs in your neighborhood.",
  "cta.button": "Sign Up as a Worker",
  "cta.b1": "Free to join",
  "cta.b2": "More clients, more income",
  "cta.b3": "Your own verified profile",

  // Contact
  "contact.title": "We read every message.",
  "contact.body": "Questions, complaints, suggestions, or tech issues — reach out anytime.",
  "contact.button": "Chat with TrustFix on WhatsApp",
  "contact.note": "Or sign in to use the in-app support chat for ticketed help.",

  // Vision
  "vision.badge": "Our Mission",
  "vision.title1": "Built in Cameroon.",
  "vision.title2": "Expanding across Central Africa.",
  "vision.body":
    "TrustFix started in Bamenda with one simple promise: every artisan you find here is a real, ID-verified person. Our goal is to bring that same trust to every city in Central Africa — Cameroon first, then Gabon, Chad, Congo, the Central African Republic and Equatorial Guinea — so that finding a trusted worker is never a gamble again.",
  "vision.t1": "Today",
  "vision.d1": "Bamenda, Douala, Yaoundé — verified artisans, direct contact.",
  "vision.t2": "Next",
  "vision.d2": "Every major Cameroonian city, with more trades and local languages.",
  "vision.t3": "The goal",
  "vision.d3": "One trusted network of verified workers across Central Africa.",

  // Verification
  "verif.badge": "How Verification Works",
  "verif.title": "What “ID-verified” actually means on TrustFix",
  "verif.intro":
    "We describe our process exactly as it works today — nothing more. Verification is a manual review done by the TrustFix admin team, not an automated background check.",
  "verif.s1.title": "1. The worker uploads their CNI",
  "verif.s1.desc":
    "At sign-up, every worker must enter their Cameroonian National Identity Card (CNI) number and upload a photo of that card. The image is stored in private storage that only TrustFix admins can open.",
  "verif.s2.title": "2. A TrustFix admin reviews it manually",
  "verif.s2.desc":
    "A human admin opens the CNI photo and checks that the card is readable, that the name matches the profile name, and that the CNI number matches the uploaded card. There is no automated or third-party identity check.",
  "verif.s3.title": "3. Approval, usually within 24–48 hours",
  "verif.s3.desc":
    "If everything matches, the admin approves the profile and it becomes publicly listed. Reviews are done by hand, so it usually takes 24 to 48 hours. Profiles that fail the check are not listed.",
  "verif.limits.title": "What verification does NOT cover",
  "verif.limits.body":
    "We confirm identity — that this is a real person with a real CNI. We do not run criminal-record checks, credit checks, or trade-skill certification, and we do not guarantee the quality of any job. Always agree on price and scope before work starts, and report any problem to TrustFix support.",

  // Smart Match
  "sm.badge": "AI Smart Match",
  "sm.title1": "Describe the problem.",
  "sm.title2": "We find the artisan.",
  "sm.sub":
    "Type what you need in your own words — English or French. Our AI reads every verified profile and picks the best matches for you.",
  "sm.placeholder": "e.g. I need someone to fix a leaking bathroom pipe urgently in Nkwen",
  "sm.aria": "Describe what you need",
  "sm.button": "Find my match",
  "sm.matching": "Matching…",
  "sm.errorTitle": "Smart Match couldn't finish.",
  "sm.retry": "Try again",
  "sm.noneTitle": "We don't have a verified artisan for that request yet.",
  "sm.noneBody1":
    "TrustFix only lists workers our team has ID-verified, so we would rather tell you honestly than send you to someone unchecked. We are onboarding new artisans every week — and you can",
  "sm.noneLink": "tell us what you need on WhatsApp",
  "sm.noneBody2": "so we prioritise that trade in your area.",
  "sm.fallbackTitle": "Verified artisans available right now:",
  "sm.ex1": "I need someone to fix a leaking bathroom pipe urgently in Nkwen",
  "sm.ex2": "My generator won't start, I'm in Bonamoussadi",
  "sm.ex3": "Looking for a hairdresser for a wedding in Bamenda",

  // Services page
  "services.title": "Find a worker",
  "services.sub": "All workers are ID-verified.",
  "services.searchPlaceholder": "Search workers…",
  "services.empty": "No workers found in this specific neighborhood yet. Try searching in a nearby area!",

  // Worker profile
  "wp.back": "Back to workers",
  "wp.loading": "Loading…",
  "wp.notFound": "Worker not found or not verified yet.",
  "wp.browse": "Browse workers",
  "wp.liveNow": "Live now",
  "wp.away": "Away",
  "wp.request": "Request Service",
  "wp.awayBtn": "Worker currently away",
  "wp.requestNote": "We'll save your request and connect you to the worker on WhatsApp.",
  "wp.dialogTitle": "Request service from",
  "wp.dialogDesc":
    "Tell us what you need. After you send, we'll open WhatsApp with your request already typed in.",
  "wp.yourName": "Your name",
  "wp.yourPhone": "Your phone",
  "wp.whatNeed": "What do you need?",
  "wp.descPlaceholder": "Briefly describe the job (location, problem, urgency)…",
  "wp.sendRequest": "Send request & open WhatsApp",
  "wp.sending": "Sending…",
  "wp.msgTitle": "Leave a private message",
  "wp.msgSub": "The worker will see this in their inbox.",
  "wp.signInToSend": "Sign in to send.",
  "wp.callback": "Callback phone",
  "wp.optional": "Optional",
  "wp.message": "Message",
  "wp.msgPlaceholder": "Describe what you need help with…",
  "wp.sendMessage": "Send message",
  "wp.fillAll": "Please fill in all fields.",

  // Footer
  "footer.title": "Contact TrustFix Support & Feedback",
  "footer.body":
    "Customer or worker, we want to hear from you. Send a complaint, a suggestion, or report a tech issue — we read every message.",
  "footer.wa": "Chat with Admin Support on WhatsApp",
  "footer.rights": "TrustFix · Verified workers across Cameroon",
  "footer.name": "Your name",
  "footer.contact": "Phone or email",
  "footer.type": "Type",
  "footer.message": "Message",
  "footer.messagePlaceholder": "Tell us what's on your mind…",
  "footer.send": "Send to TrustFix",
  "footer.sending": "Sending…",
  "footer.complaint": "Complaint",
  "footer.suggestion": "Suggestion",
  "footer.tech": "Tech Issue",
  "footer.thanks": "Thanks! Your message has reached TrustFix support.",
  "footer.fillAll": "Please fill in all fields.",
} as const;

export type TranslationKey = keyof typeof en;

const fr: Record<TranslationKey, string> = {
  "nav.home": "Accueil",
  "nav.find": "Trouver un artisan",
  "nav.dashboard": "Tableau de bord",
  "nav.myRequests": "Mes demandes",
  "nav.admin": "Admin",
  "nav.support": "Assistance",
  "nav.signOut": "Se déconnecter",
  "nav.signIn": "Se connecter",
  "nav.join": "Rejoindre",
  "nav.language": "Langue",

  "hero.badge": "Uniquement des artisans vérifiés (CNI)",
  "hero.title1": "Trouvez des",
  "hero.title2": "artisans de confiance",
  "hero.title3": "au Cameroun.",
  "hero.sub":
    "Plombiers, électriciens, mécaniciens et techniciens vérifiés à Bamenda, Douala et Yaoundé. Sûr, rapide et fiable.",
  "hero.cta1": "Trouver un artisan",
  "hero.cta2": "Devenir artisan",
  "hero.badge1": "Identité vérifiée",
  "hero.badge2": "Contact immédiat",
  "hero.badge3": "Près de chez vous",
  "hero.available": "Disponible",
  "hero.verified": "Vérifié",

  "search.countPrefix": "Recherchez parmi",
  "search.countSuffix": "artisans vérifiés inscrits aujourd'hui",
  "search.allServices": "Tous les services",
  "search.allLocations": "Toutes les zones",
  "search.selectService": "Choisir un service",
  "search.selectCity": "Choisir une ville",
  "search.button": "Rechercher",
  "search.all": "Tout",

  "stats.disclaimer":
    "Ces chiffres sont lus en direct dans la base de données TrustFix — aucun chiffre inventé ou d'exemple.",
  "stats.workers": "Artisans vérifiés",
  "stats.workersSub": "Chiffre réel · en croissance chaque semaine",
  "stats.areas": "Zones couvertes",
  "stats.areasSub": "Quartiers avec au moins un artisan inscrit",
  "stats.checked": "Identité contrôlée",
  "stats.checkedSub": "Chaque artisan listé a passé la vérification manuelle de la CNI",
  "stats.contact": "Contact",
  "stats.contactDirect": "Direct",
  "stats.contactSub": "Sans intermédiaire",

  "workers.title1": "Artisans vérifiés",
  "workers.title2": "près de vous",
  "workers.sub":
    "Chaque artisan est contrôlé (CNI) par l'équipe TrustFix avant d'apparaître ici.",
  "workers.loading": "Chargement des artisans…",
  "workers.emptyTitle": "Nous n'avons pas encore d'artisan vérifié pour ce choix.",
  "workers.emptyBody":
    "TrustFix ne liste que des artisans dont l'identité est vérifiée, et nous en ajoutons chaque semaine. Essayez un quartier voisin ou « Tous les services », ou écrivez-nous pour que nous priorisions ce métier dans votre zone.",
  "workers.showAll": "Voir tous les artisans vérifiés",
  "workers.tellUs": "Dites-nous ce qu'il vous faut",
  "workers.loadMore": "Voir plus d'artisans",

  "card.live": "En ligne",
  "card.away": "Absent",
  "card.verified": "Vérifié",

  "how.title1": "3 étapes pour recruter en",
  "how.title2": "confiance",
  "how.s1.title": "Rechercher",
  "how.s1.desc": "Choisissez un service et votre quartier.",
  "how.s2.title": "Choisir un vérifié",
  "how.s2.desc": "Chaque artisan a été contrôlé (CNI) par notre équipe.",
  "how.s3.title": "Contacter aussitôt",
  "how.s3.desc": "Appel, WhatsApp ou message direct — sans attendre.",

  "cta.title1": "Vous êtes",
  "cta.title2": "un artisan qualifié ?",
  "cta.body":
    "Soyez trouvé par des clients près de vous. Rejoignez TrustFix, faites vérifier votre identité et recevez des missions dans votre quartier.",
  "cta.button": "S'inscrire comme artisan",
  "cta.b1": "Inscription gratuite",
  "cta.b2": "Plus de clients, plus de revenus",
  "cta.b3": "Votre profil vérifié",

  "contact.title": "Nous lisons chaque message.",
  "contact.body":
    "Questions, réclamations, suggestions ou problèmes techniques — écrivez-nous à tout moment.",
  "contact.button": "Discuter avec TrustFix sur WhatsApp",
  "contact.note":
    "Ou connectez-vous pour utiliser la messagerie d'assistance intégrée.",

  "vision.badge": "Notre mission",
  "vision.title1": "Né au Cameroun.",
  "vision.title2": "En expansion en Afrique centrale.",
  "vision.body":
    "TrustFix est né à Bamenda avec une promesse simple : chaque artisan que vous trouvez ici est une personne réelle, dont l'identité a été vérifiée. Notre objectif est d'apporter cette même confiance à toutes les villes d'Afrique centrale — le Cameroun d'abord, puis le Gabon, le Tchad, le Congo, la République centrafricaine et la Guinée équatoriale — pour que trouver un artisan fiable ne soit plus un pari.",
  "vision.t1": "Aujourd'hui",
  "vision.d1": "Bamenda, Douala, Yaoundé — artisans vérifiés, contact direct.",
  "vision.t2": "Ensuite",
  "vision.d2":
    "Toutes les grandes villes camerounaises, avec plus de métiers et de langues locales.",
  "vision.t3": "L'objectif",
  "vision.d3": "Un seul réseau d'artisans vérifiés dans toute l'Afrique centrale.",

  "verif.badge": "Comment fonctionne la vérification",
  "verif.title": "Ce que « identité vérifiée » signifie réellement sur TrustFix",
  "verif.intro":
    "Nous décrivons notre processus exactement tel qu'il fonctionne aujourd'hui — rien de plus. La vérification est un contrôle manuel effectué par l'équipe d'administration TrustFix, et non une enquête automatisée.",
  "verif.s1.title": "1. L'artisan téléverse sa CNI",
  "verif.s1.desc":
    "À l'inscription, chaque artisan doit saisir son numéro de Carte Nationale d'Identité (CNI) camerounaise et téléverser une photo de cette carte. L'image est stockée dans un espace privé accessible uniquement aux administrateurs TrustFix.",
  "verif.s2.title": "2. Un administrateur TrustFix la contrôle à la main",
  "verif.s2.desc":
    "Un administrateur humain ouvre la photo de la CNI et vérifie que la carte est lisible, que le nom correspond au profil et que le numéro de CNI correspond à la carte téléversée. Il n'y a aucun contrôle d'identité automatisé ou externe.",
  "verif.s3.title": "3. Validation, généralement en 24 à 48 heures",
  "verif.s3.desc":
    "Si tout correspond, l'administrateur valide le profil qui devient alors visible publiquement. Les contrôles étant manuels, cela prend généralement de 24 à 48 heures. Les profils non conformes ne sont pas publiés.",
  "verif.limits.title": "Ce que la vérification ne couvre PAS",
  "verif.limits.body":
    "Nous confirmons l'identité — qu'il s'agit d'une personne réelle avec une CNI réelle. Nous ne faisons pas d'enquête judiciaire, de vérification financière ni de certification des compétences, et nous ne garantissons pas la qualité des travaux. Convenez toujours du prix et de l'étendue des travaux avant de commencer, et signalez tout problème à l'assistance TrustFix.",

  "sm.badge": "Recherche intelligente IA",
  "sm.title1": "Décrivez le problème.",
  "sm.title2": "Nous trouvons l'artisan.",
  "sm.sub":
    "Écrivez ce dont vous avez besoin avec vos propres mots — en français ou en anglais. Notre IA lit chaque profil vérifié et choisit les meilleures correspondances.",
  "sm.placeholder": "ex. J'ai une fuite d'eau dans la salle de bain à Nkwen, c'est urgent",
  "sm.aria": "Décrivez votre besoin",
  "sm.button": "Trouver mon artisan",
  "sm.matching": "Recherche…",
  "sm.errorTitle": "La recherche intelligente n'a pas abouti.",
  "sm.retry": "Réessayer",
  "sm.noneTitle": "Nous n'avons pas encore d'artisan vérifié pour cette demande.",
  "sm.noneBody1":
    "TrustFix ne liste que des artisans dont notre équipe a vérifié l'identité ; nous préférons vous le dire honnêtement plutôt que de vous envoyer vers quelqu'un de non contrôlé. Nous ajoutons de nouveaux artisans chaque semaine — et vous pouvez",
  "sm.noneLink": "nous dire votre besoin sur WhatsApp",
  "sm.noneBody2": "pour que nous priorisions ce métier dans votre zone.",
  "sm.fallbackTitle": "Artisans vérifiés disponibles maintenant :",
  "sm.ex1": "J'ai une fuite d'eau dans la salle de bain à Nkwen, c'est urgent",
  "sm.ex2": "Mon groupe électrogène ne démarre pas, je suis à Bonamoussadi",
  "sm.ex3": "Je cherche une coiffeuse pour un mariage à Bamenda",

  "services.title": "Trouver un artisan",
  "services.sub": "Tous les artisans ont une identité vérifiée.",
  "services.searchPlaceholder": "Rechercher un artisan…",
  "services.empty":
    "Aucun artisan trouvé dans ce quartier pour le moment. Essayez une zone voisine !",

  "wp.back": "Retour aux artisans",
  "wp.loading": "Chargement…",
  "wp.notFound": "Artisan introuvable ou pas encore vérifié.",
  "wp.browse": "Parcourir les artisans",
  "wp.liveNow": "En ligne",
  "wp.away": "Absent",
  "wp.request": "Demander une intervention",
  "wp.awayBtn": "Artisan actuellement absent",
  "wp.requestNote":
    "Nous enregistrons votre demande puis vous mettons en contact sur WhatsApp.",
  "wp.dialogTitle": "Demander une intervention à",
  "wp.dialogDesc":
    "Dites-nous ce dont vous avez besoin. Après l'envoi, WhatsApp s'ouvrira avec votre demande déjà rédigée.",
  "wp.yourName": "Votre nom",
  "wp.yourPhone": "Votre téléphone",
  "wp.whatNeed": "De quoi avez-vous besoin ?",
  "wp.descPlaceholder": "Décrivez brièvement le travail (lieu, problème, urgence)…",
  "wp.sendRequest": "Envoyer et ouvrir WhatsApp",
  "wp.sending": "Envoi…",
  "wp.msgTitle": "Laisser un message privé",
  "wp.msgSub": "L'artisan le verra dans sa boîte de réception.",
  "wp.signInToSend": "Connectez-vous pour envoyer.",
  "wp.callback": "Téléphone de rappel",
  "wp.optional": "Facultatif",
  "wp.message": "Message",
  "wp.msgPlaceholder": "Décrivez ce pour quoi vous avez besoin d'aide…",
  "wp.sendMessage": "Envoyer le message",
  "wp.fillAll": "Veuillez remplir tous les champs.",

  "footer.title": "Contacter l'assistance TrustFix & donner votre avis",
  "footer.body":
    "Client ou artisan, nous voulons vous entendre. Envoyez une réclamation, une suggestion ou signalez un problème technique — nous lisons chaque message.",
  "footer.wa": "Discuter avec l'assistance sur WhatsApp",
  "footer.rights": "TrustFix · Artisans vérifiés au Cameroun",
  "footer.name": "Votre nom",
  "footer.contact": "Téléphone ou e-mail",
  "footer.type": "Type",
  "footer.message": "Message",
  "footer.messagePlaceholder": "Dites-nous tout…",
  "footer.send": "Envoyer à TrustFix",
  "footer.sending": "Envoi…",
  "footer.complaint": "Réclamation",
  "footer.suggestion": "Suggestion",
  "footer.tech": "Problème technique",
  "footer.thanks": "Merci ! Votre message est arrivé à l'assistance TrustFix.",
  "footer.fillAll": "Veuillez remplir tous les champs.",
};

const DICTS: Record<Lang, Record<TranslationKey, string>> = { en, fr };

/* ------------------------------------------------------------------ */
/* Language detection for free-text queries                            */
/* ------------------------------------------------------------------ */

const FRENCH_MARKERS = [
  "je ", "j'", "besoin", "cherche", "quelqu'un", "pour ", "une ", "un ", "des ",
  "réparer", "reparer", "fuite", "plombier", "électricien", "electricien",
  "coiffeuse", "coiffeur", "maçon", "macon", "menuisier", "urgent",
  "salle de bain", "à ", "au ", "dans ", "mon ", "ma ", "mes ", "s'il vous plaît",
  "peintre", "soudeur", "mécanicien", "mecanicien", "nettoyage", "ménage", "menage",
  "groupe électrogène", "electrogene", "carrelage", "tailleur", "climatiseur",
];

/** Cheap, dependency-free language guess for a user's free-text query. */
export function detectQueryLang(text: string): Lang {
  const t = ` ${text.toLowerCase()} `;
  let score = 0;
  for (const m of FRENCH_MARKERS) if (t.includes(m)) score += 1;
  if (/[àâçéèêëîïôùûœ]/.test(t)) score += 2;
  return score >= 2 ? "fr" : "en";
}

/* ------------------------------------------------------------------ */
/* Provider                                                           */
/* ------------------------------------------------------------------ */

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "fr") return stored;
  const nav = window.navigator.language ?? "";
  return nav.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Start with "en" so SSR and first client render match, then resolve
  // the stored/browser preference right after hydration.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const resolved = initialLang();
    setLangState(resolved);
    document.documentElement.lang = resolved;
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key) => DICTS[lang][key] ?? DICTS.en[key] ?? key,
    }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback so components never crash outside the provider.
    return { lang: "en", setLang: () => {}, t: (key) => DICTS.en[key] ?? key };
  }
  return ctx;
}
