import { NextResponse } from "next/server";
import { dispatchDueEmailNotifications } from "@/lib/email-notifications";

export async function POST(request: Request) {
  const secret = process.env.NOTIFICATION_DISPATCH_SECRET;
  if (!secret) return NextResponse.json({ error: "Notification dispatch secret is not configured." }, { status: 503 });

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await dispatchDueEmailNotifications();
  return NextResponse.json(result);
}
