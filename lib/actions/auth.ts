"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  registerSchema,
  loginPhoneSchema,
  loginEmailSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  profileSetupSchema,
  toE164,
} from "@/lib/validations/auth";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

// (emptyActionState now lives in lib/action-state.ts — a "use server"
// file may only export async functions, and re-exporting a plain
// object here was invalid all along; it just hadn't been exercised by
// a build that traced this module from a new import site until now.)

function fieldErrorsFrom(issues: { path: (string | number)[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

// ── Registration: collects name/phone(/email), sends an OTP, and stores
// the metadata the 0002 migration's signup trigger reads to create the
// profiles row (full_name, role) the moment the OTP is verified.
export async function sendRegisterOtp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email") || "",
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: toE164(parsed.data.phone),
    options: {
      shouldCreateUser: true,
      data: {
        full_name: parsed.data.fullName,
        role: "customer",
        ...(parsed.data.email ? { email_hint: parsed.data.email } : {}),
      },
    },
  });
  if (error) {
    return { error: error.message };
  }

  redirect(`/verify?phone=${encodeURIComponent(parsed.data.phone)}&mode=register`);
}

// ── Login: same OTP channel, but refuses to silently create an account
// for a number that hasn't registered.
export async function sendLoginOtp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginPhoneSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: toE164(parsed.data.phone),
    options: { shouldCreateUser: false },
  });
  if (error) {
    return { error: "We couldn't find an account with that number." };
  }

  redirect(`/verify?phone=${encodeURIComponent(parsed.data.phone)}&mode=login`);
}

// Fire-and-return version for the "Resend code" button, which calls this
// directly (not via a <form action>) and shows its own inline status.
export async function resendOtp(localPhone: string): Promise<ActionState> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone: toE164(localPhone),
    options: { shouldCreateUser: false },
  });
  return error ? { error: error.message } : { success: true };
}

export async function verifyOtp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = verifyOtpSchema.safeParse({
    phone: formData.get("phone"),
    code: formData.get("code"),
  });
  if (!parsed.success) {
    return { error: "Enter the 6-digit code." };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({
    phone: toE164(parsed.data.phone),
    token: parsed.data.code,
    type: "sms",
  });
  if (error) {
    return { error: "That code didn't work. Check it and try again." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Something went wrong. Please try again." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, island_id, address")
    .eq("id", user.id)
    .single();

  if (profile?.role === "delivery_partner") {
    const { data: partner } = await supabase
      .from("delivery_partners")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    redirect(partner ? "/partner" : "/partner/onboarding");
  }

  if (!profile?.island_id || !profile?.address) {
    redirect("/profile-setup");
  }
  redirect("/home");
}

export async function loginWithEmail(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginEmailSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Incorrect email or password." };
  }
  redirect("/home");
}

export async function forgotPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
  });
  // Always report success even if the email doesn't exist, so the flow
  // can't be used to probe which addresses have accounts.
  if (error) {
    return { error: "Something went wrong. Please try again." };
  }
  return { success: true };
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: "This reset link has expired. Request a new one." };
  }
  redirect("/home");
}

export async function completeProfileSetup(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSetupSchema.safeParse({
    fullName: formData.get("fullName"),
    islandId: formData.get("islandId"),
    addressLine: formData.get("addressLine"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      island_id: parsed.data.islandId,
      address: parsed.data.addressLine,
    })
    .eq("id", user.id);
  if (profileError) {
    return { error: "Something went wrong. Please try again." };
  }

  const { error: addressError } = await supabase.from("addresses").insert({
    profile_id: user.id,
    label: "home",
    island_id: parsed.data.islandId,
    address_line: parsed.data.addressLine,
    is_default: true,
  });
  if (addressError) {
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/home");
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/welcome");
}
