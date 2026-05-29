import { dispatchDueEmailNotificationsAction } from "@/app/actions";
import { Badge, Card, Header, Shell } from "@/components/ui";
import { requireProfile } from "@/lib/auth";
import { formatDate } from "@/lib/labels";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const typeLabels: Record<string, string> = {
  sitter_request_sent: "Žádost sitterovi",
  sitter_request_responded: "Odpověď majiteli",
  sitter_approved: "Schválení sittera",
  sitting_reminder: "Připomenutí hlídání"
};

function statusTone(status: string) {
  if (status === "sent") return "green";
  if (status === "failed") return "red";
  return "amber";
}

export default async function AdminNotificationsPage() {
  const { profile } = await requireProfile(["admin"]);
  const supabase = await createSupabaseServerClient();
  const [{ data: notifications }, { count: pending }, { count: failed }] = await Promise.all([
    supabase
      .from("email_notifications")
      .select("*, recipient:profiles(full_name, role)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("email_notifications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("email_notifications").select("id", { count: "exact", head: true }).eq("status", "failed")
  ]);

  const providerConfigured = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

  return (
    <Shell>
      <Header role={profile.role} />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">E-mailové notifikace</h1>
          <p className="mt-2 text-stone-600">Outbox pro žádosti, odpovědi, schválení sitterů a připomenutí před hlídáním.</p>
        </div>
        <form action={dispatchDueEmailNotificationsAction}>
          <button className="min-h-11 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white">Odeslat čekající</button>
        </form>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card className="shadow-none"><p className="text-sm text-stone-600">Čekající</p><p className="mt-1 text-2xl font-bold">{pending ?? 0}</p></Card>
        <Card className="shadow-none"><p className="text-sm text-stone-600">Chyby</p><p className="mt-1 text-2xl font-bold">{failed ?? 0}</p></Card>
        <Card className="shadow-none"><p className="text-sm text-stone-600">Provider</p><p className="mt-1 text-lg font-bold">{providerConfigured ? "Nastavený" : "Nenastavený"}</p></Card>
      </div>

      {!providerConfigured ? (
        <Card className="mb-5 border-amber-200 bg-amber-50 shadow-none">
          <h2 className="font-semibold text-amber-950">E-mail provider není nastavený</h2>
          <p className="mt-1 text-sm text-stone-700">Notifikace se ukládají do outboxu. Pro skutečné odesílání doplňte `RESEND_API_KEY` a `EMAIL_FROM`.</p>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {notifications?.map((notification) => (
          <Card key={notification.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{notification.subject}</h2>
                  <Badge tone={statusTone(notification.status)}>{notification.status}</Badge>
                  <Badge tone="muted">{typeLabels[notification.notification_type] ?? notification.notification_type}</Badge>
                </div>
                <p className="mt-1 text-sm text-stone-600">
                  {notification.recipient?.full_name ?? "Bez jména"} · {notification.recipient_email ?? "bez e-mailu"}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-stone-700">{notification.body}</p>
                {notification.error_message ? <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-800">{notification.error_message}</p> : null}
              </div>
              <div className="text-sm text-stone-600 sm:text-right">
                <p>Naplánováno: {formatDate(notification.scheduled_for)}</p>
                <p>Odesláno: {notification.sent_at ? formatDate(notification.sent_at) : "ne"}</p>
              </div>
            </div>
          </Card>
        ))}
        {!notifications?.length ? <Card><p className="text-sm text-stone-600">Zatím nejsou vytvořené žádné e-mailové notifikace.</p></Card> : null}
      </div>
    </Shell>
  );
}
