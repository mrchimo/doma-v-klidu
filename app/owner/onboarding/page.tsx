import { ownerOnboardingAction } from "@/app/actions";
import { Card, Field, Header, Shell, SubmitButton, inputClass, textAreaClass } from "@/components/ui";
import { requireProfile } from "@/lib/auth";

export default async function OwnerOnboardingPage() {
  const { profile } = await requireProfile(["owner"]);

  return (
    <Shell>
      <Header role={profile.role} />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Přidat domácnost a mazlíčka</h1>
        <p className="mt-2 max-w-2xl text-stone-600">Stačí první praktický profil. Detaily můžete později zpřesnit.</p>
      </div>
      <form action={ownerOnboardingAction} className="grid gap-5">
        <Card className="grid gap-4">
          <h2 className="text-xl font-semibold">Váš profil</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Celé jméno" name="full_name"><input className={inputClass} id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} required /></Field>
            <Field label="Telefon" name="phone"><input className={inputClass} id="phone" name="phone" /></Field>
            <Field label="Město" name="city"><input className={inputClass} id="city" name="city" /></Field>
            <Field label="Čtvrť" name="neighborhood"><input className={inputClass} id="neighborhood" name="neighborhood" /></Field>
          </div>
        </Card>

        <Card className="grid gap-4">
          <h2 className="text-xl font-semibold">Domácnost</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Název domácnosti" name="household_name"><input className={inputClass} id="household_name" name="household_name" required /></Field>
            <Field label="Typ" name="household_type">
              <select className={inputClass} id="household_type" name="household_type">
                <option value="apartment">Byt</option>
                <option value="house">Dům</option>
                <option value="other">Jiné</option>
              </select>
            </Field>
            <Field label="Město" name="household_city"><input className={inputClass} id="household_city" name="household_city" /></Field>
            <Field label="Čtvrť" name="household_neighborhood"><input className={inputClass} id="household_neighborhood" name="household_neighborhood" /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["has_plants", "Rostliny"],
              ["has_mail_pickup", "Pošta"],
              ["has_alarm", "Alarm"],
              ["has_cameras", "Kamery"]
            ].map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 rounded-lg border border-forest-100 p-3 text-sm font-medium"><input type="checkbox" name={name} /> {label}</label>
            ))}
          </div>
          <Field label="Parkování" name="parking_notes"><textarea className={textAreaClass} id="parking_notes" name="parking_notes" /></Field>
          <Field label="Pravidla domácnosti" name="house_rules"><textarea className={textAreaClass} id="house_rules" name="house_rules" /></Field>
          <Field label="Instrukce k přístupu" name="access_notes"><textarea className={textAreaClass} id="access_notes" name="access_notes" placeholder="Detailní údaje předejte až vybranému sitterovi." /></Field>
        </Card>

        <Card className="grid gap-4">
          <h2 className="text-xl font-semibold">Mazlíček</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jméno" name="pet_name"><input className={inputClass} id="pet_name" name="pet_name" required /></Field>
            <Field label="Druh" name="species">
              <select className={inputClass} id="species" name="species">
                <option value="dog">Pes</option>
                <option value="cat">Kočka</option>
                <option value="other">Jiné</option>
              </select>
            </Field>
            <Field label="Plemeno" name="breed"><input className={inputClass} id="breed" name="breed" /></Field>
            <Field label="Věk" name="age"><input className={inputClass} id="age" name="age" /></Field>
            <Field label="Velikost" name="size"><input className={inputClass} id="size" name="size" /></Field>
            <Field label="Povaha" name="temperament"><input className={inputClass} id="temperament" name="temperament" /></Field>
          </div>
          {[
            ["feeding_instructions", "Krmení"],
            ["medication", "Léky"],
            ["allergies", "Alergie"],
            ["fears", "Strachy"],
            ["behavior_people", "Chování k lidem"],
            ["behavior_animals", "Chování ke zvířatům"],
            ["veterinarian_contact", "Veterinář"],
            ["emergency_contact", "Nouzový kontakt"],
            ["never_do", "Co nikdy nedělat"]
          ].map(([name, label]) => (
            <Field key={name} label={label} name={name}><textarea className={textAreaClass} id={name} name={name} /></Field>
          ))}
        </Card>
        <SubmitButton className="w-full sm:w-auto">Uložit a pokračovat</SubmitButton>
      </form>
    </Shell>
  );
}
