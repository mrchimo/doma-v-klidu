import Link from "next/link";
import { KeyRound, ShieldCheck } from "lucide-react";
import { signInAction } from "@/app/actions";
import { Card, Field, Header, Shell, SubmitButton, inputClass } from "@/components/ui";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const query = await searchParams;
  return (
    <Shell>
      <Header />
      <section className="grid min-h-[calc(100vh-112px)] items-center gap-6 pb-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="order-2 lg:order-1">
          <p className="text-sm font-semibold uppercase tracking-wider text-forest-700">Bezpečný přístup</p>
          <h1 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">Vítejte zpět v přehledu domácnosti a hlídání.</h1>
          <p className="mt-4 max-w-xl leading-7 text-stone-700">
            Po přihlášení vás aplikace pošle přímo na správné místo podle role: majitel, sitter, profesionál nebo admin.
          </p>
          <div className="mt-6 rounded-lg bg-forest-800 p-4 text-white shadow-soft">
            <ShieldCheck className="mb-3 h-6 w-6 text-amberSoft" />
            <p className="text-sm leading-6 text-forest-50">Admin schvaluje sitter profily a veřejně se zobrazují pouze ověření sitteři. Citlivé údaje domácnosti zůstávají za přihlášením.</p>
          </div>
        </div>

        <Card className="order-1 mx-auto w-full max-w-xl p-5 sm:p-6 lg:order-2">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-800">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Přihlášení</h2>
              <p className="mt-1 text-sm text-stone-600">Přihlaste se ke své domácnosti, sitter profilu nebo administraci.</p>
            </div>
          </div>
          {query.error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{query.error}</p> : null}
          {query.message ? <p className="mb-4 rounded-lg bg-forest-50 p-3 text-sm text-forest-800">{query.message}</p> : null}
          <form action={signInAction} className="grid gap-4">
            <Field label="E-mail" name="email"><input className={inputClass} id="email" name="email" type="email" autoComplete="email" required /></Field>
            <Field label="Heslo" name="password"><input className={inputClass} id="password" name="password" type="password" autoComplete="current-password" required /></Field>
            <SubmitButton className="w-full">Přihlásit</SubmitButton>
          </form>
          <p className="mt-5 text-center text-sm text-stone-600">
            Nemáte účet? <Link href="/sign-up" className="font-semibold text-forest-800 underline-offset-4 hover:underline">Vytvořte si ho</Link>
          </p>
        </Card>
      </section>
    </Shell>
  );
}
