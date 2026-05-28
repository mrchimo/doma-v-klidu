type RequestLike = {
  sitting_type?: string | null;
  sitter_requirements?: string[] | null;
  tasks?: string[] | null;
  urgency?: string | null;
};

type SitterLike = {
  accepts_dogs?: boolean | null;
  accepts_cats?: boolean | null;
  overnight_stays?: boolean | null;
  daily_visits?: boolean | null;
  dog_walking?: boolean | null;
  emergency_help?: boolean | null;
  medication_experience?: boolean | null;
  reactive_dog_experience?: boolean | null;
  available_short_notice?: boolean | null;
};

export type SitterFit = {
  score: number;
  label: string;
  tone: "green" | "amber" | "muted" | "red";
  matched: string[];
  missing: string[];
};

function addCheck(checks: { label: string; ok: boolean }[], label: string, ok: boolean) {
  if (!checks.some((check) => check.label === label)) checks.push({ label, ok });
}

export function evaluateSitterFit(request: RequestLike, sitter: SitterLike): SitterFit {
  const checks: { label: string; ok: boolean }[] = [];
  const requirements = request.sitter_requirements ?? [];
  const tasks = request.tasks ?? [];

  if (request.sitting_type === "overnight") addCheck(checks, "přespání v domácnosti", Boolean(sitter.overnight_stays));
  if (request.sitting_type === "daily_visits") addCheck(checks, "denní návštěvy", Boolean(sitter.daily_visits));
  if (request.sitting_type === "walking_home_check") addCheck(checks, "venčení a kontrola domácnosti", Boolean(sitter.dog_walking || sitter.daily_visits));
  if (request.sitting_type === "urgent_help") addCheck(checks, "urgentní pomoc", Boolean(sitter.emergency_help || sitter.available_short_notice));

  if (request.urgency === "urgent") addCheck(checks, "rychlá domluva", Boolean(sitter.emergency_help || sitter.available_short_notice));

  if (requirements.includes("dogs")) addCheck(checks, "zkušenost se psy", Boolean(sitter.accepts_dogs));
  if (requirements.includes("cats")) addCheck(checks, "zkušenost s kočkami", Boolean(sitter.accepts_cats));
  if (requirements.includes("medication")) addCheck(checks, "podání léků", Boolean(sitter.medication_experience));
  if (requirements.includes("overnight")) addCheck(checks, "přespání možné", Boolean(sitter.overnight_stays));
  if (requirements.includes("reactive_animals")) addCheck(checks, "citlivá zvířata", Boolean(sitter.reactive_dog_experience));

  if (tasks.includes("walking")) addCheck(checks, "venčení", Boolean(sitter.dog_walking));
  if (tasks.includes("medication")) addCheck(checks, "léky v úkolech", Boolean(sitter.medication_experience));
  if (tasks.includes("litter_box")) addCheck(checks, "kočičí péče", Boolean(sitter.accepts_cats));

  const matched = checks.filter((check) => check.ok).map((check) => check.label);
  const missing = checks.filter((check) => !check.ok).map((check) => check.label);
  const score = checks.length ? Math.round((matched.length / checks.length) * 100) : 70;

  if (score >= 80) return { score, label: "Silná shoda", tone: "green", matched, missing };
  if (score >= 55) return { score, label: "Dobrá shoda", tone: "amber", matched, missing };
  if (score > 0) return { score, label: "Částečná shoda", tone: "muted", matched, missing };
  return { score, label: "Nutno ověřit", tone: "red", matched, missing };
}
