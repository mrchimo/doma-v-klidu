"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dashboardForRole, requireProfile } from "@/lib/auth";
import {
  dispatchDueEmailNotifications,
  queueCalmReportSubmittedEmail,
  queueSitterApprovedEmail,
  queueSitterRequestResponseEmail,
  queueSitterRequestSentEmail,
  queueSittingReminderEmail
} from "@/lib/email-notifications";
import { getSitterQualityReview } from "@/lib/sitter-quality";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const roleSchema = z.enum(["owner", "sitter", "professional"]);
const checklistCategorySchema = z.enum(["pet_care", "home", "access", "safety", "plants_mail", "other"]);
const calmReportPetStatusSchema = z.enum(["okay", "attention"]);
const calmReportTaskStatusSchema = z.enum(["done", "not_needed", "attention"]);

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function values(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.length ? value : null;
}

function internalPath(value: FormDataEntryValue | null, fallback = "/") {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function yesNo(formData: FormData, key: string) {
  return z.enum(["yes", "no"]).parse(formData.get(key)) === "yes";
}

function reportPhotoExtension(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return null;
}

function defaultChecklistItems(tasks: string[], ownerId: string, requestId: string) {
  const taskTemplates: Record<string, { title: string; details: string; category: "pet_care" | "home" | "safety" | "plants_mail" | "other" }> = {
    feeding: {
      title: "Krmení podle instrukcí",
      details: "Zkontrolovat množství, čas krmení a dostupnou vodu.",
      category: "pet_care"
    },
    walking: {
      title: "Venčení podle režimu mazlíčka",
      details: "Dodržet délku procházky, vodítko a případná místa, kterým se vyhnout.",
      category: "pet_care"
    },
    litter_box: {
      title: "Kočičí toaleta",
      details: "Vyčistit toaletu a zkontrolovat, že je kolem čisto.",
      category: "pet_care"
    },
    medication: {
      title: "Léky nebo zdravotní péče",
      details: "Ověřit dávkování, čas podání a kontakt pro případ nejistoty.",
      category: "pet_care"
    },
    watering_plants: {
      title: "Zalévání rostlin",
      details: "Zalít pouze označené rostliny podle domluveného režimu.",
      category: "plants_mail"
    },
    mail: {
      title: "Pošta a schránka",
      details: "Vybrat schránku a nechat poštu na domluveném místě.",
      category: "plants_mail"
    },
    safety_check: {
      title: "Bezpečnostní kontrola bytu",
      details: "Před odchodem zkontrolovat okna, dveře, světla a spotřebiče.",
      category: "safety"
    }
  };

  const items = tasks.flatMap((task, index) => {
    const template = taskTemplates[task];
    if (!template) return [];
    return [{
      request_id: requestId,
      owner_id: ownerId,
      title: template.title,
      details: template.details,
      category: template.category,
      is_required: true,
      sort_order: (index + 1) * 10
    }];
  });

  return [
    ...items,
    {
      request_id: requestId,
      owner_id: ownerId,
      title: "Předání klíčů a přístupu",
      details: "Konkrétní přístupové údaje předat až po domluvě s vybraným sitterem.",
      category: "access" as const,
      is_required: true,
      sort_order: 900
    },
    {
      request_id: requestId,
      owner_id: ownerId,
      title: "Nouzový kontakt po ruce",
      details: "Ujistit se, že sitter má kontakt na majitele a veterináře.",
      category: "safety" as const,
      is_required: true,
      sort_order: 910
    }
  ];
}

export async function signUpAction(formData: FormData) {
  const parsed = z
    .object({
      email: z.string().email(),
      password: z.string().min(6),
      full_name: z.string().min(2),
      role: roleSchema
    })
    .parse(Object.fromEntries(formData));

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
      data: { full_name: parsed.full_name, role: parsed.role }
    }
  });

  if (error) redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: parsed.full_name,
      email: parsed.email,
      role: parsed.role
    });
  }

  if (!data.session) {
    redirect(`/sign-in?message=${encodeURIComponent("Účet je vytvořený. Zkontrolujte e-mail a potom se přihlaste.")}`);
  }

  redirect(parsed.role === "owner" ? "/owner/onboarding" : "/sitter/onboarding");
}

