import { Badge, ButtonLink, Card, Header, Shell } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const { profile } = await requireProfile(["admin"]);
  const supabase = await createSupabaseServerClient();
  const [{ count: owners }, { count: sitters }, { count: pending }, { count: openRequests }, { data: latestRequests }, { data: latestSitters }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "owner"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).in("role", ["sitter", "professional"]),
    supabase.from("sitter_profiles").select("id", { count: "exact", head: true }).eq("approval_status", "pending_approval"),
    supabase.from("house_sitting_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("house_sitting_requests").select("*, owner:profiles(full_name, city)").order("created_at", { ascending: false }).limit(5),
    supabase.from("sitter_profiles").select("*, profile:profiles!sitter_profiles_user_id_fkey(full_name, city, neighborhood)").order("created_at", { ascending: false }).limit(5)
  ]);

  return (
    <Shell>
      <Header role={profile.role} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin přehled</h1>
          <p className="mt-2 text-stone-600">Schvalování sitterů a základní dohled nad MVP.</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/admin/sitters" variant="secondary">Sitteři</ButtonLink>
          <ButtonLink href="/admin/requests" variant="secondary">Poptávky</ButtonLink>
          <ButtonLink href="/admin/users" variant="secondary">Uživatelé</ButtonLink>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Majitelé", owners], ["Sitteři", sitters], ["Čeká na schválení", pending], ["Otevřené poptávky", openRequests]].map(([label, value]) => (
          <Card key={label as string}><p className="text-sm text-stone-600">{label}</p><p className="mt-2 text-3xl font-bold">{value ?? 0}</p></Card>
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Nejnovější poptávky</h2>
          <div className="mt-4 grid gap-3">
            {latestRequests?.map((request) => (
              <div key={request.id} className="rounded-lg border border-forest-100 p-3">
                <div className="flex justify-between gap-3"><p className="font-semibold">{request.title}</p><Badge>{request.status}</Badge></div>
                <p className="text-sm text-stone-600">{request.owner?.full_name} · {request.owner?.city}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Nejnovější sitter profily</h2>
          <div className="mt-4 grid gap-3">
            {latestSitters?.map((sitter) => (
              <div key={sitter.id} className="rounded-lg border border-forest-100 p-3">
                <div className="flex justify-between gap-3"><p className="font-semibold">{sitter.profile?.full_name}</p><Badge tone={sitter.approval_status === "approved" ? "green" : sitter.approval_status === "rejected" ? "red" : "amber"}>{sitter.approval_status}</Badge></div>
                <p className="text-sm text-stone-600">{sitter.profile?.city} · {sitter.profile?.neighborhood}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
