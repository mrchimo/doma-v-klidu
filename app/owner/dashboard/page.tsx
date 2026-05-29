import { CalendarPlus, Search } from "lucide-react";
import Link from "next/link";
import { Badge, ButtonLink, Card, EmptyState, Header, InfoBox, Shell } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { formatDate, requestStatusLabels, sitterRequestStatusLabels } from "@/lib/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerDashboardPage() {
  const { profile } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  const [{ data: households }, { data: pets }, { data: requests }, { data: sent }, { data: agreements }, { data: favorites }] = await Promise.all([
    supabase.from("households").select("*").eq("owner_id", profile.id),
    supabase.from("pets").select("*").eq("owner_id", profile.id),
    supabase.from("house_sitting_requests").select("*").eq("owner_id", profile.id).order("created_at", { ascending: false }),
    supabase.from("sitter_requests").select("*, sitter:profiles!sitter_requests_sitter_id_fkey(full_name, city, neighborhood)").eq("owner_id", profile.id).order("created_at", { ascending: false }),
    supabase
      .from("sitting_agreements")
      .select("*, request:house_sitting_requests(title, start_date, end_date), sitter:profiles!sitting_agreements_sitter_id_fkey(full_name, city, neighborhood)")
      .eq("owner_id", profile.id)
      .in("status", ["confirmed", "completed"])
      .order("confirmed_at", { ascending: false }),
    supabase.from("owner_favorite_sitters").select("*").eq("owner_id", profile.id).order("created_at", { ascending: false })
  ]);
  const favoriteIds = favorites?.map((favorite) => favorite.sitter_id) ?? [];
  const { data: favoriteSitters } = favoriteIds.length
    ? await supabase.from("public_sitters").select("*").in("user_id", favoriteIds)
    : { data: [] };
  const favoriteSitterById = new Map(favoriteSitters?.map((sitter) => [sitter.user_id, sitter]) ?? []);
  const orderedFavoriteSitters = favorites?.flatMap((favorite) => {
    const sitter = favoriteSitterById.get(favorite.sitter_id);
    return sitter ? [sitter] : [];
  }) ?? [];
  const openRequests = requests?.filter((request) => request.status === "open") ?? [];
  const pendingReplies = sent?.filter((item) => item.status === "sent").length ?? 0;
  const activeAgreements = agreements?.filter((agreement) => agreement.status === "confirmed") ?? [];
  const completedAgreements = agreements?.filter((agreement) => agreement.status === "completed") ?? [];

  return (
    <Shell>
      <Header role={profile.role} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Majitelský přehled</h1>
          <p className="mt-2 text-stone-600">{profile.full_name} · {profile.city ?? "město nedoplněno"}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <ButtonLink href="/owner/requests/new"><CalendarPlus className="mr-2 h-4 w-4" />Vytvořit poptávku hlídání</ButtonLink>
          <ButtonLink href="/sitters" variant="secondary"><Search className="mr-2 h-4 w-4" />Najít sittera</ButtonLink>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-none"><p className="text-sm text-stone-600">Domácnosti</p><p className="mt-1 text-2xl font-bold">{households?.length ?? 0}</p></Card>
        <Card className="shadow-none"><p className="text-sm text-stone-600">Mazlíčci</p><p className="mt-1 text-2xl font-bold">{pets?.length ?? 0}</p></Card>
        <Card className="shadow-none"><p className="text-sm text-stone-600">Čeká na odpověď</p><p className="mt-1 text-2xl font-bold">{pendingReplies}</p></Card>
        <Card className="shadow-none"><p className="text-sm text-stone-600">Domluveno</p><p className="mt-1 text-2xl font-bold">{activeAgreements.length}</p></Card>
        <Card className="shadow-none"><p className="text-sm text-stone-600">Oblíbení sitteři</p><p className="mt-1 text-2xl font-bold">{orderedFavoriteSitters.length}</p></Card>
      </div>

      {!households?.length || !pets?.length ? (
        <InfoBox title="Nejprve dokončete základní profil">
          Pro odeslání dobré poptávky potřebujete alespoň jednu domácnost a jednoho mazlíčka. Díky tomu sitter hned ví, kde bude pomáhat a o koho půjde.
        </InfoBox>
      ) : null}

      <Card className="mb-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Oblíbení sitteři</h2>
            <p className="mt-1 text-sm text-stone-600">Uložení lidé, které chcete příště oslovit rychleji. Není to veřejný seznam.</p>
          </div>
          <ButtonLink href="/sitters" variant="secondary">Najít další</ButtonLink>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orderedFavoriteSitters.map((sitter) => (
            <Link key={sitter.user_id} href={`/sitters/${sitter.user_id}`} className="rounded-lg border border-forest-100 p-3 hover:bg-forest-50">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{sitter.full_name}</h3>
                  <p className="mt-1 text-sm text-stone-600">{sitter.city} · {sitter.neighborhood}</p>
                </div>
                <Badge tone="amber">Oblíbený</Badge>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-stone-700">{sitter.animal_experience}</p>
              <p className="mt-2 text-sm font-semibold text-forest-900">{sitter.rate_range ?? "Cena dle domluvy"}</p>
            </Link>
          ))}
          {!orderedFavoriteSitters.length ? (
            <EmptyState
              title="Zatím nemáte uloženého sittera"
              text="V adresáři si uložte sittery, kteří působí vhodně pro vaši domácnost. Příště je najdete přímo tady."
              action={<ButtonLink href="/sitters">Procházet sittery</ButtonLink>}
            />
          ) : null}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="text-xl font-semibold">Domácnost</h2>
          {households?.length ? households.map((household) => (
            <div key={household.id} className="mt-4 rounded-lg bg-linen p-4">
              <h3 className="font-semibold">{household.name}</h3>
              <p className="text-sm text-stone-600">{household.city} · {household.neighborhood}</p>
              <p className="mt-2 text-sm">{[household.has_plants && "rostliny", household.has_mail_pickup && "pošta", household.has_alarm && "alarm"].filter(Boolean).join(" · ")}</p>
            </div>
          )) : <p className="mt-3 text-sm text-stone-600">Domácnost zatím není vyplněná.</p>}
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Mazlíčci</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pets?.map((pet) => (
              <div key={pet.id} className="rounded-lg border border-forest-100 p-3">
                <h3 className="font-semibold">{pet.name}</h3>
                <p className="text-sm text-stone-600">{pet.species} · {pet.breed}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <section className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="text-xl font-semibold">Domluvená a dokončená hlídání</h2>
          <div className="mt-4 grid gap-3">
            {agreements?.length ? agreements.map((agreement) => (
              <Link key={agreement.id} href={`/owner/requests/${agreement.request_id}#agreement`} className="rounded-lg border border-forest-100 p-3 hover:bg-forest-50">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{agreement.request?.title}</h3>
                  <Badge tone={agreement.status === "completed" ? "muted" : "green"}>{agreement.status === "completed" ? "Dokončeno" : "Domluveno"}</Badge>
                </div>
                <p className="mt-1 text-sm text-stone-600">{agreement.sitter?.full_name} · {formatDate(agreement.request?.start_date)} - {formatDate(agreement.request?.end_date)}</p>
              </Link>
            )) : <p className="text-sm text-stone-600">Zatím nemáte potvrzené hlídání.</p>}
            {completedAgreements.length ? <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Dokončeno: {completedAgreements.length}</p> : null}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Otevřené poptávky</h2>
          <div className="mt-4 grid gap-3">
            {openRequests.length ? openRequests.map((request) => (
              <Link key={request.id} href={`/owner/requests/${request.id}`} className="rounded-lg border border-forest-100 p-3 hover:bg-forest-50">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{request.title}</h3>
                  <Badge tone={request.urgency === "urgent" ? "amber" : "green"}>{requestStatusLabels[request.status] ?? request.status}</Badge>
                </div>
                <p className="text-sm text-stone-600">{formatDate(request.start_date)} - {formatDate(request.end_date)}</p>
              </Link>
            )) : <EmptyState title="Žádná otevřená poptávka" text="Vytvořte poptávku s termínem, úkoly a požadavky. Potom ji můžete poslat vybraným sitterům." action={<ButtonLink href="/owner/requests/new">Vytvořit poptávku</ButtonLink>} />}
          </div>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Odeslané žádosti</h2>
          <div className="mt-4 grid gap-3">
            {sent?.length ? sent.map((item) => (
              <div key={item.id} className="rounded-lg border border-forest-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.sitter?.full_name ?? "Sitter"}</p>
                  <Badge tone={item.status === "accepted" ? "green" : item.status === "declined" ? "red" : "muted"}>{sitterRequestStatusLabels[item.status] ?? item.status}</Badge>
                </div>
                <p className="text-sm text-stone-600">{item.sitter?.city} · {item.sitter?.neighborhood}</p>
              </div>
            )) : <p className="text-sm text-stone-600">Zatím jste neposlali žádnou žádost.</p>}
          </div>
        </Card>
      </section>
    </Shell>
  );
}
