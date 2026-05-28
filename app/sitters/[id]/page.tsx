import { redirect } from "next/navigation";
import Link from "next/link";
import { sendSitterRequestAction } from "@/app/actions";
import { Badge, Card, Field, Header, InfoBox, Shell, SubmitButton, inputClass, textAreaClass } from "@/components/ui";
import { getCurrentProfile } from "@/lib/auth";
import { availabilityLabels, formatDate, trustSignalLabels } from "@/lib/labels";
import { evaluateSitterFit } from "@/lib/sitter-fit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SitterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await getCurrentProfile();
  const supabase = await createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: sitter } = await supabase
    .from("public_sitters")
    .select("*")
    .eq("user_id", id)
    .single();

  const { data: ownerRequests } = profile?.role === "owner"
    ? await supabase.from("house_sitting_requests").select("*").eq("owner_id", profile.id).eq("status", "open")
    : { data: [] };

  async function requireOwnerAction() {
    "use server";
    redirect("/sign-in");
  }

  return (
    <Shell>
      <Header role={profile?.role} />
      {sitter ? (
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="flex gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-forest-100 text-2xl font-bold text-forest-800">{sitter.full_name?.slice(0, 1) ?? "S"}</div>
              <div>
                <h1 className="text-3xl font-bold">{sitter.full_name}</h1>
                <p className="mt-1 text-stone-600">{sitter.city} · {sitter.neighborhood}</p>
              </div>
            </div>
            <p className="mt-6 leading-7 text-stone-700">{sitter.bio}</p>
            <h2 className="mt-6 text-xl font-semibold">Zkušenosti</h2>
            <p className="mt-2 leading-7 text-stone-700">{sitter.animal_experience}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge>ověřený e-mail</Badge>
              <Badge>Schválený sitter</Badge>
              {sitter.phone_verified ? <Badge>{trustSignalLabels.phone_verified}</Badge> : null}
              {sitter.reference_checked ? <Badge>{trustSignalLabels.reference_checked}</Badge> : null}
              {sitter.video_intro_reviewed ? <Badge>{trustSignalLabels.video_intro_reviewed}</Badge> : null}
              {sitter.overnight_stays ? <Badge tone="amber">Přespání možné</Badge> : null}
              {sitter.medication_experience ? <Badge>Zkušenost s léky</Badge> : null}
              {sitter.reactive_dog_experience ? <Badge>Zkušenost s citlivými psy</Badge> : null}
            </div>
            <div className="mt-6 rounded-lg border border-forest-100 bg-forest-50 p-4">
              <h2 className="font-semibold">Důvěryhodnost</h2>
              <div className="mt-3 grid gap-2 text-sm text-stone-700">
                <p>{sitter.phone_verified ? "Telefon byl ověřen administrátorem." : "Telefon zatím není veřejně označený jako ověřený."}</p>
                <p>{sitter.reference_checked ? "Reference byla zkontrolována před zveřejněním profilu." : "Reference zatím čeká na kontrolu."}</p>
                <p>{sitter.video_intro_reviewed ? "Video medailonek byl zkontrolován administrátorem." : "Video medailonek zatím není ověřený."}</p>
              </div>
              {sitter.admin_public_note ? <p className="mt-3 rounded-lg bg-white p-3 text-sm leading-6 text-forest-900">{sitter.admin_public_note}</p> : null}
              {sitter.video_intro_url && sitter.video_intro_reviewed ? (
                <Link href={sitter.video_intro_url} className="mt-3 inline-flex text-sm font-semibold text-forest-800 underline">
                  Otevřít video medailonek
                </Link>
              ) : null}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-forest-100 bg-linen/60 p-4"><h3 className="font-semibold">Typy hlídání</h3><p className="mt-2 text-sm text-stone-600">{[sitter.overnight_stays && "přespání", sitter.daily_visits && "návštěvy", sitter.dog_walking && "venčení", sitter.emergency_help && "urgentní pomoc"].filter(Boolean).join(" · ")}</p></div>
              <div className="rounded-lg border border-forest-100 bg-linen/60 p-4"><h3 className="font-semibold">Sazba</h3><p className="mt-2 text-sm text-stone-600">{sitter.rate_range ?? "dle domluvy"}</p></div>
            </div>
            {sitter.availability_notes ? (
              <div className="mt-6 rounded-lg border border-forest-100 bg-white p-4">
                <h2 className="font-semibold">Dostupnost</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sitter.available_weekends ? <Badge tone="muted">{availabilityLabels.available_weekends}</Badge> : null}
                  {sitter.available_weekday_evenings ? <Badge tone="muted">{availabilityLabels.available_weekday_evenings}</Badge> : null}
                  {sitter.available_mornings ? <Badge tone="muted">{availabilityLabels.available_mornings}</Badge> : null}
                  {sitter.available_short_notice ? <Badge tone="amber">{availabilityLabels.available_short_notice}</Badge> : null}
                </div>
                {sitter.unavailable_until && sitter.unavailable_until >= today ? <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm font-medium text-red-800">Aktuálně nedostupný do {formatDate(sitter.unavailable_until)}</p> : null}
                <p className="mt-2 text-sm leading-6 text-stone-700">{sitter.availability_notes}</p>
              </div>
            ) : sitter.available_weekends || sitter.available_weekday_evenings || sitter.available_mornings || sitter.available_short_notice || sitter.unavailable_until ? (
              <div className="mt-6 rounded-lg border border-forest-100 bg-white p-4">
                <h2 className="font-semibold">Dostupnost</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sitter.available_weekends ? <Badge tone="muted">{availabilityLabels.available_weekends}</Badge> : null}
                  {sitter.available_weekday_evenings ? <Badge tone="muted">{availabilityLabels.available_weekday_evenings}</Badge> : null}
                  {sitter.available_mornings ? <Badge tone="muted">{availabilityLabels.available_mornings}</Badge> : null}
                  {sitter.available_short_notice ? <Badge tone="amber">{availabilityLabels.available_short_notice}</Badge> : null}
                </div>
                {sitter.unavailable_until && sitter.unavailable_until >= today ? <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm font-medium text-red-800">Aktuálně nedostupný do {formatDate(sitter.unavailable_until)}</p> : null}
              </div>
            ) : null}
            <h2 className="mt-6 text-xl font-semibold">Reference</h2>
            <p className="mt-2 text-sm text-stone-600">
              {sitter.reference_checked
                ? "Reference byla zkontrolována administrátorem. Veřejné recenze budou až po dokončených hlídáních."
                : "Veřejné recenze budou až po dokončených hlídáních. V MVP zde zatím zobrazujeme jen stav administrátorské kontroly."}
            </p>
          </Card>
          <Card>
            <h2 className="text-xl font-semibold">Poslat žádost</h2>
            <InfoBox title="Co napsat do zprávy">
              Stačí krátce potvrdit termín, nejdůležitější potřebu mazlíčka a způsob předání instrukcí. Detailní přístup do bytu neposílejte před domluvou.
            </InfoBox>
            {profile?.role === "owner" && ownerRequests?.length ? (
              <div className="mt-4 grid gap-3">
                <p className="text-sm font-semibold text-forest-900">Vhodnost pro vaše otevřené poptávky</p>
                {ownerRequests.map((request) => {
                  const fit = evaluateSitterFit(request, sitter);
                  return (
                    <div key={request.id} className="rounded-lg border border-forest-100 bg-linen/60 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={fit.tone}>{fit.label}</Badge>
                        <span className="text-sm font-semibold text-stone-700">{fit.score}%</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-stone-900">{request.title}</p>
                      {fit.matched.length ? <p className="mt-1 text-sm text-stone-700">Sedí: {fit.matched.slice(0, 3).join(", ")}</p> : null}
                      {fit.missing.length ? <p className="mt-1 text-sm text-stone-600">Ověřit: {fit.missing.slice(0, 3).join(", ")}</p> : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
            {profile?.role === "owner" && ownerRequests?.length ? (
              <form action={sendSitterRequestAction} className="mt-4 grid gap-4">
                <input type="hidden" name="sitter_id" value={sitter.user_id} />
                <Field label="Vyberte otevřenou poptávku" name="request_id">
                  <select className={inputClass} id="request_id" name="request_id" required>
                    {ownerRequests?.map((request) => <option key={request.id} value={request.id}>{request.title} · {formatDate(request.start_date)} - {formatDate(request.end_date)}</option>)}
                  </select>
                </Field>
                <Field label="Zpráva sitterovi" name="message"><textarea className={textAreaClass} id="message" name="message" placeholder="Krátce popište situaci a co je důležité." /></Field>
                <SubmitButton>Odeslat žádost</SubmitButton>
              </form>
            ) : profile?.role === "owner" ? (
              <div className="mt-4 rounded-lg bg-linen p-4">
                <p className="text-sm text-stone-700">Nejprve vytvořte otevřenou poptávku hlídání. Potom ji můžete poslat vybranému sitterovi.</p>
                <div className="mt-3">
                  <Link href="/owner/requests/new" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800">Vytvořit poptávku</Link>
                </div>
              </div>
            ) : (
              <form action={requireOwnerAction} className="mt-4">
                <SubmitButton>Přihlásit se jako majitel</SubmitButton>
              </form>
            )}
          </Card>
        </div>
      ) : (
        <Card><h1 className="text-xl font-semibold">Sitter není veřejně dostupný</h1></Card>
      )}
    </Shell>
  );
}
