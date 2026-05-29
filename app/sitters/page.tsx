import { Search } from "lucide-react";
import Link from "next/link";
import { toggleFavoriteSitterAction } from "@/app/actions";
import { Badge, ButtonLink, Card, EmptyState, Field, Header, Shell, inputClass } from "@/components/ui";
import { getCurrentProfile } from "@/lib/auth";
import { availabilityLabels, formatDate, trustSignalLabels } from "@/lib/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SittersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const filters = await searchParams;
  const { profile } = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  let query = supabase
    .from("public_sitters")
    .select("*");

  if (filters.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters.neighborhood) query = query.ilike("neighborhood", `%${filters.neighborhood}%`);
  if (filters.overnight === "on") query = query.eq("overnight_stays", true);
  if (filters.dogs === "on") query = query.eq("accepts_dogs", true);
  if (filters.cats === "on") query = query.eq("accepts_cats", true);
  if (filters.medication === "on") query = query.eq("medication_experience", true);
  if (filters.reactive === "on") query = query.eq("reactive_dog_experience", true);
  if (filters.weekends === "on") query = query.eq("available_weekends", true);
  if (filters.evenings === "on") query = query.eq("available_weekday_evenings", true);
  if (filters.mornings === "on") query = query.eq("available_mornings", true);
  if (filters.short_notice === "on") query = query.eq("available_short_notice", true);
  if (filters.available_now === "on") query = query.or(`unavailable_until.is.null,unavailable_until.lt.${today}`);
  if (filters.q) query = query.ilike("availability_notes", `%${filters.q}%`);

  const { data: sitters } = await query.order("is_featured", { ascending: false });
  const { data: favorites } = profile?.role === "owner"
    ? await supabase.from("owner_favorite_sitters").select("sitter_id").eq("owner_id", profile.id)
    : { data: [] };
  const favoriteSitterIds = new Set(favorites?.map((favorite) => favorite.sitter_id) ?? []);
  const queryString = new URLSearchParams(Object.entries(filters).flatMap(([key, value]) => value ? [[key, value]] : [])).toString();
  const currentPath = `/sitters${queryString ? `?${queryString}` : ""}`;

  return (
    <Shell>
      <Header role={profile?.role} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Ověření sitteři</h1>
        <p className="mt-2 text-stone-600">Vyberte člověka podle lokality, typu péče a zkušeností. Veřejně se zobrazují pouze schválené profily.</p>
      </div>
      <form className="mb-5 grid gap-3 rounded-lg bg-white p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Město" name="city"><input className={inputClass} id="city" name="city" placeholder="Praha, Brno, Olomouc" defaultValue={filters.city ?? ""} /></Field>
        <Field label="Čtvrť" name="neighborhood"><input className={inputClass} id="neighborhood" name="neighborhood" placeholder="Letná, Vinohrady" defaultValue={filters.neighborhood ?? ""} /></Field>
        <Field label="Dostupnost / poznámka" name="q"><input className={inputClass} id="q" name="q" placeholder="víkendy, večery, léto" defaultValue={filters.q ?? ""} /></Field>
        <div className="grid gap-2 sm:col-span-2">
          <span className="text-sm font-medium">Filtry</span>
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              ["overnight", "Přespání"],
              ["dogs", "Psi"],
              ["cats", "Kočky"],
              ["medication", "Léky"],
              ["reactive", "Citliví psi"],
              ["weekends", "Víkendy"],
              ["evenings", "Večery"],
              ["mornings", "Rána"],
              ["short_notice", "Rychle"],
              ["available_now", "Teď dostupní"]
            ].map(([name, label]) => <label key={name} className="rounded-full bg-linen px-3 py-2"><input className="mr-2" type="checkbox" name={name} defaultChecked={filters[name] === "on"} />{label}</label>)}
            <button className="inline-flex items-center rounded-full bg-forest-700 px-4 py-2 font-semibold text-white"><Search className="mr-2 h-4 w-4" />Filtrovat</button>
            <Link href="/sitters" className="inline-flex items-center rounded-full border border-forest-200 bg-white px-4 py-2 font-semibold text-forest-800">Vymazat</Link>
          </div>
        </div>
      </form>
      <p className="mb-3 text-sm text-stone-600">Nalezeno: {sitters?.length ?? 0}</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sitters?.map((sitter) => (
          <Card key={sitter.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-forest-100 font-bold text-forest-800">{sitter.full_name?.slice(0, 1) ?? "S"}</div>
                <div>
                  <h2 className="text-lg font-semibold">{sitter.full_name}</h2>
                  <p className="text-sm text-stone-600">{sitter.city} · {sitter.neighborhood}</p>
                </div>
              </div>
              {profile?.role === "owner" ? (
                <form action={toggleFavoriteSitterAction}>
                  <input type="hidden" name="sitter_id" value={sitter.user_id} />
                  <input type="hidden" name="redirect_to" value={currentPath} />
                  <input type="hidden" name="intent" value={favoriteSitterIds.has(sitter.user_id) ? "remove" : "add"} />
                  <button className="rounded-full border border-forest-200 bg-white px-3 py-1.5 text-xs font-semibold text-forest-800 hover:bg-forest-50">
                    {favoriteSitterIds.has(sitter.user_id) ? "Uloženo" : "Uložit"}
                  </button>
                </form>
              ) : null}
            </div>
            <p className="mt-4 line-clamp-3 text-sm text-stone-700">{sitter.animal_experience}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>Schválený sitter</Badge>
              {sitter.phone_verified ? <Badge>{trustSignalLabels.phone_verified}</Badge> : null}
              {sitter.reference_checked ? <Badge>{trustSignalLabels.reference_checked}</Badge> : null}
              {sitter.overnight_stays ? <Badge tone="amber">Přespání možné</Badge> : null}
              {sitter.medication_experience ? <Badge>Zkušenost s léky</Badge> : null}
              {sitter.available_weekends ? <Badge tone="muted">{availabilityLabels.available_weekends}</Badge> : null}
              {sitter.available_weekday_evenings ? <Badge tone="muted">{availabilityLabels.available_weekday_evenings}</Badge> : null}
              {sitter.available_short_notice ? <Badge tone="amber">{availabilityLabels.available_short_notice}</Badge> : null}
            </div>
            {sitter.admin_public_note ? <p className="mt-3 rounded-lg bg-forest-50 p-3 text-sm leading-6 text-forest-900">{sitter.admin_public_note}</p> : null}
            {sitter.unavailable_until && sitter.unavailable_until >= today ? <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm font-medium text-red-800">Nedostupný do {formatDate(sitter.unavailable_until)}</p> : null}
            <p className="mt-4 text-sm font-semibold">{sitter.rate_range ?? "Cena dle domluvy"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <ButtonLink href={`/sitters/${sitter.user_id}`} variant="secondary">Zobrazit profil</ButtonLink>
              {favoriteSitterIds.has(sitter.user_id) ? <Badge tone="amber">Oblíbený</Badge> : null}
            </div>
          </Card>
        ))}
      </div>
      {!sitters?.length ? (
        <div className="mt-4">
          <EmptyState title="Žádný sitter neodpovídá filtrům" text="Zkuste rozšířit lokalitu nebo odebrat některý požadavek. V MVP zatím pracujeme bez mapy a složitého kalendáře." action={<ButtonLink href="/sitters" variant="secondary">Zobrazit všechny</ButtonLink>} />
        </div>
      ) : null}
    </Shell>
  );
}
