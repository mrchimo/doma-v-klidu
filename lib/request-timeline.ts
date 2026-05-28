type RequestLike = {
  created_at?: string | null;
  status?: string | null;
};

type SitterRequestLike = {
  created_at?: string | null;
  updated_at?: string | null;
  status?: string | null;
};

type ChecklistLike = {
  category?: string | null;
  is_required?: boolean | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type AgreementLike = {
  status?: string | null;
  confirmed_at?: string | null;
  updated_at?: string | null;
};

export type TimelineStep = {
  key: string;
  title: string;
  description: string;
  state: "done" | "current" | "pending";
  date?: string | null;
};

function earliestDate(values: (string | null | undefined)[]) {
  const dates = values.filter(Boolean).sort();
  return dates[0] ?? null;
}

function latestDate(values: (string | null | undefined)[]) {
  const dates = values.filter(Boolean).sort();
  return dates.at(-1) ?? null;
}

export function buildRequestTimeline({
  request,
  sitterRequests,
  checklist,
  agreement
}: {
  request: RequestLike;
  sitterRequests: SitterRequestLike[];
  checklist: ChecklistLike[];
  agreement?: AgreementLike | null;
}): TimelineStep[] {
  const answered = sitterRequests.filter((item) => item.status === "accepted" || item.status === "declined");
  const hasAgreement = Boolean(agreement && agreement.status !== "cancelled") || request.status === "matched" || request.status === "completed";
  const hasAccessItem = checklist.some((item) => item.category === "access");
  const hasSafetyItem = checklist.some((item) => item.category === "safety");
  const hasCareItem = checklist.some((item) => item.category === "pet_care" || item.category === "home" || item.category === "plants_mail");
  const requiredCount = checklist.filter((item) => item.is_required).length;
  const handoverReady = hasAgreement && requiredCount >= 3 && hasCareItem && (hasAccessItem || hasSafetyItem);
  const completed = request.status === "completed" || agreement?.status === "completed";

  const baseSteps = [
    {
      key: "created",
      title: "Poptávka vytvořena",
      description: "Základní termín, domácnost a péče jsou zadané.",
      done: Boolean(request.created_at),
      date: request.created_at
    },
    {
      key: "sent",
      title: "Žádost odeslána",
      description: sitterRequests.length ? "Poptávka už odešla vybranému sitterovi." : "Vyberte schváleného sittera a pošlete mu žádost.",
      done: sitterRequests.length > 0,
      date: earliestDate(sitterRequests.map((item) => item.created_at))
    },
    {
      key: "answered",
      title: "Sitter odpověděl",
      description: answered.length ? "Máte odpověď od sittera, můžete potvrdit konkrétní domluvu." : "Čeká se na přijetí nebo odmítnutí žádosti.",
      done: answered.length > 0,
      date: latestDate(answered.map((item) => item.updated_at ?? item.created_at))
    },
    {
      key: "agreed",
      title: "Domluveno",
      description: hasAgreement ? "Majitel potvrdil konkrétního sittera pro tento termín." : "Po přijetí žádosti potvrďte, že domluva platí.",
      done: hasAgreement,
      date: agreement?.confirmed_at ?? null
    },
    {
      key: "handover",
      title: "Předání připraveno",
      description: handoverReady ? "Checklist obsahuje základní péči i bezpečnost nebo přístup." : "Doplňte checklist tak, aby sitter měl péči, přístup a bezpečnostní instrukce.",
      done: handoverReady,
      date: handoverReady ? latestDate(checklist.map((item) => item.updated_at ?? item.created_at)) : null
    },
    {
      key: "completed",
      title: "Dokončeno",
      description: completed ? "Hlídání je uzavřené." : "Po skončení hlídání půjde poptávku uzavřít a přidat interní zpětnou vazbu.",
      done: completed,
      date: completed ? agreement?.updated_at ?? null : null
    }
  ];

  const firstOpenIndex = baseSteps.findIndex((step) => !step.done);

  return baseSteps.map((step, index) => ({
    key: step.key,
    title: step.title,
    description: step.description,
    date: step.date,
    state: step.done ? "done" : index === firstOpenIndex ? "current" : "pending"
  }));
}
