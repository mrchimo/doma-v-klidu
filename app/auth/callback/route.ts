import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dashboardForRole } from "@/lib/auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const supabase = await createSupabaseServerClient();

  if (code) await supabase.auth.exchangeCodeForSession(code);

  const { data } = await supabase.from("profiles").select("role").single();
  return NextResponse.redirect(new URL(dashboardForRole(data?.role ?? "owner"), request.url));
}
