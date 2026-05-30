import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CalmReportPetStatus, CalmReportTaskStatus } from "@/lib/types/database";

export const calmReportPetStatusLabels: Record<CalmReportPetStatus, string> = {
  okay: "Mazlíček je v pořádku",
  attention: "Vyžaduje pozornost"
};

export const calmReportTaskStatusLabels: Record<CalmReportTaskStatus, string> = {
  done: "Hotovo",
  not_needed: "Není potřeba",
  attention: "Vyžaduje pozornost"
};

export function calmReportTone(status: CalmReportPetStatus | CalmReportTaskStatus): "green" | "muted" | "amber" {
  if (status === "attention") return "amber";
  if (status === "not_needed") return "muted";
  return "green";
}

export function calmReportNeedsAttention(report: {
  pet_status: CalmReportPetStatus;
  feeding_status: CalmReportTaskStatus;
  walking_status: CalmReportTaskStatus;
  home_check_status: CalmReportTaskStatus;
}) {
  return [report.pet_status, report.feeding_status, report.walking_status, report.home_check_status].includes("attention");
}

export async function withCalmReportPhotoUrl<T extends { photo_path: string | null }>(report: T | null | undefined) {
  if (!report?.photo_path) return report ? { ...report, photo_url: null as string | null } : null;
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.storage.from("calm-report-photos").createSignedUrl(report.photo_path, 60 * 60);
  return { ...report, photo_url: data?.signedUrl ?? null };
}

export async function withCalmReportPhotoUrls<T extends { photo_path: string | null }>(reports: T[] | null | undefined) {
  return Promise.all((reports ?? []).map((report) => withCalmReportPhotoUrl(report)));
}
