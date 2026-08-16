/**
 * Auth compatibility layer.
 *
 * The MindFlov UI was originally written against a Firebase-style auth API.
 * This module exposes the same small surface, backed by Lovable Cloud auth,
 * so the app components stay unchanged while all accounts live in the
 * project's own backend.
 */
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
}

function toAppUser(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown>; email_confirmed_at?: string | null } | null): AppUser | null {
  if (!user) return null;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: (meta["full_name"] as string) ?? (meta["name"] as string) ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    isAnonymous: false,
  };
}

/** Kept for API shape parity with the previous implementation. */
export const auth = {
  currentUser: null as AppUser | null,
};

export function onAuthStateChanged(_auth: unknown, callback: (user: AppUser | null) => void) {
  supabase.auth.getSession().then(({ data }) => {
    auth.currentUser = toAppUser(data.session?.user ?? null);
    callback(auth.currentUser);
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    auth.currentUser = toAppUser(session?.user ?? null);
    callback(auth.currentUser);
  });

  return () => data.subscription.unsubscribe();
}

export async function signInWithEmailAndPassword(_auth: unknown, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw mapAuthError(error);
  return { user: toAppUser(data.user) };
}

export async function createUserWithEmailAndPassword(_auth: unknown, email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/` },
  });
  if (error) throw mapAuthError(error);
  return { user: toAppUser(data.user) };
}

export async function sendPasswordResetEmail(_auth: unknown, email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw mapAuthError(error);
}

export async function signOut(_auth?: unknown) {
  await supabase.auth.signOut();
  auth.currentUser = null;
}

/** Signature kept so existing call sites (`signInWithPopup(auth, provider)`) work. */
export class GoogleAuthProvider {
  readonly providerId = "google";
}

export async function signInWithPopup(_auth: unknown, _provider: GoogleAuthProvider) {
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
  if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
  return result;
}

/** Account deletion is handled server-side; see deleteAccount server function. */
export async function deleteUser(_user: unknown) {
  const { deleteAccount } = await import("@/lib/account.functions");
  await deleteAccount();
  await signOut();
}

function mapAuthError(error: { message: string }) {
  const message = error.message ?? "Authentication failed";
  const mapped = new Error(message) as Error & { code?: string };
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    mapped.code = "auth/email-already-in-use";
  } else if (lower.includes("invalid login credentials")) {
    mapped.code = "auth/invalid-credential";
  } else if (lower.includes("network")) {
    mapped.code = "auth/network-request-failed";
  }
  return mapped;
}
