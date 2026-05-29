import { sitterRiskFlagLabels } from "@/lib/labels";

type SitterQualityInput = {
  bio?: string | null;
  animal_experience?: string | null;
  reference_contact?: string | null;
  video_intro_url?: string | null;
  phone_verified?: boolean | null;
  reference_checked?: boolean | null;
  video_intro_reviewed?: boolean | null;
  bio_reviewed?: boolean | null;
  experience_reviewed?: boolean | null;
  risk_reviewed?: boolean | null;
  risk_flags?: string[] | null;
  phone?: string | null;
};

export type SitterQualityItem = {
  key: "phone" | "bio" | "experience" | "reference" | "video" | "risk";
  label: string;
  detail: string;
  complete: boolean;
  required: boolean;
};

function hasText(value?: string | null, minLength = 1) {
  return Boolean(value && value.trim().length >= minLength);
}

export function getSitterQualityReview(sitter: SitterQualityInput) {
  const riskFlags = sitter.risk_flags ?? [];
  const hasVideo = hasText(sitter.video_intro_url);
  const items: SitterQualityItem[] = [
    {
      key: "phone",
      label: "Telefon",
      detail: sitter.phone_verified
        ? "Telefon ověřen administrátorem."
        : sitter.phone
          ? "Telefon je uvedený, čeká na ověření."
          : "Telefon chybí v profilu.",
      complete: Boolean(sitter.phone_verified),
      required: true
    },
    {
      key: "bio",
      label: "Bio",
      detail: sitter.bio_reviewed
        ? "Bio zkontrolováno."
        : hasText(sitter.bio, 40)
          ? "Bio je dostatečné, čeká na kontrolu."
          : "Bio je příliš stručné nebo chybí.",
      complete: Boolean(sitter.bio_reviewed && hasText(sitter.bio, 40)),
      required: true
    },
    {
      key: "experience",
      label: "Zkušenosti",
      detail: sitter.experience_reviewed
        ? "Zkušenosti zkontrolovány."
        : hasText(sitter.animal_experience, 40)
          ? "Zkušenosti jsou popsané, čekají na kontrolu."
          : "Zkušenosti jsou příliš stručné nebo chybí.",
      complete: Boolean(sitter.experience_reviewed && hasText(sitter.animal_experience, 40)),
      required: true
    },
    {
      key: "reference",
      label: "Reference",
      detail: sitter.reference_checked
        ? "Reference ověřena."
        : hasText(sitter.reference_contact)
          ? "Kontakt na referenci je uvedený, čeká na ověření."
          : "Reference chybí.",
      complete: Boolean(sitter.reference_checked),
      required: true
    },
    {
      key: "video",
      label: "Video",
      detail: hasVideo
        ? sitter.video_intro_reviewed
          ? "Video medailonek zkontrolován."
          : "Video je uvedené, čeká na kontrolu."
        : "Video není v MVP povinné.",
      complete: !hasVideo || Boolean(sitter.video_intro_reviewed),
      required: hasVideo
    },
    {
      key: "risk",
      label: "Rizikové signály",
      detail: sitter.risk_reviewed
        ? riskFlags.length
          ? `Zkontrolováno, signály: ${riskFlags.map((flag) => sitterRiskFlagLabels[flag] ?? flag).join(", ")}.`
          : "Zkontrolováno bez rizikových signálů."
        : "Rizikové signály ještě nejsou zkontrolované.",
      complete: Boolean(sitter.risk_reviewed),
      required: true
    }
  ];

  const completedCount = items.filter((item) => item.complete).length;
  const totalCount = items.length;
  const blockingItems = items.filter((item) => item.required && !item.complete).map((item) => item.label);
  const readyToApprove = blockingItems.length === 0;

  return {
    items,
    riskFlags,
    riskLabels: riskFlags.map((flag) => sitterRiskFlagLabels[flag] ?? flag),
    completedCount,
    totalCount,
    score: Math.round((completedCount / totalCount) * 100),
    readyToApprove,
    blockingItems,
    statusLabel: readyToApprove ? (riskFlags.length ? "Připraveno s poznámkou" : "Připraveno ke schválení") : "Chybí kontrola",
    tone: readyToApprove ? ("green" as const) : ("amber" as const)
  };
}
