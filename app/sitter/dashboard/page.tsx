import { acceptSitterRequestAction, declineSitterRequestAction } from "@/app/actions";
import { Badge, ButtonLink, Card, EmptyState, Header, InfoBox, Shell, textAreaClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { approvalStatusLabels, checklistCategoryLabels, formatDate, sitterRequestStatusLabels, sittingTypeLabels, labelFor } from "@/lib/labels";
import { evaluateSitterFit } from "@/lib/sitter-fit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SitterDashboardPage() {
  const { profile } = await requireProfile(["sitter", "professional"]);
  const supabase = await createSupabaseServerClient();
  const [{ data: sitterProfile }, { data: requests }, { data: agreements }] = await Promise.all([
    supabase.from("sitter_profiles").select("*").eq("user_id", profile.id).maybeSingle(),
    supabase
      .from("sitter_requests")
      .select("*, request:house_sitting_requests(title, start_date, end_date, sitting_type, budget_range, tasks, sitter_requirements, urgency, preferred_time_windows), owner:profiles!sitter_requests_owner_id_fkey(full_name, city, neighborhood)")
      .eq("sitter_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("sitting_agreements")
      .select("*, request:house_sitting_requests(title, start_date, end_date, sitting_type), owner:profiles!sitting_agreements_owner_id_fkey(full_name, city, neighborhood)")
      .eq("sitter_id", profile.id)
      .eq("status", "confirmed")
      .order("confirmed_at", { ascending: false })
  ]);
  const requestIds = requests?.map((item) => item.request_id).filter(Boolean) ?? [];
  const { data: checklistItems } = requestIds.length
    ? await supabase.from("handover_checklist_items").select("*").in("request_id", requestIds).order("sort_order", { ascending: true })
    : { data: [] };
  const checklistByRequest = new Map<string, typeof checklistItems>();
  checklistItems?.forEach((item) => {
    const items = checklistByRequest.get(item.request_id) ?? [];
    items.push(item);
    checklistByRequest.set(item.request_id, items);
  });

  const completion = sitterProfile ? 85 : 20;
  const tone = sitterProfile?.approval_status === "approved" ? "green" : sitterProfile?.approval_status === "rejected" ? "red" : "amber";
  const incoming = requests?.filter((item) => item.status === "sent") ?? [];
  const handled = requests?.filter((item) => item.status !== "sent") ?? [];

  return (
    <Shell>
      <Header role={profile.role} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sitter přehled</h1>
          <p className="mt-2 text-stone-600">{profile.full_name} · {profile.city ?? "město nedoplněno"}</p>
        </div>
        <ButtonLink href="/sitter/onboarding" variant="secondary">Upravit profil</ButtonLink>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Stav schválení</h2>
          <div className="mt-3"><Badge tone={tone}>{sitterProfile?.approval_status ? approvalStatusLabels[sitterProfile.approval_status] : "Profil nedokončen"}</Badge></div>
          <p className="mt-3 text-sm text-stone-600">Veřejně se zobrazí pouze schválený sitter.</p>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Dokončení profilu</h2>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-forest-100"><div className="h-full bg-forest-700" style={{ width: `${completion}%` }} /></div>
          <p className="mt-2 text-sm text-stone-600">{completion}%</p>
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Domluvená hlídání</h2>
            <p className="mt-1 text-sm text-stone-600">Potvrzené termíny, které už majitel označil jako platnou domluvu.</p>
          </div>
          <Badge tone={agreements?.length ? "green" : "muted"}>{agreements?.length ?? 0} aktivní</Badge>
        </div>
        <div className="mt-4 grid gap-3">
          {agreements?.map((agreement) => (
            <div key={agreement.id} className="rounded-lg border border-forest-100 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{agreement.request?.title}</p>
                <Badge>Domluveno</Badge>
              </div>
              <p className="mt-1 text-sm text-stone-600">{agreement.owner?.full_name} · {formatDate(agreement.request?.start_date)} - {formatDate(agreement.request?.end_date)}</p>
              <p className="mt-1 text-sm text-stone-600">{labelFor(sittingTypeLabels, agreement.request?.sitting_type)}</p>
              {agreement.owner_note ? <p className="mt-2 rounded-lg bg-linen p-3 text-sm leading-6 text-stone-700">{agreement.owner_note}</p> : null}
            </div>
          ))}
          {!agreements?.length ? <p className="text-sm text-stone-600">Zatím nemáte žádné potvrzené hlídání.</p> : null}
        </div>
      </Card>

      <Card className="mt-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Nové žádosti</h2>
            <p className="mt-1 text-sm text-stone-600">Odpovězte krátce a prakticky. Přijetí ještě není platba ani finální booking.</p>
          </div>
          <Badge tone={incoming.length ? "amber" : "muted"}>{incoming.length} čeká</Badge>
        </div>
        {!sitterProfile ? (
          <div className="mt-4">
            <InfoBox title="Profil není dokončený">Vyplňte sitter profil, aby vás admin mohl schválit a majitelé vás našli v adresáři.</InfoBox>
          </div>
        ) : null}
        <div className="mt-4 grid gap-4">
          {incoming.map((item) => (
            <div key={item.id} className="rounded-lg border border-forest-100 p-4">
              {sitterProfile && item.request ? (
                <div className="mb-3 rounded-lg bg-linen p-3">
                  {(() => {
                    const fit = evaluateSitterFit(item.request, sitterProfile);
                    return (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={fit.tone}>{fit.label}</Badge>
                          <span className="text-sm font-semibold text-stone-700">{fit.score}% shoda s vaším profilem</span>
                        </div>
                        {fit.matched.length ? <p className="mt-2 text-sm text-stone-700">Sedí: {fit.matched.slice(0, 4).join(", ")}</p> : null}
                        {fit.missing.length ? <p className="mt-1 text-sm text-stone-600">Ověřit před přijetím: {fit.missing.slice(0, 4).join(", ")}</p> : null}
                      </>
                    );
                  })()}
                </div>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold">{item.request?.title}</h3>
                  <p className="text-sm text-stone-600">{item.owner?.full_name} · {item.owner?.city ?? "město neuvedeno"} · {formatDate(item.request?.start_date)} - {formatDate(item.request?.end_date)}</p>
                  <p className="mt-1 text-sm text-stone-600">{labelFor(sittingTypeLabels, item.request?.sitting_type)} · {item.request?.budget_range ?? "rozpočet neuveden"}</p>
                  {item.request?.preferred_time_windows ? <p className="mt-1 text-sm text-stone-600">Čas: {item.request.preferred_time_windows}</p> : null}
                </div>
                <Badge tone="muted">{sitterRequestStatusLabels[item.status] ?? item.status}</Badge>
              </div>
              {item.message ? <p className="mt-3 text-sm text-stone-700">{item.message}</p> : null}
              <div className="mt-3 rounded-lg bg-linen p-3">
                <p className="text-sm font-semibold text-forest-900">Předávací checklist</p>
                <div className="mt-2 grid gap-2">
                  {checklistByRequest.get(item.request_id)?.map((check) => (
                    <div key={check.id} className="rounded-lg bg-white p-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-stone-900">{check.title}</span>
                        <Badge tone={check.is_required ? "green" : "muted"}>{check.is_required ? "nutné" : "volitelné"}</Badge>
                      </div>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-forest-700">{labelFor(checklistCategoryLabels, check.category)}</p>
                      {check.details ? <p className="mt-1 leading-6 text-stone-700">{check.details}</p> : null}
                    </div>
                  )) ?? <p className="text-sm text-stone-600">Majitel zatím checklist nepřidal.</p>}
                </div>
              </div>
              <form className="mt-4 grid gap-3">
                <input type="hidden" name="id" value={item.id} />
                <textarea className={textAreaClass} name="sitter_response" placeholder="Krátká odpověď majiteli, např. potvrzení termínu nebo důvod odmítnutí." />
                <div className="flex gap-2">
                  <button type="submit" formAction={acceptSitterRequestAction} className="min-h-11 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white">Přijmout</button>
                  <button type="submit" formAction={declineSitterRequestAction} className="min-h-11 rounded-lg bg-stone-700 px-4 py-2 text-sm font-semibold text-white">Odmítnout</button>
                </div>
              </form>
            </div>
          ))}
          {!incoming.length ? <EmptyState title="Žádné nové žádosti" text="Nové poptávky od majitelů se zobrazí tady. Schválený profil zvyšuje šanci, že vás majitelé osloví." /> : null}
        </div>
      </Card>
      <Card className="mt-5">
        <h2 className="text-xl font-semibold">Vyřízené žádosti</h2>
        <div className="mt-4 grid gap-3">
          {handled.map((item) => (
            <div key={item.id} className="rounded-lg border border-forest-100 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{item.request?.title}</p>
                <Badge tone={item.status === "accepted" ? "green" : item.status === "declined" ? "red" : "muted"}>{sitterRequestStatusLabels[item.status] ?? item.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-stone-600">{formatDate(item.request?.start_date)} - {formatDate(item.request?.end_date)}</p>
              {sitterProfile && item.request ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(() => {
                    const fit = evaluateSitterFit(item.request, sitterProfile);
                    return (
                      <>
                        <Badge tone={fit.tone}>{fit.label}</Badge>
                        <span className="text-sm text-stone-600">{fit.score}% shoda</span>
                      </>
                    );
                  })()}
                </div>
              ) : null}
              {checklistByRequest.get(item.request_id)?.length ? <p className="mt-1 text-sm text-stone-600">Checklist: {checklistByRequest.get(item.request_id)?.length} položek</p> : null}
              {item.sitter_response ? <p className="mt-2 rounded-lg bg-linen p-3 text-sm text-stone-700">{item.sitter_response}</p> : null}
              {item.status === "accepted" && checklistByRequest.get(item.request_id)?.length ? (
                <div className="mt-3 rounded-lg bg-linen p-3">
                  <p className="text-sm font-semibold text-forest-900">Předávací checklist</p>
                  <div className="mt-2 grid gap-2">
                    {checklistByRequest.get(item.request_id)?.map((check) => (
                      <div key={check.id} className="rounded-lg bg-white p-3 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-stone-900">{check.title}</span>
                          <Badge tone={check.is_required ? "green" : "muted"}>{check.is_required ? "nutné" : "volitelné"}</Badge>
                        </div>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-forest-700">{labelFor(checklistCategoryLabels, check.category)}</p>
                        {check.details ? <p className="mt-1 leading-6 text-stone-700">{check.details}</p> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          {!handled.length ? <p className="text-sm text-stone-600">Zatím nemáte přijaté ani odmítnuté žádosti.</p> : null}
        </div>
      </Card>
    </Shell>
  );
}
