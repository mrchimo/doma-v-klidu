import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { EmailNotificationType } from "@/lib/types/database";

type NotificationInput = {
  recipientId: string;
  notificationType: EmailNotificationType;
  subject: string;
  body: string;
  actionPath?: string;
  scheduledFor?: string;
  relatedRequestId?: string;
  relatedSitterRequestId?: string;
  relatedAgreementId?: string;
  sendImmediately?: boolean;
};

type DispatchResult = {
  sent: number;
  failed: number;
  pending: number;
};

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function actionUrl(path?: string) {
  if (!path) return null;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function emailProviderConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function reminderDate(startDate?: string | null) {
  if (!startDate) return new Date().toISOString();
  const date = new Date(`${startDate}T08:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString();
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

async function resolveRecipientEmail(recipientId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: profile } = await supabase.from("profiles").select("email").eq("id", recipientId).maybeSingle();
  if (profile?.email) return profile.email;

  const { data } = await supabase.auth.admin.getUserById(recipientId);
  const email = data.user?.email ?? null;
  if (email) await supabase.from("profiles").update({ email }).eq("id", recipientId);
  return email;
}

function logNotificationError(scope: string, error: unknown) {
  console.error(`[email-notifications] ${scope}`, error);
}

async function sendEmail(to: string, subject: string, body: string, url?: string | null) {
  if (!emailProviderConfigured()) {
    return { status: "pending" as const, errorMessage: "Email provider is not configured. Set RESEND_API_KEY and EMAIL_FROM." };
  }

  const text = url ? `${body}\n\nOtevřít v aplikaci: ${url}` : body;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text
    })
  });

  const payload = await response.json().catch(() => null) as { id?: string; message?: string } | null;
  if (!response.ok) {
    return { status: "failed" as const, errorMessage: payload?.message ?? `Email provider returned ${response.status}` };
  }

  return { status: "sent" as const, providerMessageId: payload?.id ?? null };
}

export async function queueEmailNotification(input: NotificationInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const recipientEmail = await resolveRecipientEmail(input.recipientId);
    const scheduledFor = input.scheduledFor ?? new Date().toISOString();
    const isDue = new Date(scheduledFor).getTime() <= Date.now();
    const initialStatus = recipientEmail ? "pending" : "failed";
    const initialError = recipientEmail ? null : "Recipient email is missing.";

    const { data: notification } = await supabase
      .from("email_notifications")
      .insert({
        recipient_id: input.recipientId,
        recipient_email: recipientEmail,
        notification_type: input.notificationType,
        subject: input.subject,
        body: input.body,
        action_url: actionUrl(input.actionPath),
        status: initialStatus,
        scheduled_for: scheduledFor,
        error_message: initialError,
        related_request_id: input.relatedRequestId,
        related_sitter_request_id: input.relatedSitterRequestId,
        related_agreement_id: input.relatedAgreementId
      })
      .select("id, status")
      .single();

    if (notification?.id && notification.status === "pending" && isDue && input.sendImmediately !== false) {
      await dispatchEmailNotification(notification.id);
    }
  } catch (error) {
    logNotificationError("queueEmailNotification", error);
  }
}

export async function dispatchEmailNotification(notificationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data: notification } = await supabase
    .from("email_notifications")
    .select("*")
    .eq("id", notificationId)
    .eq("status", "pending")
    .maybeSingle();

  if (!notification) return;
  if (!notification.recipient_email) {
    await supabase
      .from("email_notifications")
      .update({ status: "failed", error_message: "Recipient email is missing." })
      .eq("id", notificationId);
    return;
  }

  const result = await sendEmail(notification.recipient_email, notification.subject, notification.body, notification.action_url);
  if (result.status === "pending") {
    await supabase
      .from("email_notifications")
      .update({ provider: "resend", error_message: result.errorMessage })
      .eq("id", notificationId);
    return;
  }

  await supabase
    .from("email_notifications")
    .update({
      status: result.status,
      provider: "resend",
      provider_message_id: result.providerMessageId ?? null,
      error_message: result.status === "failed" ? result.errorMessage : null,
      sent_at: result.status === "sent" ? new Date().toISOString() : null
    })
    .eq("id", notificationId);
}

export async function dispatchDueEmailNotifications(limit = 25): Promise<DispatchResult> {
  const supabase = createSupabaseAdminClient();
  const { data: notifications } = await supabase
    .from("email_notifications")
    .select("id")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  let sent = 0;
  let failed = 0;
  let pending = 0;

  for (const notification of notifications ?? []) {
    await dispatchEmailNotification(notification.id);
    const { data: updated } = await supabase.from("email_notifications").select("status").eq("id", notification.id).single();
    if (updated?.status === "sent") sent += 1;
    else if (updated?.status === "failed") failed += 1;
    else pending += 1;
  }

  return { sent, failed, pending };
}

export async function queueSitterRequestSentEmail(sitterRequestId: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("sitter_requests")
      .select("id, request_id, owner_id, sitter_id, message, request:house_sitting_requests(title, start_date, end_date), owner:profiles!sitter_requests_owner_id_fkey(full_name)")
      .eq("id", sitterRequestId)
      .single();

    if (!data) return;
    const request = one(data.request);
    const owner = one(data.owner);
    await queueEmailNotification({
      recipientId: data.sitter_id,
      notificationType: "sitter_request_sent",
      subject: `Nová žádost o hlídání: ${request?.title ?? "poptávka"}`,
      body: [
        `${owner?.full_name ?? "Majitel"} vám poslal žádost o hlídání.`,
        `Termín: ${request?.start_date ?? "neuvedeno"} - ${request?.end_date ?? "neuvedeno"}.`,
        data.message ? `Zpráva: ${data.message}` : null,
        "Odpovězte prosím přijetím nebo odmítnutím v aplikaci."
      ].filter(Boolean).join("\n"),
      actionPath: "/sitter/dashboard",
      relatedRequestId: data.request_id,
      relatedSitterRequestId: data.id
    });
  } catch (error) {
    logNotificationError("queueSitterRequestSentEmail", error);
  }
}

export async function queueSitterRequestResponseEmail(sitterRequestId: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("sitter_requests")
      .select("id, request_id, owner_id, sitter_id, status, sitter_response, request:house_sitting_requests(title), sitter:profiles!sitter_requests_sitter_id_fkey(full_name)")
      .eq("id", sitterRequestId)
      .single();

    if (!data) return;
    const request = one(data.request);
    const sitter = one(data.sitter);
    const statusLabel = data.status === "accepted" ? "přijal" : "odmítl";
    await queueEmailNotification({
      recipientId: data.owner_id,
      notificationType: "sitter_request_responded",
      subject: `Sitter ${statusLabel} žádost: ${request?.title ?? "poptávka"}`,
      body: [
        `${sitter?.full_name ?? "Sitter"} ${statusLabel} vaši žádost.`,
        data.sitter_response ? `Odpověď: ${data.sitter_response}` : null,
        data.status === "accepted" ? "V aplikaci můžete potvrdit konkrétní domluvu." : "Můžete oslovit jiného schváleného sittera."
      ].filter(Boolean).join("\n"),
      actionPath: `/owner/requests/${data.request_id}`,
      relatedRequestId: data.request_id,
      relatedSitterRequestId: data.id
    });
  } catch (error) {
    logNotificationError("queueSitterRequestResponseEmail", error);
  }
}

export async function queueSitterApprovedEmail(userId: string) {
  try {
    await queueEmailNotification({
      recipientId: userId,
      notificationType: "sitter_approved",
      subject: "Váš profil sittera je schválený",
      body: "Administrátor schválil váš sitter profil. Profil se může zobrazovat v adresáři schválených sitterů.",
      actionPath: "/sitter/dashboard"
    });
  } catch (error) {
    logNotificationError("queueSitterApprovedEmail", error);
  }
}

export async function queueSittingReminderEmail(agreementId: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("sitting_agreements")
      .select("id, request_id, owner_id, sitter_id, request:house_sitting_requests(title, start_date, end_date)")
      .eq("id", agreementId)
      .single();

    if (!data) return;
    const request = one(data.request);
    const scheduledFor = reminderDate(request?.start_date);
    const subject = `Připomenutí hlídání: ${request?.title ?? "domluvené hlídání"}`;
    await Promise.all([
      queueEmailNotification({
        recipientId: data.sitter_id,
        notificationType: "sitting_reminder",
        subject,
        body: [
          `Zítra začíná domluvené hlídání: ${request?.title ?? "domluvené hlídání"}.`,
          `Termín: ${request?.start_date ?? "neuvedeno"} - ${request?.end_date ?? "neuvedeno"}.`,
          "Zkontrolujte si předávací checklist a případné poznámky od majitele."
        ].join("\n"),
        actionPath: "/sitter/dashboard",
        scheduledFor,
        relatedRequestId: data.request_id,
        relatedAgreementId: data.id,
        sendImmediately: false
      }),
      queueEmailNotification({
        recipientId: data.owner_id,
        notificationType: "sitting_reminder",
        subject,
        body: [
          `Zítra začíná domluvené hlídání: ${request?.title ?? "domluvené hlídání"}.`,
          `Termín: ${request?.start_date ?? "neuvedeno"} - ${request?.end_date ?? "neuvedeno"}.`,
          "Zkontrolujte, že jsou připravené instrukce, přístup a nouzové kontakty."
        ].join("\n"),
        actionPath: `/owner/requests/${data.request_id}`,
        scheduledFor,
        relatedRequestId: data.request_id,
        relatedAgreementId: data.id,
        sendImmediately: false
      })
    ]);
  } catch (error) {
    logNotificationError("queueSittingReminderEmail", error);
  }
}

export async function queueCalmReportSubmittedEmail(reportId: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("calm_reports")
      .select("id, request_id, owner_id, pet_status, request:house_sitting_requests(title), sitter:profiles!calm_reports_sitter_id_fkey(full_name)")
      .eq("id", reportId)
      .single();

    if (!data) return;
    const request = one(data.request);
    const sitter = one(data.sitter);
    await queueEmailNotification({
      recipientId: data.owner_id,
      notificationType: "calm_report_submitted",
      subject: `Nový klidový report: ${request?.title ?? "hlídání"}`,
      body: [
        `${sitter?.full_name ?? "Sitter"} odeslal klidový report během hlídání.`,
        data.pet_status === "okay" ? "Mazlíček je podle reportu v pořádku." : "Report obsahuje bod, který vyžaduje vaši pozornost.",
        "Podrobnosti otevřete v aplikaci."
      ].join("\n"),
      actionPath: `/owner/requests/${data.request_id}#calm-report`,
      relatedRequestId: data.request_id
    });
  } catch (error) {
    logNotificationError("queueCalmReportSubmittedEmail", error);
  }
}
