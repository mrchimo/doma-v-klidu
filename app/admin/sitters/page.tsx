import { AlertTriangle, CheckCircle2, CircleDashed, ShieldCheck } from "lucide-react";
import { approveSitterAction, updateSitterTrustAction } from "@/app/actions";
import { Badge, Card, Field, Header, Shell, textAreaClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { approvalStatusLabels, sitterRiskFlagLabels, trustSignalLabels } from "@/lib/labels";
import { getSitterQualityReview } from "@/lib/sitter-quality";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminSittersPageProps = {
  searchParams?: Promise<{ error?: string; missing?: string }>;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const statusWeight: Record<string, number> = {
  pending_approval: 0,
  approved: 1,
  rejected: 2
};

function approvalTone(status: string) {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  return "amber";
}

export default async function AdminSittersPage({ searchParams }: AdminSittersPageProps) {
  const params = await searchParams;
  const { profile } = await requireProfile(["admin"]);
  const supabase = await createSupabaseServerClient();
  const { data: sitters } = await supabase
    .from("sitter_profiles")
    .select("*, profile:profiles!sitter_profiles_user_id_fkey(full_name, email, city, neighborhood, phone)")
    .order("created_at", { ascending: false });

  const reviewedSitters = (sitters ?? [])
    .map((sitter) => {
      const person = one(sitter.profile);
      const review = getSitterQualityReview({ ...sitter, phone: person?.phone });
      return { sitter, person, review };
    })
    .sort((a, b) => {
      const statusOrder = (statusWeight[a.sitter.approval_status] ?? 9) - (statusWeight[b.sitter.approval_status] ?? 9);
      if (statusOrder !== 0) return statusOrder;
      if (a.review.readyToApprove !== b.review.readyToApprove) return a.review.readyToApprove ? -1 : 1;
      return a.sitter.created_at < b.sitter.created_at ? 1 : -1;
    });

  const pendingCount = reviewedSitters.filter(({ sitter }) => sitter.approval_status === "pending_approval").length;
  const readyCount = reviewedSitters.filter(({ sitter, review }) => sitter.approval_status === "pending_approval" && review.readyToApprove).length;
  const riskCount = reviewedSitters.filter(({ review }) => review.riskFlags.length > 0).length;
  const approvedCount = reviewedSitters.filter(({ sitter }) => sitter.approval_status === "approved").length;

  return (
    <Shell>
      <Header role={profile.role} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schvalovací fronta sitterů</h1>
          <p className="mt-2 text-stone-600">Kontrola profilu před zveřejněním: kontakt, bio, zkušenosti, reference, video a rizikové signály.</p>
        </div>
        <Badge tone="muted">{reviewedSitters.length} profilů</Badge>
      </div>

      {params?.error === "quality" ? (
        <Card className="mb-5 border-amber-200 bg-amber-50 shadow-none">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h2 className="font-semibold text-amber-950">Profil ještě není připravený ke schválení</h2>
              <p className="mt-1 text-sm text-stone-700">Nejprve doplňte nebo potvrďte: {params.missing || "povinné body checklistu"}.</p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none"><p className="text-sm text-stone-600">Čeká na kontrolu</p><p className="mt-1 text-2xl font-bold">{pendingCount}</p></Card>
        <Card className="shadow-none"><p className="text-sm text-stone-600">Připraveno ke schválení</p><p className="mt-1 text-2xl font-bold">{readyCount}</p></Card>
        <Card className="shadow-none"><p className="text-sm text-stone-600">S rizikovým signálem</p><p className="mt-1 text-2xl font-bold">{riskCount}</p></Card>
        <Card className="shadow-none"><p className="text-sm text-stone-600">Schváleno</p><p className="mt-1 text-2xl font-bold">{approvedCount}</p></Card>
      </div>

      <div className="grid gap-4">
        {reviewedSitters.map(({ sitter, person, review }) => (
          <Card key={sitter.id}>
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{person?.full_name ?? "Bez jména"}</h2>
                  <Badge tone={approvalTone(sitter.approval_status)}>{approvalStatusLabels[sitter.approval_status] ?? sitter.approval_status}</Badge>
                  <Badge tone={review.tone}>{review.statusLabel}</Badge>
                  {sitter.is_featured ? <Badge tone="amber">Doporučený profil</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-stone-600">
                  {[person?.city, person?.neighborhood, person?.phone, person?.email].filter(Boolean).join(" · ")}
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Bio</p>
                    <p className="mt-1 text-sm leading-6 text-stone-700">{sitter.bio || "Bio není vyplněné."}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Zkušenosti</p>
                    <p className="mt-1 text-sm leading-6 text-stone-700">{sitter.animal_experience || "Zkušenosti nejsou vyplněné."}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Reference</p>
                    <p className="mt-1 text-sm leading-6 text-stone-700">{sitter.reference_contact || "Reference není uvedená."}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Video</p>
                    <p className="mt-1 break-words text-sm leading-6 text-stone-700">{sitter.video_intro_url || "Video není uvedené."}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-forest-900">Checklist schválení</p>
                    <p className="text-sm text-stone-600">{review.completedCount}/{review.totalCount} hotovo</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-forest-700" style={{ width: `${review.score}%` }} />
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {review.items.map((item) => (
                      <div key={item.key} className="flex gap-2 rounded-lg border border-forest-100 bg-linen/50 p-3">
                        {item.complete ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
                        ) : (
                          <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-forest-950">{item.label}</p>
                          <p className="mt-0.5 text-xs leading-5 text-stone-600">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {sitter.phone_verified ? <Badge>{trustSignalLabels.phone_verified}</Badge> : null}
                  {sitter.bio_reviewed ? <Badge>{trustSignalLabels.bio_reviewed}</Badge> : null}
                  {sitter.experience_reviewed ? <Badge>{trustSignalLabels.experience_reviewed}</Badge> : null}
                  {sitter.reference_checked ? <Badge>{trustSignalLabels.reference_checked}</Badge> : null}
                  {sitter.video_intro_reviewed ? <Badge>{trustSignalLabels.video_intro_reviewed}</Badge> : null}
                  {sitter.risk_reviewed ? <Badge>{trustSignalLabels.risk_reviewed}</Badge> : null}
                  {review.riskLabels.map((label) => <Badge key={label} tone="red">{label}</Badge>)}
                </div>

                {review.blockingItems.length ? (
                  <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                    Před schválením chybí: {review.blockingItems.join(", ")}.
                  </p>
                ) : null}
                {sitter.admin_public_note ? (
                  <p className="mt-3 rounded-lg bg-forest-50 p-3 text-sm leading-6 text-forest-900">{sitter.admin_public_note}</p>
                ) : null}
                {sitter.risk_notes ? (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-900">Rizika: {sitter.risk_notes}</p>
                ) : null}
                {sitter.admin_private_note ? (
                  <p className="mt-3 rounded-lg bg-stone-100 p-3 text-sm leading-6 text-stone-700">Interně: {sitter.admin_private_note}</p>
                ) : null}
              </div>

              <div className="grid content-start gap-3">
                <form action={approveSitterAction} className="grid gap-2 rounded-lg border border-forest-100 bg-white p-3">
                  <input type="hidden" name="user_id" value={sitter.user_id} />
                  <div className="flex items-center gap-2 text-sm font-semibold text-forest-900">
                    <ShieldCheck className="h-4 w-4" />
                    Rozhodnutí admina
                  </div>
                  <button
                    name="approval_status"
                    value="approved"
                    disabled={!review.readyToApprove}
                    className="min-h-11 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-300"
                  >
                    Schválit
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button name="approval_status" value="rejected" className="min-h-11 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Odmítnout</button>
                    <button name="approval_status" value="pending_approval" className="min-h-11 rounded-lg bg-stone-700 px-4 py-2 text-sm font-semibold text-white">Vrátit</button>
                  </div>
                </form>

                <form action={updateSitterTrustAction} className="grid gap-3 rounded-lg border border-forest-100 bg-linen/60 p-3">
                  <input type="hidden" name="user_id" value={sitter.user_id} />
                  <p className="text-sm font-semibold text-forest-900">Kontrola kvality</p>
                  <div className="grid gap-2 text-sm text-stone-700">
                    <label className="flex items-center gap-2"><input type="checkbox" name="phone_verified" defaultChecked={sitter.phone_verified} />Ověřený telefon</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="bio_reviewed" defaultChecked={sitter.bio_reviewed} />Bio zkontrolováno</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="experience_reviewed" defaultChecked={sitter.experience_reviewed} />Zkušenosti zkontrolovány</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="reference_checked" defaultChecked={sitter.reference_checked} />Reference zkontrolována</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="video_intro_reviewed" defaultChecked={sitter.video_intro_reviewed} />Video zkontrolováno</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="risk_reviewed" defaultChecked={sitter.risk_reviewed} />Rizikové signály zkontrolovány</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={sitter.is_featured} />Doporučit v adresáři</label>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-forest-900">Rizikové signály</p>
                    <div className="grid gap-2 text-sm text-stone-700">
                      {Object.entries(sitterRiskFlagLabels).map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2">
                          <input type="checkbox" name="risk_flags" value={value} defaultChecked={review.riskFlags.includes(value)} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <Field label="Veřejná poznámka admina" name={`admin_public_note_${sitter.id}`}>
                    <textarea
                      className={textAreaClass}
                      id={`admin_public_note_${sitter.id}`}
                      name="admin_public_note"
                      defaultValue={sitter.admin_public_note ?? ""}
                      placeholder="Např. Profil a reference zkontrolovány administrátorem."
                    />
                  </Field>
                  <Field label="Poznámka k rizikům" name={`risk_notes_${sitter.id}`}>
                    <textarea
                      className={textAreaClass}
                      id={`risk_notes_${sitter.id}`}
                      name="risk_notes"
                      defaultValue={sitter.risk_notes ?? ""}
                      placeholder="Co je potřeba vyjasnit před schválením."
                    />
                  </Field>
                  <Field label="Interní poznámka" name={`admin_private_note_${sitter.id}`}>
                    <textarea
                      className={textAreaClass}
                      id={`admin_private_note_${sitter.id}`}
                      name="admin_private_note"
                      defaultValue={sitter.admin_private_note ?? ""}
                      placeholder="Poznámka jen pro admina."
                    />
                  </Field>
                  <button className="min-h-11 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white">Uložit kontrolu</button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