export async function signInAction(formData: FormData) {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).parse(Object.fromEntries(formData));
  const supabase = await createSupabaseServerClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword(parsed);
  if (error) redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);

  const { data: profile } = authData.user
    ? await supabase.from("profiles").select("role").eq("id", authData.user.id).single()
    : { data: null };
  const metadataRole = typeof authData.user?.user_metadata?.role === "string" ? authData.user.user_metadata.role : null;
  redirect(dashboardForRole(profile?.role ?? metadataRole ?? "owner"));
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function ownerOnboardingAction(formData: FormData) {
  const { user } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("profiles")
    .update({
      full_name: text(formData, "full_name"),
      phone: text(formData, "phone"),
      city: text(formData, "city"),
      neighborhood: text(formData, "neighborhood")
    })
    .eq("id", user.id);

  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({
      owner_id: user.id,
      name: String(formData.get("household_name") ?? "Domácnost"),
      city: text(formData, "household_city"),
      neighborhood: text(formData, "household_neighborhood"),
      household_type: text(formData, "household_type"),
      has_plants: bool(formData, "has_plants"),
      has_mail_pickup: bool(formData, "has_mail_pickup"),
      has_alarm: bool(formData, "has_alarm"),
      has_cameras: bool(formData, "has_cameras"),
      parking_notes: text(formData, "parking_notes"),
      house_rules: text(formData, "house_rules"),
      access_notes: text(formData, "access_notes")
    })
    .select()
    .single();

  if (householdError || !household) redirect("/owner/onboarding?error=household");

  await supabase.from("pets").insert({
    owner_id: user.id,
    household_id: household.id,
    name: String(formData.get("pet_name") ?? "Mazlíček"),
    species: text(formData, "species"),
    breed: text(formData, "breed"),
    age: text(formData, "age"),
    size: text(formData, "size"),
    temperament: text(formData, "temperament"),
    feeding_instructions: text(formData, "feeding_instructions"),
    medication: text(formData, "medication"),
    allergies: text(formData, "allergies"),
    fears: text(formData, "fears"),
    behavior_people: text(formData, "behavior_people"),
    behavior_animals: text(formData, "behavior_animals"),
    veterinarian_contact: text(formData, "veterinarian_contact"),
    emergency_contact: text(formData, "emergency_contact"),
    never_do: text(formData, "never_do")
  });

  redirect("/owner/dashboard");
}

export async function sitterOnboardingAction(formData: FormData) {
  const { user, profile } = await requireProfile(["sitter", "professional"]);
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("profiles")
    .update({
      full_name: text(formData, "full_name") ?? profile.full_name,
      phone: text(formData, "phone"),
      city: text(formData, "city"),
      neighborhood: text(formData, "neighborhood"),
      avatar_url: text(formData, "avatar_url")
    })
    .eq("id", user.id);

  const { data: existingSitterProfile } = await supabase
    .from("sitter_profiles")
    .select("approval_status")
    .eq("user_id", user.id)
    .maybeSingle();

  await supabase.from("sitter_profiles").upsert({
    user_id: user.id,
    bio: text(formData, "bio"),
    motivation: text(formData, "motivation"),
    animal_experience: text(formData, "animal_experience"),
    accepts_dogs: bool(formData, "accepts_dogs"),
    accepts_cats: bool(formData, "accepts_cats"),
    accepts_small_animals: bool(formData, "accepts_small_animals"),
    overnight_stays: bool(formData, "overnight_stays"),
    daily_visits: bool(formData, "daily_visits"),
    dog_walking: bool(formData, "dog_walking"),
    emergency_help: bool(formData, "emergency_help"),
    medication_experience: bool(formData, "medication_experience"),
    senior_pet_experience: bool(formData, "senior_pet_experience"),
    puppy_experience: bool(formData, "puppy_experience"),
    reactive_dog_experience: bool(formData, "reactive_dog_experience"),
    multiple_pet_experience: bool(formData, "multiple_pet_experience"),
    rate_range: text(formData, "rate_range"),
    availability_notes: text(formData, "availability_notes"),
    available_weekends: bool(formData, "available_weekends"),
    available_weekday_evenings: bool(formData, "available_weekday_evenings"),
    available_mornings: bool(formData, "available_mornings"),
    available_short_notice: bool(formData, "available_short_notice"),
    unavailable_until: text(formData, "unavailable_until"),
    reference_contact: text(formData, "reference_contact"),
    video_intro_url: text(formData, "video_intro_url"),
    approval_status: existingSitterProfile?.approval_status === "approved" ? "approved" : "pending_approval"
  }, { onConflict: "user_id" });

  redirect("/sitter/dashboard");
}

