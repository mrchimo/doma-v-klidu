import { approveSitterAction, updateSitterTrustAction } from "@/app/actions";
import { Badge, Card, Field, Header, Shell, textAreaClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { trustSignalLabels } from "@/lib/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminSittersPage() {
  const { profile } = await requireProfile(["admin"]);
  const supabase = await createSupabaseServerClient();
  const { data: sitters } = await supabase
    .from("sitter_profiles")
    .select("*, profile:profiles!sitter_profiles_user_id_fkey(full_name, email:id, city, neighborhood, phone)")
    .order("created_at", { ascending: false });

  return (
    <Shell>
      <Header role={profile.role} />
      <h1 className="text-3xl font-bold">Správa sitterů</h1>
      <div className="mt-6 grid gap-4">
        {sitters?.map((sitter) => (
          <Card key={sitter.id}>
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{sitter.profile?.full_name}</h2>
                  <Badge tone={sitter.approval_status === "approved" ? "green" : sitter.approval_status === "rejected" ? "red" : "amber"}>{sitter.approval_status}</Badge>
                </div>
                <p className="mt-1 text-sm text-stone-600">{sitter.profile?.city} · {sitter.profile?.neighborhood} · {sitter.profile?.phone}</p>
                <p className="mt-3 max-w-3xl text-sm text-stone-700">{sitter.bio}</p>
                <p className="mt-2 max-w-3xl text-sm text-stone-700">{sitter.animal_experience}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sitter.phone_verified ? <Badge>{trustSignalLabels.phone_verified}</Badge> : null}
                  {sitter.reference_checked ? <Badge>{trustSignalLabels.reference_checked}</Badge> : null}
                  {sitter.video_intro_reviewed ? <Badge>{trustSignalLabels.video_intro_reviewed}</Badge> : null}
                  {sitter.is_featured ? <Badge tone="amber">Doporučený profil</Badge> : null}
                </div>
                {sitter.admin_public_note ? (
                  <p className="mt-3 rounded-lg bg-forest-50 p-3 text-sm text-forest-900">{sitter.admin_public_note}</p>
                ) : null}
                {sitter.admin_private_note ? (
                  <p className="mt-3 rounded-lg bg-stone-100 p-3 text-sm text-stone-700">Interně: {sitter.admin_private_note}</p>
                ) : null}
              </div>
              <div className="grid gap-3">
                <form action={approveSitterAction} className="flex flex-wrap gap-2 lg:justify-end">
                  <input type="hidden" name="user_id" value={sitter.user_id} />
                  <button name="approval_status" value="approved" className="min-h-11 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white">Schválit</button>
                  <button name="approval_status" value="rejected" className="min-h-11 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Odmítnout</button>
                  <button name="approval_status" value="pending_approval" className="min-h-11 rounded-lg bg-stone-700 px-4 py-2 text-sm font-semibold text-white">Vrátit ke kontrole</button>
                </form>
                <form action={updateSitterTrustAction} className="grid gap-3 rounded-lg border border-forest-100 bg-linen/60 p-3">
                  <input type="hidden" name="user_id" value={sitter.user_id} />
                  <p className="text-sm font-semibold text-forest-900">Důvěryhodnost profilu</p>
                  <div className="grid gap-2 text-sm text-stone-700">
                    <label className="flex items-center gap-2"><input type="checkbox" name="phone_verified" defaultChecked={sitter.phone_verified} />Ověřený telefon</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="reference_checked" defaultChecked={sitter.reference_checked} />Reference zkontrolována</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="video_intro_reviewed" defaultChecked={sitter.video_intro_reviewed} />Video medailonek zkontrolován</label>
                    <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={sitter.is_featured} />Doporučit v adresáři</label>
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
                  <Field label="Interní poznámka" name={`admin_private_note_${sitter.id}`}>
                    <textarea
                      className={textAreaClass}
                      id={`admin_private_note_${sitter.id}`}
                      name="admin_private_note"
                      defaultValue={sitter.admin_private_note ?? ""}
                      placeholder="Poznámka jen pro admina."
                    />
                  </Field>
                  <button className="min-h-11 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white">Uložit důvěru</button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
