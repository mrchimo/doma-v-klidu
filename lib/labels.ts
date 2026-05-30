export const requestStatusLabels: Record<string, string> = {
  open: "Otevřená",
  matched: "Domluvená",
  cancelled: "Zrušená",
  completed: "Dokončená"
};

export const sitterRequestStatusLabels: Record<string, string> = {
  sent: "Odesláno",
  accepted: "Přijato",
  declined: "Odmítnuto",
  cancelled: "Zrušeno",
  completed: "Dokončeno"
};

export const sittingAgreementStatusLabels: Record<string, string> = {
  confirmed: "Domluveno",
  cancelled: "Zrušeno",
  completed: "Dokončeno"
};

export const approvalStatusLabels: Record<string, string> = {
  pending_approval: "Čeká na schválení",
  approved: "Schválený sitter",
  rejected: "Zamítnuto"
};

export const sittingTypeLabels: Record<string, string> = {
  overnight: "Přespání v domácnosti",
  daily_visits: "Denní návštěvy",
  walking_home_check: "Venčení + kontrola domácnosti",
  urgent_help: "Urgentní pomoc"
};

export const taskLabels: Record<string, string> = {
  feeding: "Krmení",
  walking: "Venčení",
  litter_box: "Kočičí toaleta",
  medication: "Léky",
  watering_plants: "Zalévání rostlin",
  mail: "Pošta",
  safety_check: "Kontrola bytu",
  other: "Jiné"
};

export const requirementLabels: Record<string, string> = {
  dogs: "Zkušenost se psy",
  cats: "Zkušenost s kočkami",
  medication: "Umí podat léky",
  overnight: "Může přespat",
  reactive_animals: "Zkušenost s citlivými zvířaty"
};

export const checklistCategoryLabels: Record<string, string> = {
  pet_care: "Péče o mazlíčka",
  home: "Domácnost",
  access: "Přístup a klíče",
  safety: "Bezpečnost",
  plants_mail: "Rostliny a pošta",
  other: "Jiné"
};

export const availabilityLabels: Record<string, string> = {
  available_weekends: "Víkendy",
  available_weekday_evenings: "Všední večery",
  available_mornings: "Rána",
  available_short_notice: "Rychlá domluva"
};

export const trustSignalLabels: Record<string, string> = {
  phone_verified: "Ověřený telefon",
  reference_checked: "Reference ověřena",
  video_intro_reviewed: "Video zkontrolováno",
  bio_reviewed: "Bio zkontrolováno",
  experience_reviewed: "Zkušenosti zkontrolovány",
  risk_reviewed: "Rizika zkontrolována"
};

export const sitterRiskFlagLabels: Record<string, string> = {
  missing_reference: "Chybí reference",
  short_experience: "Stručné zkušenosti",
  unclear_motivation: "Nejasná motivace",
  inconsistent_availability: "Nejasná dostupnost",
  communication_risk: "Komunikace ke kontrole",
  outside_mvp_scope: "Mimo rozsah MVP",
  other: "Jiné riziko"
};

export function labelFor(labels: Record<string, string>, value?: string | null) {
  if (!value) return "Neuvedeno";
  return labels[value] ?? value;
}

export function formatDate(value?: string | null) {
  if (!value) return "Neuvedeno";
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Neuvedeno";
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
