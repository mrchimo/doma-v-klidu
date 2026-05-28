import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return { user, profile };
}

export async function requireProfile(roles?: string[]) {
  const { user, profile } = await getCurrentProfile();
  if (!user || !profile) redirect("/sign-in");
  if (roles && !roles.includes(profile.role)) redirect("/");
  return { user, profile };
}

export function dashboardForRole(role: string) {
  if (role === "owner") return "/owner/dashboard";
  if (role === "admin") return "/admin";
  return "/sitter/dashboard";
}
