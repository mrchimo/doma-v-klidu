import { Badge, Card, Header, Shell } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const { profile } = await requireProfile(["admin"]);
  const supabase = await createSupabaseServerClient();
  const { data: users } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });

  return (
    <Shell>
      <Header role={profile.role} />
      <h1 className="text-3xl font-bold">Uživatelé a role</h1>
      <div className="mt-6 grid gap-3">
        {users?.map((user) => (
          <Card key={user.id}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{user.full_name ?? "Bez jména"}</h2>
                <p className="text-sm text-stone-600">{user.city} · {user.neighborhood} · {user.phone}</p>
              </div>
              <Badge tone={user.role === "admin" ? "amber" : "green"}>{user.role}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
