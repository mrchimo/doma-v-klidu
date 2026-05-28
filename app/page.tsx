import { CheckCircle2, ClipboardList, Home, ShieldCheck } from "lucide-react";
import { ButtonLink, Card, Header, Shell } from "@/components/ui";

const steps = [
  "Vytvoříte profil domácnosti a mazlíčka.",
  "Zadáte termín a typ hlídání.",
  "Vyberete ověřeného sittera v okolí.",
  "Předáte instrukce přes jednoduchý checklist."
];

const useCases = ["víkend pryč", "dovolená", "služební cesta", "kočka doma během cestování", "starší nebo citlivý pes", "rostliny, pošta a kontrola bytu"];
const trust = ["ověřené profily", "reference", "video medailonek", "checklist předání", "admin schvalování sitterů"];

export default function HomePage() {
  return (
    <Shell>
      <Header />
      <section className="grid min-h-[68vh] content-center gap-8 py-8 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-forest-700">Hlídání domova s mazlíčky</p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">Odjíždíte pryč? Mazlíček může zůstat doma.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-700">
            Najděte ověřeného člověka, který se během vaší nepřítomnosti postará o domov, mazlíčka i klidný návrat.
          </p>
          <p className="mt-5 rounded-lg bg-white/75 p-4 text-base font-semibold text-forest-800 shadow-soft">
            Váš mazlíček zůstane doma. Váš domov nezůstane prázdný.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/sign-up">Hledám hlídání</ButtonLink>
            <ButtonLink href="/sign-up" variant="secondary">Chci hlídat</ButtonLink>
          </div>
        </div>
        <div className="rounded-lg bg-forest-800 p-5 text-white shadow-soft">
          <div className="rounded-lg border border-white/15 bg-white/10 p-4">
            <Home className="mb-6 h-9 w-9 text-amberSoft" />
            <h2 className="text-2xl font-semibold">Klidný domov, známé prostředí, jasné instrukce.</h2>
            <p className="mt-4 leading-7 text-forest-50">
              MVP pro krátkodobé hlídání v domácnosti: mazlíček nemusí do hotelu a majitel má přehled, kdo se o domov stará.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 py-8 md:grid-cols-4">
        {steps.map((step, index) => (
          <Card key={step}>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 font-bold text-white">{index + 1}</div>
            <p className="font-medium leading-6">{step}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 py-8 md:grid-cols-2">
        <Card>
          <ClipboardList className="mb-3 h-7 w-7 text-forest-700" />
          <h2 className="text-2xl font-bold">Kdy se hodí</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {useCases.map((item) => (
              <span key={item} className="rounded-full bg-linen px-3 py-2 text-sm font-medium text-stone-700">{item}</span>
            ))}
          </div>
        </Card>
        <Card>
          <ShieldCheck className="mb-3 h-7 w-7 text-forest-700" />
          <h2 className="text-2xl font-bold">Důvěra od prvního kroku</h2>
          <ul className="mt-4 grid gap-3">
            {trust.map((item) => (
              <li key={item} className="flex items-center gap-2 text-stone-700">
                <CheckCircle2 className="h-5 w-5 text-forest-700" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="my-8 rounded-lg bg-forest-700 p-5 text-white sm:p-8">
        <h2 className="text-2xl font-bold">Ověřte zájem v první verzi</h2>
        <p className="mt-2 max-w-2xl text-forest-50">Přidejte domácnost nebo se zaregistrujte jako sitter. Jednoduše, bez plateb a bez složitého rezervačního systému.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/sign-up" variant="secondary">Přidat domácnost</ButtonLink>
          <ButtonLink href="/sign-up" variant="secondary">Zaregistrovat se jako sitter</ButtonLink>
        </div>
      </section>
    </Shell>
  );
}
