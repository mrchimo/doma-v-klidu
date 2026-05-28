# Doma v klidu

Mobilní MVP české platformy pro house-sitting domácností s mazlíčky.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres a RLS
- Server actions pro MVP workflow

## Lokální spuštění

1. Nainstalujte závislosti:

```bash
npm install
```

2. Založte Supabase projekt nebo použijte připojený projekt `wszgggmwfvultwmgwwiz`.

3. Zkopírujte proměnné prostředí:

```bash
cp .env.example .env.local
```

4. Doplňte:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wszgggmwfvultwmgwwiz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

5. Aplikujte SQL migraci ze složky `supabase/migrations` a volitelně `supabase/seed.sql`.

6. Pro hladký MVP průchod registrací vypněte v Supabase Auth nastavení povinné potvrzení e-mailu, nebo počítejte s tím, že nově registrovaný uživatel musí nejdřív potvrdit e-mail a až potom pokračovat v onboardingu.

7. Spusťte aplikaci:

```bash
npm run dev
```

## Demo účty ze seed dat

Všechny demo účty mají heslo `password123`.

- `admin@domavklidu.cz`
- `eva@demo.cz`
- `petr@demo.cz`
- `lucie@demo.cz`
- `anna@demo.cz`
- `marek@demo.cz`

## Hotové MVP flow

- Majitel se registruje, vyplní profil domácnosti a mazlíčka.
- Majitel vytvoří poptávku hlídání.
- Sitter se registruje a odešle profil ke schválení.
- Sitter nastaví jednoduchou dostupnost bez složitého kalendáře.
- Neschválený sitter není ve veřejném adresáři.
- Admin schválí nebo odmítne sittera a udržuje bezpečnostní profil sittera.
- Schválený sitter je vidět v adresáři.
- Majitel filtruje sittery podle lokality, péče, zkušeností a dostupnosti.
- Majitel vidí veřejné signály důvěryhodnosti: ověřený telefon, zkontrolované reference, zkontrolovaný video medailonek a veřejnou poznámku admina.
- Majitel i sitter vidí jednoduché porovnání shody mezi poptávkou a profilem sittera.
- Majitel vidí stavovou osu poptávky od vytvoření přes oslovení sittera až po připravené předání a dokončení.
- Majitel odešle žádost vybranému sitterovi.
- Sitter žádost přijme nebo odmítne.
- Majitel potvrdí přijatou žádost jako domluvené hlídání.
- Majitel i sitter vidí potvrzenou domluvu s termínem, domácností a poznámkou.
- Majitel vidí stav žádosti.
- Admin vidí uživatele, sitter profily a poptávky.

## Bezpečnost a RLS

Migrace zapíná RLS a obsahuje základní politiky pro:

- vlastní profil uživatele,
- CRUD domácností a mazlíčků pouze pro vlastníka,
- CRUD poptávek pouze pro vlastníka,
- odpovědi sitterů pouze na žádosti adresované jim,
- admin dohled nad relevantními tabulkami,
- veřejné čtení pouze schválených sitter profilů.

Veřejný adresář používá read-model tabulku `public_sitters`, která ukládá pouze bezpečná veřejná pole schválených sitterů. Telefon, kontakty na reference, interní admin poznámky a soukromá owner data nejsou veřejně čitelná. Adminem řízená pole důvěryhodnosti chrání trigger, aby si je sitter nemohl sám nastavit.

## Mimo rozsah MVP

Platby, pojištění, ověření identity, real-time chat, recenze bez dokončených bookingů, nativní mobilní aplikace a komplexní kalendář jsou záměrně mimo první verzi.

## TODO po MVP

- Platby a storno pravidla.
- Pojištění a odpovědnost při hlídání.
- Ověření identity a telefonu.
- Real-time chat a notifikace.
