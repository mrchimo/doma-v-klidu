import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { addHandoverChecklistItemAction, cancelSitterRequestAction, cancelSittingAgreementAction, confirmSittingAgreementAction, deleteHandoverChecklistItemAction } from "@/app/actions";
import { Badge, ButtonLink, Card, EmptyState, Field, Header, InfoBox, Shell, SubmitButton, inputClass, textAreaClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { checklistCategoryLabels, formatDate, labelFor, requestStatusLabels, requirementLabels, sitterRequestStatusLabels, sittingAgreementStatusLabels, sittingTypeLabels, taskLabels } from "@/lib/labels";
import { buildRequestTimeline } from "@/lib/request-timeline";
import { evaluateSitterFit } from "@/lib/sitter-fit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  const [{ data: request }, { data: sent }, { data: requestPets }, { data: checklist }, { data: agreement }] = await Promise.all([
    supabase.from("house_sitting_requests").select("*, household:households(name, city, neighborhood)").eq("id", id).eq("owner_id", profile.id).single(),
    supabase.from("sitter_requests").select("*, sitter:profiles!sitter_requests_sitter_id_fkey(full_name, city, neighborhood)").eq("request_id", id).eq("owner_id", profile.id),
    supabase.from("request_pets").select("pet:pets(name, species, breed)").eq("request_id", id),
    supabase.from("handover_checklist_items").select("*").eq("request_id", id).eq("owner_id", profile.id).order("sort_order", { ascending: true }),
    supabase
      .from("sitting_agreements")
      .select("*, sitter:profiles!sitting_agreements_sitter_id_fkey(full_name, city, neighborhood)")
      .eq("request_id", id)
      .eq("owner_id", profile.id)
      .eq("status", "confirmed")
      .maybeSingle()
  ]);
  const sitterIds = sent?.map((item) => item.sitter_id).filter(Boolean) ?? [];
  const { data: publicSitters } = sitterIds.length
    ? await supabase.from("public_sitters").select("*").in("user_id", sitterIds)
    : { data: [] };
  const publicSitterByUserId = new Map(publicSitters?.map((sitter) => [sitter.user_id, sitter]) ?? []);
  const timeline = request ? buildRequestTimeline({ request, sitterRequests: sent ?? [], checklist: checklist ?? [], agreement }) : [];

  return (
    <Shell>
      <Header role={profile.role} />
      {request ? (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-5">
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-3xl font-bold">{request.title}</h1>
                  <p className="mt-2 text-stone-600">{request.household?.name} · {request.household?.city}</p>
                </div>
                <Badge tone={request.urgency === "urgent" ? "amber" : "green"}>{requestStatusLabels[request.status] ?? request.status}</Badge>
              </div>
              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="font-semibold">Termín</dt><dd>{formatDate(request.start_date)} - {formatDate(request.end_date)}</dd></div>
                <div><dt className="font-semibold">Typ</dt><dd>{labelFor(sittingTypeLabels, request.sitting_type)}</dd></div>
                <div><dt className="font-semibold">Rozpočet</dt><dd>{request.budget_range ?? "neuvedeno"}</dd></div>
                <div><dt className="font-semibold">Čas</dt><dd>{request.preferred_time_windows ?? "dle domluvy"}</dd></div>
              </dl>
              {requestPets?.length ? (
                <div className="mt-6">
                  <h2 className="font-semibold">Mazlíčci v poptávce</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {requestPets.map((item) => {
                      const pet = Array.isArray(item.pet) ? item.pet[0] : item.pet;
                      return <Badge key={`${request.id}-${pet?.name}`} tone="muted">{pet?.name} · {pet?.species}</Badge>;
                    })}
                  </div>
                </div>
              ) : null}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <h2 className="font-semibold">Checklist úkolů</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {request.tasks?.length ? request.tasks.map((task: string) => <Badge key={task}>{labelFor(taskLabels, task)}</Badge>) : <span className="text-sm text-stone-500">Bez vybraných úkolů</span>}
                  </div>
                </div>
                <div>
                  <h2 className="font-semibold">Požadavky na sittera</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {request.sitter_requirements?.length ? request.sitter_requirements.map((requirement: string) => <Badge key={requirement} tone="amber">{labelFor(requirementLabels, requirement)}</Badge>) : <span className="text-sm text-stone-500">Bez speciálních požadavků</span>}
                  </div>
                </div>
              </div>
              {request.notes ? <p className="mt-5 rounded-lg bg-linen p-4 text-stone-700">{request.notes}</p> : null}
              {agreement ? (
                <InfoBox title="Poptávka je domluvená">
                  Máte potvrzeného sittera. Checklist můžete dál zpřesnit, aby bylo předání co nejklidnější.
                </InfoBox>
              ) : (
                <>
                  <InfoBox title="Další krok">
                    Pošlete poptávku jednomu nebo více schváleným sitterům. Jakmile sitter přijme žádost, potvrďte konkrétní domluvu.
                  </InfoBox>
                  <div className="mt-6"><ButtonLink href="/sitters">Vybrat sittera</ButtonLink></div>
                </>
              )}
            </Card>

            <Card>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Stavová osa poptávky</h2>
                  <p className="mt-1 text-sm text-stone-600">Rychlý přehled, kde se poptávka nachází a co je další praktický krok.</p>
                </div>
                <Badge tone={timeline.every((step) => step.state === "done") ? "green" : "amber"}>
                  {timeline.find((step) => step.state === "current")?.title ?? "Dokončeno"}
                </Badge>
              </div>
              <ol className="mt-5 grid gap-4">
                {timeline.map((step, index) => {
                  const Icon = step.state === "done" ? CheckCircle2 : step.state === "current" ? Clock3 : Circle;
                  const iconClass = step.state === "done"
                    ? "bg-forest-700 text-white"
                    : step.state === "current"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-stone-100 text-stone-500";

                  return (
                    <li key={step.key} className="grid grid-cols-[2rem_1fr] gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${iconClass}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        {index < timeline.length - 1 ? <span className="mt-2 h-full min-h-5 w-px bg-forest-100" /> : null}
                      </div>
                      <div className="pb-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{step.title}</h3>
                          {step.state === "current" ? <Badge tone="amber">aktuální krok</Badge> : null}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-stone-700">{step.description}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
                          {step.date ? formatDate(step.date) : step.state === "pending" ? "čeká" : "bez data"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </Card>

            <Card id="handover-checklist">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Předávací checklist</h2>
                  <p className="mt-1 text-sm text-stone-600">Praktické instrukce, které sitter uvidí u žádosti. Přístupové údaje pište obecně a citlivé detaily předejte až po domluvě.</p>
                </div>
                <Badge tone={checklist?.length ? "green" : "muted"}>{checklist?.length ?? 0} položek</Badge>
              </div>
              <div className="mt-4 grid gap-3">
                {checklist?.map((item) => (
                  <div key={item.id} className="rounded-lg border border-forest-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-forest-700">{labelFor(checklistCategoryLabels, item.category)} · {item.is_required ? "nutné" : "volitelné"}</p>
                      </div>
                      <form action={deleteHandoverChecklistItemAction}>
                        <input type="hidden" name="request_id" value={request.id} />
                        <input type="hidden" name="id" value={item.id} />
                        <button className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">Smazat</button>
                      </form>
                    </div>
                    {item.details ? <p className="mt-2 text-sm leading-6 text-stone-700">{item.details}</p> : null}
                  </div>
                ))}
                {!checklist?.length ? <EmptyState title="Checklist zatím není připravený" text="Přidejte alespoň základní body: klíče, krmení, léky, bezpečnostní kontrola a nouzový kontakt." /> : null}
              </div>
              <form action={addHandoverChecklistItemAction} className="mt-5 grid gap-3 rounded-lg bg-linen p-4">
                <input type="hidden" name="request_id" value={request.id} />
                <h3 className="font-semibold">Přidat položku</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Název položky" name="title"><input className={inputClass} id="title" name="title" required placeholder="Např. zkontrolovat okna" /></Field>
                  <Field label="Kategorie" name="category">
                    <select className={inputClass} id="category" name="category" defaultValue="other">
                      {Object.entries(checklistCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Detail" name="details"><textarea className={textAreaClass} id="details" name="details" placeholder="Krátká praktická instrukce pro sittera." /></Field>
                <label className="flex items-center gap-2 text-sm font-medium text-forest-800"><input type="checkbox" name="is_required" defaultChecked /> Nutná položka</label>
                <SubmitButton className="w-full sm:w-auto">Přidat do checklistu</SubmitButton>
              </form>
            </Card>
          </div>
          <div className="grid gap-5">
            {agreement ? (
              <Card id="agreement">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Domluvené hlídání</h2>
                    <p className="mt-1 text-sm text-stone-600">Jasné potvrzení, kdo se postará o domácnost v tomto termínu.</p>
                  </div>
                  <Badge>{sittingAgreementStatusLabels[agreement.status] ?? agreement.status}</Badge>
                </div>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div><dt className="font-semibold">Sitter</dt><dd>{agreement.sitter?.full_name} · {agreement.sitter?.city ?? "město neuvedeno"}</dd></div>
                  <div><dt className="font-semibold">Termín</dt><dd>{formatDate(request.start_date)} - {formatDate(request.end_date)}</dd></div>
                  <div><dt className="font-semibold">Domácnost</dt><dd>{request.household?.name} · {request.household?.city}</dd></div>
                  <div><dt className="font-semibold">Potvrzeno</dt><dd>{formatDate(agreement.confirmed_at)}</dd></div>
                </dl>
                {agreement.owner_note ? <p className="mt-4 rounded-lg bg-linen p-3 text-sm leading-6 text-stone-700">{agreement.owner_note}</p> : null}
                <form action={cancelSittingAgreementAction} className="mt-4">
                  <input type="hidden" name="request_id" value={request.id} />
                  <input type="hidden" name="id" value={agreement.id} />
                  <button className="min-h-11 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-50">Zrušit domluvu</button>
                </form>
              </Card>
            ) : null}

            <Card>
              <h2 className="text-xl font-semibold">Žádosti sitterům</h2>
              <div className="mt-4 grid gap-3">
                {sent?.map((item) => {
                  const publicSitter = publicSitterByUserId.get(item.sitter_id);
                  const fit = publicSitter ? evaluateSitterFit(request, publicSitter) : null;

                  return (
                    <div key={item.id} className="rounded-lg border border-forest-100 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">{item.sitter?.full_name}</p>
                        <Badge tone={item.status === "accepted" ? "green" : item.status === "declined" ? "red" : "muted"}>{agreement?.sitter_request_id === item.id ? "Domluveno" : sitterRequestStatusLabels[item.status] ?? item.status}</Badge>
                      </div>
                      {fit ? (
                        <div className="mt-3 rounded-lg bg-linen p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={fit.tone}>{fit.label}</Badge>
                            <span className="text-sm font-semibold text-stone-700">{fit.score}% shoda s poptávkou</span>
                          </div>
                          {fit.matched.length ? <p className="mt-2 text-sm text-stone-700">Sedí: {fit.matched.slice(0, 4).join(", ")}</p> : null}
                          {fit.missing.length ? <p className="mt-1 text-sm text-stone-600">Ověřit: {fit.missing.slice(0, 4).join(", ")}</p> : null}
                        </div>
                      ) : null}
                      {item.sitter_response ? <p className="mt-2 text-sm text-stone-600">{item.sitter_response}</p> : null}
                      {item.status === "accepted" && !agreement ? (
                        <form action={confirmSittingAgreementAction} className="mt-3 grid gap-3 rounded-lg bg-linen p-3">
                          <input type="hidden" name="request_id" value={request.id} />
                          <input type="hidden" name="sitter_request_id" value={item.id} />
                          <p className="text-sm font-semibold text-forest-900">Sitter přijal žádost. Potvrďte, že tato domluva platí.</p>
                          <textarea className={textAreaClass} name="owner_note" placeholder="Volitelná poznámka k domluvě, např. předání klíčů nebo čas příjezdu." />
                          <SubmitButton>Potvrdit domluvu</SubmitButton>
                        </form>
                      ) : null}
                      {item.status === "accepted" && agreement && agreement.sitter_request_id !== item.id ? <p className="mt-2 text-sm text-stone-500">Poptávka už je domluvená s jiným sitterem.</p> : null}
                      {item.status === "sent" ? (
                        <form action={cancelSitterRequestAction} className="mt-3">
                          <input type="hidden" name="id" value={item.id} />
                          <SubmitButton className="bg-stone-700 hover:bg-stone-800">Zrušit žádost</SubmitButton>
                        </form>
                      ) : null}
                    </div>
                  );
                })}
                {!sent?.length ? <EmptyState title="Zatím bez oslovených sitterů" text="Vyberte schváleného sittera z adresáře a pošlete mu tuto poptávku." action={<ButtonLink href="/sitters">Najít sittera</ButtonLink>} /> : null}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <Card><h1 className="text-xl font-semibold">Poptávka nenalezena</h1></Card>
      )}
    </Shell>
  );
}
