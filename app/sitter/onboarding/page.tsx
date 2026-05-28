import { sitterOnboardingAction } from "@/app/actions";
import { Card, Field, Header, Shell, SubmitButton, inputClass, textAreaClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const options = [
  ["accepts_dogs", "Psi"],
  ["accepts_cats", "Kočky"],
  ["accepts_small_animals", "Drobná zvířata"],
  ["overnight_stays", "Přespání"],
  ["daily_visits", "Denní návštěvy"],
  ["dog_walking", "Venčení"],
  ["emergency_help", "Urgentní pomoc"],
  ["medication_experience", "Léky"],
  ["senior_pet_experience", "Senioři"],
  ["puppy_experience", "Štěňata"],
  ["reactive_dog_experience", "Citliví psi"],
  ["multiple_pet_experience", "Více mazlíčků"]
];

export default async function SitterOnboardingPage() {
  const { profile } = await requireProfile(["sitter", "professional"]);
  const supabase = await createSupabaseServerClient();
  const { data: sitterProfile } = await supabase.from("sitter_profiles").select("*").eq("user_id", profile.id).maybeSingle();

  return (
    <Shell>
      <Header role={profile.role} />
      <h1 className="text-3xl font-bold">Profil sittera</h1>
      <p className="mt-2 max-w-2xl text-stone-600">Profil se zobrazí veřejně až po schválení administrátorem.</p>
      <form action={sitterOnboardingAction} className="mt-6 grid gap-5">
        <Card className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Celé jméno" name="full_name"><input className={inputClass} id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} required /></Field>
            <Field label="Telefon" name="phone"><input className={inputClass} id="phone" name="phone" defaultValue={profile.phone ?? ""} /></Field>
            <Field label="Město" name="city"><input className={inputClass} id="city" name="city" defaultValue={profile.city ?? ""} /></Field>
            <Field label="Čtvrť" name="neighborhood"><input className={inputClass} id="neighborhood" name="neighborhood" defaultValue={profile.neighborhood ?? ""} /></Field>
            <Field label="URL fotky" name="avatar_url"><input className={inputClass} id="avatar_url" name="avatar_url" placeholder="Volitelné" defaultValue={profile.avatar_url ?? ""} /></Field>
            <Field label="Sazba" name="rate_range"><input className={inputClass} id="rate_range" name="rate_range" placeholder="Např. 600-1000 Kč / den" defaultValue={sitterProfile?.rate_range ?? ""} /></Field>
          </div>
          <Field label="Krátké bio" name="bio"><textarea className={textAreaClass} id="bio" name="bio" required defaultValue={sitterProfile?.bio ?? ""} /></Field>
          <Field label="Motivace" name="motivation"><textarea className={textAreaClass} id="motivation" name="motivation" defaultValue={sitterProfile?.motivation ?? ""} /></Field>
          <Field label="Zkušenosti se zvířaty" name="animal_experience"><textarea className={textAreaClass} id="animal_experience" name="animal_experience" required defaultValue={sitterProfile?.animal_experience ?? ""} /></Field>
          <div className="grid gap-2 sm:grid-cols-3">
            {options.map(([name, label]) => <label key={name} className="rounded-lg border border-forest-100 p-3 text-sm font-medium"><input type="checkbox" name={name} defaultChecked={Boolean(sitterProfile?.[name as keyof typeof sitterProfile])} className="mr-2" />{label}</label>)}
          </div>
        </Card>

        <Card className="grid gap-4">
          <div>
            <h2 className="text-xl font-semibold">Dostupnost</h2>
            <p className="mt-1 text-sm text-stone-600">Nejde o závazný kalendář. Pomáhá majiteli rychle poznat, kdy má smysl vás oslovit.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["available_weekends", "Víkendy"],
              ["available_weekday_evenings", "Všední večery"],
              ["available_mornings", "Rána"],
              ["available_short_notice", "Rychlá domluva"]
            ].map(([name, label]) => <label key={name} className="rounded-lg border border-forest-100 p-3 text-sm font-medium"><input type="checkbox" name={name} defaultChecked={Boolean(sitterProfile?.[name as keyof typeof sitterProfile])} className="mr-2" />{label}</label>)}
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
            <Field label="Nedostupný do" name="unavailable_until"><input className={inputClass} id="unavailable_until" name="unavailable_until" type="date" defaultValue={sitterProfile?.unavailable_until ?? ""} /></Field>
            <Field label="Poznámka k dostupnosti" name="availability_notes"><textarea className={textAreaClass} id="availability_notes" name="availability_notes" placeholder="Např. všední večery, víkendy po domluvě" defaultValue={sitterProfile?.availability_notes ?? ""} /></Field>
          </div>
        </Card>

        <Card className="grid gap-4">
          <Field label="Kontakt na referenci" name="reference_contact"><input className={inputClass} id="reference_contact" name="reference_contact" defaultValue={sitterProfile?.reference_contact ?? ""} /></Field>
          <Field label="Video medailonek URL" name="video_intro_url"><input className={inputClass} id="video_intro_url" name="video_intro_url" defaultValue={sitterProfile?.video_intro_url ?? ""} /></Field>
          <label className="rounded-lg bg-linen p-3 text-sm font-medium"><input type="checkbox" required className="mr-2" />Rozumím, že profil musí být před zveřejněním schválen administrátorem.</label>
        </Card>
        <SubmitButton>Odeslat ke schválení</SubmitButton>
      </form>
    </Shell>
  );
}
