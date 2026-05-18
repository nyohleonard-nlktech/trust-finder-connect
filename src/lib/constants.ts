export const NEIGHBORHOODS_BY_CITY = {
  Bamenda: ["Up Station", "Mankon", "Nkwen", "Bambili", "Mile 2", "Mile 3", "Mile 4", "Mile 5", "Mile 6"],
  Douala: ["Bonamoussadi", "Akwa", "Bonapriso", "Deido", "Bonanjo", "Makepe"],
  Yaoundé: ["Bastos", "Nkoldongo", "Mvan"],
} as const;

export const NEIGHBORHOODS = Object.values(NEIGHBORHOODS_BY_CITY).flat() as readonly string[];

export const SERVICE_CATEGORIES = [
  "Plumber",
  "Electrician",
  "AC Repair",
  "Generator Maintenance",
  "Cleaning / House Help",
  "Bike Service",
  "Mechanic",
  "Carpenter",
  "Mason",
  "Painter",
  "Welder",
  "Tiler",
  "Hairdresser",
  "Tailor",
] as const;

export type Neighborhood = (typeof NEIGHBORHOODS)[number];
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

/** Admin WhatsApp number (digits only, with country code) for support chat. */
export const ADMIN_WHATSAPP = "237659498770";
