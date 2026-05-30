import { Camera, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui";
import { calmReportNeedsAttention, calmReportPetStatusLabels, calmReportTaskStatusLabels, calmReportTone } from "@/lib/calm-reports";
import { formatDateTime } from "@/lib/labels";
import type { CalmReport } from "@/lib/types/database";

type CalmReportWithPhoto = CalmReport & {
  photo_url?: string | null;
};

export function CalmReportCard({ report, subtitle }: { report: CalmReportWithPhoto; subtitle?: string }) {
  const needsAttention = calmReportNeedsAttention(report);

  return (
    <div className="rounded-lg border border-forest-100 bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold">Klidový report</h3>
          <p className="mt-1 text-xs text-stone-600">{subtitle ? `${subtitle} · ` : ""}{formatDateTime(report.submitted_at)}</p>
        </div>
        <Badge tone={needsAttention ? "amber" : "green"}>{needsAttention ? "Zkontrolovat" : "V pořádku"}</Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <div><p className="text-xs text-stone-600">Mazlíček</p><Badge tone={calmReportTone(report.pet_status)}>{calmReportPetStatusLabels[report.pet_status]}</Badge></div>
        <div><p className="text-xs text-stone-600">Krmení</p><Badge tone={calmReportTone(report.feeding_status)}>{calmReportTaskStatusLabels[report.feeding_status]}</Badge></div>
        <div><p className="text-xs text-stone-600">Venčení</p><Badge tone={calmReportTone(report.walking_status)}>{calmReportTaskStatusLabels[report.walking_status]}</Badge></div>
        <div><p className="text-xs text-stone-600">Kontrola bytu</p><Badge tone={calmReportTone(report.home_check_status)}>{calmReportTaskStatusLabels[report.home_check_status]}</Badge></div>
      </div>

      {report.note ? <p className="mt-3 rounded-lg bg-linen p-3 text-sm leading-6 text-stone-700">{report.note}</p> : null}
      {report.photo_url ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
            <Camera className="h-4 w-4" />
            Přiložená fotka
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="max-h-72 w-full rounded-lg border border-forest-100 object-cover" src={report.photo_url} alt="Fotka z klidového reportu" />
        </div>
      ) : null}
      {needsAttention ? (
        <p className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-950">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          Report obsahuje bod, který je dobré zkontrolovat.
        </p>
      ) : null}
    </div>
  );
}
