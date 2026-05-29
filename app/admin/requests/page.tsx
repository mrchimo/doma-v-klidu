import { Badge, Card, Field, Header, Shell, inputClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { formatDate, labelFor, requestStatusLabels, sittingTypeLabels } from "@/lib/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function feedbackAnswer(value: boolean) {
  return value ? "Ano" : "Ne";
}

function feedbackTone(value: boolean): "green" | "amber" {
  return value ? "green" : "amber";
}

export default async function AdminRequestsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const { profile } = await requireProfile(["admin"]);
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("house_sitting_requests")
    .select("*, owner:profiles(full_name, city), household:households!inner(name, city, neighborhood)")
    .order("created_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.urgency) query = query.eq("urgency", filters.urgency);
  if (filters.city) query = query.ilike("household.city", `%${filters.city}%`);
  const { data: requests } = await query;
  const requestIds = requests?.map((request) => request.id) ?? [];
  const { data: feedbackItems } = requestIds.length
    ? await supabase
      .from("sitting_feedback")
      .select("*, sitter:profiles!sitting_feedback_sitter_id_fkey(full_name, city)")
      .in("request_id", requestIds)
    : { data: [] };
  const feedbackByRequestId = new Map(feedbackItems?.map((feedback) => [feedback.request_id, feedback]) ?? []);
  const negativeSignals = feedbackItems?.filter((feedback) => !feedback.went_well || !feedback.sitter_on_time || !feedback.instructions_clear || !feedback.would_book_again).length ?? 0;

  return (
    <Shell>
      <Header role={profile.role} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Poptávky hlídání</h1>
          <p className="mt-2 text-stone-600">Dohled nad stavem poptávek a interní zpětnou vazbou po dokončení.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={feedbackItems?.length ? "green" : "muted"}>{feedbackItems?.length ?? 0} feedbacků</Badge>
          <Badge tone={negativeSignals ? "amber" : "muted"}>{negativeSignals} k prověření</Badge>
        </div>
      </div>
      <form className="mt-5 grid gap-3 rounded-lg bg-white p-4 shadow-soft sm:grid-cols-4">
        <Field label="Status" name="status"><select className={inputClass} id="status" name="status" defaultValue={filters.status ?? ""}><option value="">Vše</option><option value="open">open</option><option value="matched">matched</option><option value="cancelled">cancelled</option><option value="completed">completed</option></select></Field>
        <Field label="Urgence" name="urgency"><select className={inputClass} id="urgency" name="urgency" defaultValue={filters.urgency ?? ""}><option value="">Vše</option><option value="normal">normal</option><option value="urgent">urgent</option></select></Field>
        <Field label="Město" name="city"><input className={inputClass} id="city" name="city" defaultValue={filters.city ?? ""} /></Field>
        <button className="self-end rounded-lg bg-forest-700 px-4 py-2 font-semibold text-white">Filtrovat</button>
      </form>
      <div className="mt-5 grid gap-4">
        {requests?.map((request) => {
          const feedback = feedbackByRequestId.get(request.id);

          return (
            <Card key={request.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{request.title}</h2>
                  <p className="mt-1 text-sm text-stone-600">{request.owner?.full_name} · {request.household?.city} · {request.household?.neighborhood}</p>
                  <p className="mt-2 text-sm text-stone-700">{formatDate(request.start_date)} - {formatDate(request.end_date)} · {labelFor(sittingTypeLabels, request.sitting_type)}</p>
                </div>
                <div className="flex gap-2"><Badge>{requestStatusLabels[request.status] ?? request.status}</Badge><Badge tone={request.urgency === "urgent" ? "amber" : "muted"}>{request.urgency}</Badge></div>
              </div>
              {feedback ? (
                <div className="mt-4 rounded-lg bg-linen p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold">Interní zpětná vazba</h3>
                      <p className="mt-1 text-sm text-stone-600">{feedback.sitter?.full_name ?? "Sitter"} · uloženo {formatDate(feedback.created_at)}</p>
                    </div>
                    <Badge tone={feedback.went_well && feedback.would_book_again ? "green" : "amber"}>
                      {feedback.went_well && feedback.would_book_again ? "bez zásahu" : "prověřit"}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    <div><p className="text-xs text-stone-600">V pořádku</p><Badge tone={feedbackTone(feedback.went_well)}>{feedbackAnswer(feedback.went_well)}</Badge></div>
                    <div><p className="text-xs text-stone-600">Včas</p><Badge tone={feedbackTone(feedback.sitter_on_time)}>{feedbackAnswer(feedback.sitter_on_time)}</Badge></div>
                    <div><p className="text-xs text-stone-600">Instrukce jasné</p><Badge tone={feedbackTone(feedback.instructions_clear)}>{feedbackAnswer(feedback.instructions_clear)}</Badge></div>
                    <div><p className="text-xs text-stone-600">Použít znovu</p><Badge tone={feedbackTone(feedback.would_book_again)}>{feedbackAnswer(feedback.would_book_again)}</Badge></div>
                  </div>
                  {feedback.owner_note ? <p className="mt-3 rounded-lg bg-white p-3 text-sm leading-6 text-stone-700">{feedback.owner_note}</p> : null}
                </div>
              ) : request.status === "completed" ? (
                <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950">Poptávka je dokončená, ale interní zpětná vazba zatím chybí.</p>
              ) : null}
            </Card>
          );
        })}
      </div>
    </Shell>
  );
}
