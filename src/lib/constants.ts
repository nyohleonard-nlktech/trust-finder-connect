export const NEIGHBORHOODS = [
  "Bambili",
  "Mile 3",
  "Upstation",
  "Bonamoussadi",
  "Akwa",
  "Bastos",
  "Bonapriso",
  "Deido",
  "Bonanjo",
  "Makepe",
  "Nkoldongo",
  "Mvan",
] as const;

export const SERVICE_CATEGORIES = [
  "Plumber",
  "Electrician",
  "Carpenter",
  "Mason",
  "Painter",
  "Mechanic",
  "Cleaner",
  "AC Technician",
  "Welder",
  "Tiler",
  "Hairdresser",
  "Tailor",
] as const;

export type Neighborhood = (typeof NEIGHBORHOODS)[number];
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