export async function createHouseSittingRequestAction(formData: FormData) {
  const { user } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  const { data: request, error } = await supabase
    .from("house_sitting_requests")
    .insert({
      owner_id: user.id,
      household_id: String(formData.get("household_id")),
      title: String(formData.get("title") ?? "Poptávka hlídání"),
      start_date: String(formData.get("start_date")),
      end_date: String(formData.get("end_date")),
      sitting_type: String(formData.get("sitting_type")),
      preferred_time_windows: text(formData, "preferred_time_windows"),
      tasks: values(formData, "tasks"),
      sitter_requirements: values(formData, "sitter_requirements"),
      budget_range: text(formData, "budget_range"),
      notes: text(formData, "notes"),
      urgency: String(formData.get("urgency") ?? "normal") as "normal" | "urgent",
      status: "open"
    })
    .select()
    .single();

  if (error || !request) redirect("/owner/requests/new?error=create");

  const petIds = values(formData, "pet_ids").map((pet_id) => ({ request_id: request.id, pet_id }));
  if (petIds.length) await supabase.from("request_pets").insert(petIds);

  const checklistItems = defaultChecklistItems(values(formData, "tasks"), user.id, request.id);
  if (checklistItems.length) await supabase.from("handover_checklist_items").insert(checklistItems);

  redirect(`/owner/requests/${request.id}`);
}

export async function addHandoverChecklistItemAction(formData: FormData) {
  const { user } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  const parsed = z.object({
    request_id: z.string().uuid(),
    title: z.string().min(2).max(120),
    details: z.string().max(600).optional(),
    category: checklistCategorySchema
  }).parse({
    request_id: formData.get("request_id"),
    title: formData.get("title"),
    details: formData.get("details") ?? undefined,
    category: formData.get("category")
  });

  const { count } = await supabase
    .from("handover_checklist_items")
    .select("id", { count: "exact", head: true })
    .eq("request_id", parsed.request_id)
    .eq("owner_id", user.id);

  const { error } = await supabase.from("handover_checklist_items").insert({
    request_id: parsed.request_id,
    owner_id: user.id,
    title: parsed.title,
    details: parsed.details?.trim() ? parsed.details.trim() : null,
    category: parsed.category,
    is_required: bool(formData, "is_required"),
    sort_order: ((count ?? 0) + 1) * 10
  });

  if (error) redirect(`/owner/requests/${parsed.request_id}?error=checklist`);
  revalidatePath(`/owner/requests/${parsed.request_id}`);
  redirect(`/owner/requests/${parsed.request_id}#handover-checklist`);
}

export async function deleteHandoverChecklistItemAction(formData: FormData) {
  const { user } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  const requestId = z.string().uuid().parse(formData.get("request_id"));
  const id = z.string().uuid().parse(formData.get("id"));

  await supabase.from("handover_checklist_items").delete().eq("id", id).eq("owner_id", user.id);
  revalidatePath(`/owner/requests/${requestId}`);
  redirect(`/owner/requests/${requestId}#handover-checklist`);
}

export async function sendSitterRequestAction(formData: FormData) {
  const { user } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  const { data: sitterRequest, error } = await supabase
    .from("sitter_requests")
    .insert({
      request_id: String(formData.get("request_id")),
      owner_id: user.id,
      sitter_id: String(formData.get("sitter_id")),
      message: text(formData, "message"),
      status: "sent"
    })
    .select("id")
    .single();

  if (error || !sitterRequest) redirect(`/sitters/${String(formData.get("sitter_id"))}?error=request`);
  await queueSitterRequestSentEmail(sitterRequest.id);
  revalidatePath("/owner/dashboard");
  redirect(`/owner/requests/${String(formData.get("request_id"))}`);
}

