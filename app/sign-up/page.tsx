import Link from "next/link";
import { CheckCircle2, Home } from "lucide-react";
import { signUpAction } from "@/app/actions";
import { Card, Field, Header, Shell, SubmitButton, inputClass } from "@/components/ui";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return (
    <Shell>
      <Header />
      <section className="grid min-h-[calc(100vh-112px)] items-center gap-6 pb-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="order-2 lg:order-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-forest-700">První krok</p>
          <h1 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">Začněte klidně. Domácnost i sitter profil nastavíte za pár minut.</h1>
          <p className="mt-4 max-w-xl leading-7 text-stone-700">
            Doma v klidu je jednoduché MVP pro ověření zájmu: bez plateb, bez chatu, s jasným schvalováním sitterů.
          </p>
          <div className="mt-6 grid gap-3">
            {[
              "Majitel přidá domácnost, mazlíčka a poptávku.",
              "Sitter odešle profil ke schválení administrátorem.",
              "Veřejně se zobrazí jen schválené profily."
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-lg bg-white/75 p-3 shadow-soft">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-forest-700" />
                <p className="text-sm font-medium text-stone-700">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="order-1 mx-auto w-full max-w-xl p-5 sm:p-6 lg:order-2">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-800">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Vytvořit účet</h2>
              <p className="mt-1 text-sm text-stone-600">Vyberte roli, se kterou chcete začít.</p>
            </div>
          </div>
          {query.error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{query.error}</p> : null}
          <form action={signUpAction} className="grid gap-4">
            <Field label="Celé jméno" name="full_name"><input className={inputClass} id="full_name" name="full_name" autoComplete="name" required /></Field>
            <Field label="E-mail" name="email"><input className={inputClass} id="email" name="email" type="email" autoComplete="email" required /></Field>
            <Field label="Heslo" name="password"><input className={inputClass} id="password" name="password" type="password" minLength={6} autoComplete="new-password" required /></Field>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium text-forest-800">Role</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["owner", "Majitel", "Hledám hlídání"],
                  ["sitter", "Sitter", "Chci hlídat"],
                  ["professional", "Profesionál", "Profil pro později"]
                ].map(([value, title, note]) => (
                  <label key={value} className="cursor-pointer rounded-lg border border-forest-100 bg-linen/60 p-3 text-sm has-[:checked]:border-forest-700 has-[:checked]:bg-forest-50">
                    <input className="sr-only" type="radio" name="role" value={value} defaultChecked={value === "owner"} />
                    <span className="block font-semibold text-forest-800">{title}</span>
                    <span className="mt-1 block text-xs text-stone-600">{note}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <SubmitButton className="w-full">Pokračovat</SubmitButton>
          </form>
          <p className="mt-5 text-center text-sm text-stone-600">
            Už máte účet? <Link href="/sign-in" className="font-semibold text-forest-800 underline-offset-4 hover:underline">Přihlaste se</Link>
          </p>
        </Card>
      </section>
    </Shell>
  );
}
