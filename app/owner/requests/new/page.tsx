import { createHouseSittingRequestAction } from "@/app/actions";
import { ButtonLink, Card, EmptyState, Field, Header, InfoBox, Shell, SubmitButton, inputClass, textAreaClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const tasks = [
  ["feeding", "Krmení"],
  ["walking", "Venčení"],
  ["litter_box", "Kočičí toaleta"],
  ["medication", "Léky"],
  ["watering_plants", "Zalévání"],
  ["mail", "Pošta"],
  ["safety_check", "Kontrola bytu"],
  ["other", "Jiné"]
];
const requirements = [
  ["dogs", "Zkušenost se psy"],
  ["cats", "Zkušenost s kočkami"],
  ["medication", "Podání léků"],
  ["overnight", "Přespání"],
  ["reactive_animals", "Citlivá zvířata"]
];

export default async function NewRequestPage() {
  const { profile } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  const [{ data: households }, { data: pets }] = await Promise.all([
    supabase.from("households").select("*").eq("owner_id", profile.id),
    supabase.from("pets").select("*").eq("owner_id", profile.id)
  ]);

  return (
    <Shell>
      <Header role={profile.role} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Vytvořit poptávku</h1>
        <p className="mt-2 max-w-2xl text-stone-600">Popište termín, péči a praktické úkoly. Poptávka se po uložení označí jako otevřená a můžete ji poslat konkrétnímu sitterovi.</p>
      </div>
      {!households?.length || !pets?.length ? (
        <EmptyState
          title="Chybí domácnost nebo mazlíček"
          text="Než vytvoříte poptávku, doplňte alespoň jednu domácnost a jednoho mazlíčka. Sitter tak dostane důležitý kontext hned od začátku."
          action={<ButtonLink href="/owner/onboarding">Doplnit profil</ButtonLink>}
        />
      ) : null}
      <form action={createHouseSittingRequestAction} className="mt-6 grid gap-5">
        <Card className="grid gap-4">
          <InfoBox title="Co sitter uvidí">
            Název, termín, město domácnosti, vybrané mazlíčky, úkoly, požadavky a vaši zprávu. Detailní přístupové údaje si nechte až pro domluvené předání.
          </InfoBox>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Název poptávky" name="title"><input className={inputClass} id="title" name="title" required placeholder="Např. Kočka na víkend doma" /></Field>
            <Field label="Domácnost" name="household_id">
              <select className={inputClass} id="household_id" name="household_id" required>
                {households?.map((household) => <option key={household.id} value={household.id}>{household.name}</option>)}
              </select>
            </Field>
            <Field label="Začátek" name="start_date"><input className={inputClass} id="start_date" name="start_date" type="date" required /></Field>
            <Field label="Konec" name="end_date"><input className={inputClass} id="end_date" name="end_date" type="date" required /></Field>
            <Field label="Typ hlídání" name="sitting_type">
              <select className={inputClass} id="sitting_type" name="sitting_type">
                <option value="overnight">Přespání v domácnosti</option>
                <option value="daily_visits">Denní návštěvy</option>
                <option value="walking_home_check">Venčení + kontrola domácnosti</option>
                <option value="urgent_help">Urgentní pomoc</option>
              </select>
            </Field>
            <Field label="Urgence" name="urgency">
              <select className={inputClass} id="urgency" name="urgency">
                <option value="normal">Normální</option>
                <option value="urgent">Urgentní</option>
              </select>
            </Field>
          </div>
          <Field label="Mazlíčci" name="pet_ids">
            <div className="grid gap-2 sm:grid-cols-2">
              {pets?.map((pet) => <label key={pet.id} className="rounded-lg border border-forest-100 p-3"><input type="checkbox" name="pet_ids" value={pet.id} className="mr-2" />{pet.name}</label>)}
            </div>
            <p className="text-xs font-normal text-stone-500">Vyberte všechny mazlíčky, kterých se hlídání týká.</p>
          </Field>
          <Field label="Preferovaná časová okna" name="preferred_time_windows"><input className={inputClass} id="preferred_time_windows" name="preferred_time_windows" placeholder="Ráno 8-10, večer 18-20" /></Field>
        </Card>

        <Card className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold">Úkoly a požadavky</h2>
            <p className="mt-1 text-sm text-stone-600">Čím jasnější checklist, tím menší prostor pro nedorozumění při předání.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              {tasks.map(([value, label]) => <label key={value} className="rounded-lg border border-forest-100 p-3"><input type="checkbox" name="tasks" value={value} className="mr-2" />{label}</label>)}
            </div>
            <div className="grid gap-2">
              {requirements.map(([value, label]) => <label key={value} className="rounded-lg border border-forest-100 p-3"><input type="checkbox" name="sitter_requirements" value={value} className="mr-2" />{label}</label>)}
            </div>
          </div>
          <Field label="Rozpočet" name="budget_range"><input className={inputClass} id="budget_range" name="budget_range" placeholder="Např. 800-1200 Kč / den" /></Field>
          <Field label="Poznámky" name="notes"><textarea className={textAreaClass} id="notes" name="notes" placeholder="Např. co je nejdůležitější, jak mazlíček reaguje na nové lidi, kdy je doma klid." /></Field>
        </Card>
        <SubmitButton className="w-full sm:w-auto">Vytvořit otevřenou poptávku</SubmitButton>
      </form>
    </Shell>
  );
}