export async function toggleFavoriteSitterAction(formData: FormData) {
  const { user } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  const sitterId = z.string().uuid().parse(formData.get("sitter_id"));
  const intent = z.enum(["add", "remove"]).parse(formData.get("intent"));
  const redirectTo = internalPath(formData.get("redirect_to"), "/sitters");

  if (intent === "add") {
    const { error } = await supabase
      .from("owner_favorite_sitters")
      .insert({ owner_id: user.id, sitter_id: sitterId });

    if (error && error.code !== "23505") redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=favorite`);
  } else {
    await supabase
      .from("owner_favorite_sitters")
      .delete()
      .eq("owner_id", user.id)
      .eq("sitter_id", sitterId);
  }

  revalidatePath("/owner/dashboard");
  revalidatePath("/sitters");
  revalidatePath(`/sitters/${sitterId}`);
  redirect(redirectTo);
}

export async function cancelSitterRequestAction(formData: FormData) {
  const { user } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  await supabase.from("sitter_requests").update({ status: "cancelled" }).eq("id", String(formData.get("id"))).eq("owner_id", user.id);
  revalidatePath("/owner/dashboard");
}

export async function confirmSittingAgreementAction(formData: FormData) {
  const { user } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  const parsed = z.object({
    request_id: z.string().uuid(),
    sitter_request_id: z.string().uuid(),
    owner_note: z.string().max(700).optional()
  }).parse({
    request_id: formData.get("request_id"),
    sitter_request_id: formData.get("sitter_request_id"),
    owner_note: formData.get("owner_note") ?? undefined
  });

  const { data: sitterRequest } = await supabase
    .from("sitter_requests")
    .select("id, request_id, owner_id, sitter_id, status")
    .eq("id", parsed.sitter_request_id)
    .eq("request_id", parsed.request_id)
    .eq("owner_id", user.id)
    .single();

  if (!sitterRequest || sitterRequest.status !== "accepted") {
    redirect(`/owner/requests/${parsed.request_id}?error=agreement`);
  }

  const { data: agreement, error } = await supabase
    .from("sitting_agreements")
    .insert({
      request_id: parsed.request_id,
      sitter_request_id: parsed.sitter_request_id,
      owner_id: user.id,
      sitter_id: sitterRequest.sitter_id,
      owner_note: parsed.owner_note?.trim() ? parsed.owner_note.trim() : null,
      status: "confirmed"
    })
    .select("id")
    .single();

  if (error) redirect(`/owner/requests/${parsed.request_id}?error=agreement`);

  await supabase.from("house_sitting_requests").update({ status: "matched" }).eq("id", parsed.request_id).eq("owner_id", user.id);
  if (agreement) await queueSittingReminderEmail(agreement.id);
  revalidatePath("/owner/dashboard");
  revalidatePath("/sitter/dashboard");
  revalidatePath(`/owner/requests/${parsed.request_id}`);
  redirect(`/owner/requests/${parsed.request_id}#agreement`);
}

export async function cancelSittingAgreementAction(formData: FormData) {
  const { user } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  const requestId = z.string().uuid().parse(formData.get("request_id"));
  const id = z.string().uuid().parse(formData.get("id"));

  const { error } = await supabase
    .from("sitting_agreements")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", id)
    .eq("request_id", requestId)
    .eq("owner_id", user.id)
    .eq("status", "confirmed");

  if (error) redirect(`/owner/requests/${requestId}?error=agreement`);

  await supabase.from("house_sitting_requests").update({ status: "open" }).eq("id", requestId).eq("owner_id", user.id);
  revalidatePath("/owner/dashboard");
  revalidatePath("/sitter/dashboard");
  revalidatePath(`/owner/requests/${requestId}`);
  redirect(`/owner/requests/${requestId}#agreement`);
}

export async function completeSittingWithFeedbackAction(formData: FormData) {
  const { user } = await requireProfile(["owner"]);
  const supabase = await createSupabaseServerClient();
  const parsed = z.object({
    agreement_id: z.string().uuid(),
    request_id: z.string().uuid(),
    owner_note: z.string().max(1000).optional()
  }).parse({
    agreement_id: formData.get("agreement_id"),
    request_id: formData.get("request_id"),
    owner_note: formData.get("owner_note") ?? undefined
  });

  const { data: agreement } = await supabase
    .from("sitting_agreements")
    .select("id, request_id, sitter_request_id, owner_id, sitter_id, status")
    .eq("id", parsed.agreement_id)
    .eq("request_id", parsed.request_id)
    .eq("owner_id", user.id)
    .in("status", ["confirmed", "completed"])
    .single();

  if (!agreement) redirect(`/owner/requests/${parsed.request_id}?error=feedback`);

  const now = new Date().toISOString();
  const { error: feedbackError } = await supabase
    .from("sitting_feedback")
    .upsert({
      agreement_id: agreement.id,
      request_id: agreement.request_id,
      owner_id: user.id,
      sitter_id: agreement.sitter_id,
      went_well: yesNo(formData, "went_well"),
      sitter_on_time: yesNo(formData, "sitter_on_time"),
      instructions_clear: yesNo(formData, "instructions_clear"),
      would_book_again: yesNo(formData, "would_book_again"),
      owner_note: parsed.owner_note?.trim() ? parsed.owner_note.trim() : null
    }, { onConflict: "agreement_id" });

  if (feedbackError) redirect(`/owner/requests/${parsed.request_id}?error=${encodeURIComponent(feedbackError.message)}`);

  await Promise.all([
    supabase
      .from("sitting_agreements")
      .update({ status: "completed", completed_at: now })
      .eq("id", agreement.id)
      .eq("owner_id", user.id),
    supabase
      .from("house_sitting_requests")
      .update({ status: "completed" })
      .eq("id", agreement.request_id)
      .eq("owner_id", user.id),
    supabase
      .from("sitter_requests")
      .update({ status: "completed" })
      .eq("id", agreement.sitter_request_id)
      .eq("owner_id", user.id)
  ]);

  revalidatePath("/owner/dashboard");
  revalidatePath("/sitter/dashboard");
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
  revalidatePath(`/owner/requests/${parsed.request_id}`);
  redirect(`/owner/requests/${parsed.request_id}#feedback`);
}

export async function submitCalmReportAction(formData: FormData) {
  const { user } = await requireProfile(["sitter", "professional"]);
  const supabase = await createSupabaseServerClient();
  const parsed = z.object({
    agreement_id: z.string().uuid(),
    request_id: z.string().uuid(),
    pet_status: calmReportPetStatusSchema,
    feeding_status: calmReportTaskStatusSchema,
    walking_status: calmReportTaskStatusSchema,
    home_check_status: calmReportTaskStatusSchema,
    note: z.string().max(1000).optional()
  }).parse({
    agreement_id: formData.get("agreement_id"),
    request_id: formData.get("request_id"),
    pet_status: formData.get("pet_status"),
    feeding_status: formData.get("feeding_status"),
    walking_status: formData.get("walking_status"),
    home_check_status: formData.get("home_check_status"),
    note: formData.get("note") ?? undefined
  });

  const { data: agreement } = await supabase
    .from("sitting_agreements")
    .select("id, request_id, owner_id, sitter_id, status")
    .eq("id", parsed.agreement_id)
    .eq("request_id", parsed.request_id)
    .eq("sitter_id", user.id)
    .eq("status", "confirmed")
    .single();

  if (!agreement) redirect("/sitter/dashboard?error=report_agreement");

  const { data: existingReport } = await supabase
    .from("calm_reports")
    .select("id, photo_path")
    .eq("agreement_id", agreement.id)
    .eq("sitter_id", user.id)
    .maybeSingle();

  const photo = formData.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;
  let photoPath = existingReport?.photo_path ?? null;
  let uploadedPhotoPath: string | null = null;
  const adminSupabase = createSupabaseAdminClient();

  if (hasPhoto) {
    const extension = reportPhotoExtension(photo.type);
    if (!extension) redirect("/sitter/dashboard?error=report_photo_type");
    if (photo.size > 5 * 1024 * 1024) redirect("/sitter/dashboard?error=report_photo_size");

    uploadedPhotoPath = `${user.id}/${agreement.id}/${crypto.randomUUID()}.${extension}`;
    const { error: photoError } = await adminSupabase.storage
      .from("calm-report-photos")
      .upload(uploadedPhotoPath, await photo.arrayBuffer(), { contentType: photo.type });

    if (photoError) redirect(`/sitter/dashboard?error=${encodeURIComponent("report_photo_upload")}`);
    photoPath = uploadedPhotoPath;
  }

  const { data: report, error } = await supabase
    .from("calm_reports")
    .upsert({
      agreement_id: agreement.id,
      request_id: agreement.request_id,
      owner_id: agreement.owner_id,
      sitter_id: user.id,
      pet_status: parsed.pet_status,
      feeding_status: parsed.feeding_status,
      walking_status: parsed.walking_status,
      home_check_status: parsed.home_check_status,
      note: parsed.note?.trim() ? parsed.note.trim() : null,
      photo_path: photoPath,
      submitted_at: new Date().toISOString()
    }, { onConflict: "agreement_id" })
    .select("id")
    .single();

  if (error || !report) {
    if (uploadedPhotoPath) await adminSupabase.storage.from("calm-report-photos").remove([uploadedPhotoPath]);
    redirect(`/sitter/dashboard?error=${encodeURIComponent("report_save")}`);
  }

  if (uploadedPhotoPath && existingReport?.photo_path) {
    await adminSupabase.storage.from("calm-report-photos").remove([existingReport.photo_path]);
  }

  await queueCalmReportSubmittedEmail(report.id);
  revalidatePath("/sitter/dashboard");
  revalidatePath(`/owner/requests/${agreement.request_id}`);
  revalidatePath("/admin/requests");
  redirect("/sitter/dashboard#calm-reports");
}

async function updateSitterRequestStatus(formData: FormData, status: "accepted" | "declined") {
  const { user } = await requireProfile(["sitter", "professional"]);
  const supabase = await createSupabaseServerClient();
  const { data: sitterRequest, error } = await supabase
    .from("sitter_requests")
    .update({ status, sitter_response: text(formData, "sitter_response") })
    .eq("id", String(formData.get("id")))
    .eq("sitter_id", user.id)
    .select("id")
    .single();
  if (error) redirect(`/sitter/dashboard?error=${encodeURIComponent(error.message)}`);
  if (sitterRequest) await queueSitterRequestResponseEmail(sitterRequest.id);
  revalidatePath("/sitter/dashboard");
  redirect("/sitter/dashboard");
}

export async function acceptSitterRequestAction(formData: FormData) {
  await updateSitterRequestStatus(formData, "accepted");
}

export async function declineSitterRequestAction(formData: FormData) {
  await updateSitterRequestStatus(formData, "declined");
}

export async function approveSitterAction(formData: FormData) {
  await requireProfile(["admin"]);
  const supabase = await createSupabaseServerClient();
  const userId = String(formData.get("user_id"));
  const approvalStatus = String(formData.get("approval_status")) as "approved" | "rejected" | "pending_approval";
  const { data: existing } = await supabase
    .from("sitter_profiles")
    .select("approval_status, bio, animal_experience, reference_contact, video_intro_url, phone_verified, reference_checked, video_intro_reviewed, bio_reviewed, experience_reviewed, risk_reviewed, risk_flags")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) redirect("/admin/sitters?error=missing_sitter");

  if (approvalStatus === "approved") {
    const review = getSitterQualityReview(existing);
    if (!review.readyToApprove) {
      redirect(`/admin/sitters?error=quality&missing=${encodeURIComponent(review.blockingItems.join(", "))}`);
    }
  }

  await supabase
    .from("sitter_profiles")
    .update({ approval_status: approvalStatus })
    .eq("user_id", userId);
  if (approvalStatus === "approved" && existing.approval_status !== "approved") await queueSitterApprovedEmail(userId);
  revalidatePath("/admin");
  revalidatePath("/admin/sitters");
  revalidatePath("/sitters");
}

