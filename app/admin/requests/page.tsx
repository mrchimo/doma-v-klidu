import { Badge, Card, Field, Header, Shell, inputClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  return (
    <Shell>
      <Header role={profile.role} />
      <h1 className="text-3xl font-bold">Poptávky hlídání</h1>
      <form className="mt-5 grid gap-3 rounded-lg bg-white p-4 shadow-soft sm:grid-cols-4">
        <Field label="Status" name="status"><select className={inputClass} id="status" name="status" defaultValue={filters.status ?? ""}><option value="">Vše</option><option value="open">open</option><option value="matched">matched</option><option value="cancelled">cancelled</option><option value="completed">completed</option></select></Field>
        <Field label="Urgence" name="urgency"><select className={inputClass} id="urgency" name="urgency" defaultValue={filters.urgency ?? ""}><option value="">Vše</option><option value="normal">normal</option><option value="urgent">urgent</option></select></Field>
        <Field label="Město" name="city"><input className={inputClass} id="city" name="city" defaultValue={filters.city ?? ""} /></Field>
        <button className="self-end rounded-lg bg-forest-700 px-4 py-2 font-semibold text-white">Filtrovat</button>
      </form>
      <div className="mt-5 grid gap-4">
        {requests?.map((request) => (
          <Card key={request.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{request.title}</h2>
                <p className="mt-1 text-sm text-stone-600">{request.owner?.full_name} · {request.household?.city} · {request.household?.neighborhood}</p>
                <p className="mt-2 text-sm text-stone-700">{request.start_date} - {request.end_date} · {request.sitting_type}</p>
              </div>
              <div className="flex gap-2"><Badge>{request.status}</Badge><Badge tone={request.urgency === "urgent" ? "amber" : "muted"}>{request.urgency}</Badge></div>
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