export async function updateSitterTrustAction(formData: FormData) {
  await requireProfile(["admin"]);
  const supabase = await createSupabaseServerClient();
  const userId = z.string().uuid().parse(formData.get("user_id"));

  const { error } = await supabase
    .from("sitter_profiles")
    .update({
      phone_verified: bool(formData, "phone_verified"),
      reference_checked: bool(formData, "reference_checked"),
      video_intro_reviewed: bool(formData, "video_intro_reviewed"),
      bio_reviewed: bool(formData, "bio_reviewed"),
      experience_reviewed: bool(formData, "experience_reviewed"),
      risk_reviewed: bool(formData, "risk_reviewed"),
      risk_flags: values(formData, "risk_flags"),
      risk_notes: text(formData, "risk_notes"),
      is_featured: bool(formData, "is_featured"),
      admin_public_note: text(formData, "admin_public_note"),
      admin_private_note: text(formData, "admin_private_note")
    })
    .eq("user_id", userId);

  if (error) redirect(`/admin/sitters?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/admin");
  revalidatePath("/admin/sitters");
  revalidatePath("/sitters");
  revalidatePath(`/sitters/${userId}`);
}

export async function dispatchDueEmailNotificationsAction() {
  await requireProfile(["admin"]);
  await dispatchDueEmailNotifications();
  revalidatePath("/admin/notifications");
  redirect("/admin/notifications");
}
