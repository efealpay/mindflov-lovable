/**
 * Document-store compatibility layer.
 *
 * The MindFlov UI was written against a Firestore-style document API. This
 * module keeps that call shape but stores everything in the project's own
 * Postgres database (Lovable Cloud) with row-level security, so each account
 * can only reach its own rows.
 *
 * Path mapping:
 *   config/global                                  -> app_config
 *   users/{uid}                                    -> profiles
 *   users/{uid}/usage/{weekKey}                    -> usage_weekly
 *   artifacts/{appId}/users/{uid}/mindmaps[/{id}]  -> mindmaps
 */
import { supabase } from "@/integrations/supabase/client";

export interface DocRef {
  kind: "doc";
  segments: string[];
}
export interface CollectionRef {
  kind: "collection";
  segments: string[];
}

export interface DocSnapshot {
  id: string;
  exists: () => boolean;
  data: () => Record<string, any>;
}

export function getFirestore(..._args: unknown[]) {
  return {} as const;
}

export function doc(_db: unknown, ...segments: string[]): DocRef {
  return { kind: "doc", segments };
}

export function collection(_db: unknown, ...segments: string[]): CollectionRef {
  return { kind: "collection", segments };
}

/* ---------- profile field mapping ---------- */

const PROFILE_TO_COLUMN: Record<string, string> = {
  email: "email",
  displayName: "display_name",
  subscriptionTier: "subscription_tier",
  tokensUsed: "tokens_used",
  lastTokenReset: "last_token_reset",
  subscriptionStart: "subscription_start",
  licenseKey: "license_key",
};

function profileToRow(data: Record<string, any>) {
  const row: Record<string, any> = {};
  for (const [key, column] of Object.entries(PROFILE_TO_COLUMN)) {
    if (key in data) row[column] = data[key];
  }
  return row;
}

function rowToProfile(row: Record<string, any>) {
  return {
    id: row["id"],
    email: row["email"],
    displayName: row["display_name"],
    subscriptionTier: row["subscription_tier"] ?? "free",
    tokensUsed: Number(row["tokens_used"] ?? 0),
    lastTokenReset: row["last_token_reset"] ? Number(row["last_token_reset"]) : null,
    subscriptionStart: row["subscription_start"] ? Number(row["subscription_start"]) : null,
    licenseKey: row["license_key"],
    createdAt: row["created_at"] ? new Date(row["created_at"]).getTime() : null,
  };
}

function rowToMindmap(row: Record<string, any>) {
  return {
    id: row["map_key"],
    title: row["title"],
    nodes: row["nodes"] ?? [],
    links: row["links"] ?? [],
    globalRole: row["global_role"] ?? "default",
    globalPrimer: row["global_primer"] ?? "",
    hasShownPrimer: row["has_shown_primer"] ?? false,
    userId: row["user_id"],
    createdAt: row["created_at"] ? new Date(row["created_at"]).getTime() : null,
    updatedAt: row["updated_at"] ? new Date(row["updated_at"]).getTime() : null,
  };
}

function snapshot(id: string, data: Record<string, any> | null): DocSnapshot {
  return {
    id,
    exists: () => data !== null,
    data: () => data ?? {},
  };
}

function describe(ref: DocRef | CollectionRef) {
  const s = ref.segments;
  if (s[0] === "config") return { type: "config" as const, key: s[1] ?? "global" };
  if (s[0] === "users" && s[2] === "usage") return { type: "usage" as const, uid: s[1]!, weekKey: s[3]! };
  if (s[0] === "users" && s.length >= 2) return { type: "profile" as const, uid: s[1]! };
  if (s[0] === "users") return { type: "profiles" as const };
  if (s[0] === "artifacts" && s[4] === "mindmaps") {
    return { type: "mindmap" as const, uid: s[3]!, mapKey: s[5] };
  }
  return { type: "unsupported" as const };
}

/* ---------- reads ---------- */

export async function getDoc(ref: DocRef): Promise<DocSnapshot> {
  const target = describe(ref);
  const id = ref.segments[ref.segments.length - 1]!;

  if (target.type === "config") {
    const { data } = await supabase.from("app_config").select("value").eq("key", target.key).maybeSingle();
    return snapshot(id, (data?.value as Record<string, any>) ?? null);
  }

  if (target.type === "profile") {
    const { data } = await supabase.from("profiles").select("*").eq("id", target.uid).maybeSingle();
    return snapshot(id, data ? rowToProfile(data) : null);
  }

  if (target.type === "usage") {
    const { data } = await supabase
      .from("usage_weekly")
      .select("count")
      .eq("user_id", target.uid)
      .eq("week_key", target.weekKey)
      .maybeSingle();
    return snapshot(id, data ? { count: data.count } : null);
  }

  if (target.type === "mindmap" && target.mapKey) {
    const { data } = await supabase
      .from("mindmaps")
      .select("*")
      .eq("user_id", target.uid)
      .eq("map_key", target.mapKey)
      .maybeSingle();
    return snapshot(id, data ? rowToMindmap(data) : null);
  }

  return snapshot(id, null);
}

export async function getDocs(ref: CollectionRef) {
  const target = describe(ref);
  let docs: DocSnapshot[] = [];

  if (target.type === "mindmap") {
    const { data } = await supabase
      .from("mindmaps")
      .select("*")
      .eq("user_id", target.uid)
      .order("updated_at", { ascending: false });
    docs = (data ?? []).map((row) => snapshot(row.map_key, rowToMindmap(row)));
  } else if (target.type === "profiles" || target.type === "profile") {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    docs = (data ?? []).map((row) => snapshot(row.id, rowToProfile(row)));
  }

  return {
    docs,
    size: docs.length,
    empty: docs.length === 0,
    forEach: (fn: (doc: DocSnapshot) => void) => docs.forEach(fn),
  };
}

/* ---------- writes ---------- */

export async function setDoc(ref: DocRef, data: Record<string, any>, options?: { merge?: boolean }) {
  const target = describe(ref);
  const merge = options?.merge ?? false;

  if (target.type === "config") {
    const { error } = await supabase
      .from("app_config")
      .upsert({ key: target.key, value: data }, { onConflict: "key" });
    if (error) throw error;
    return;
  }

  if (target.type === "profile") {
    const row = profileToRow(data);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: target.uid, ...row }, { onConflict: "id" });
    if (error) throw error;
    return;
  }

  if (target.type === "usage") {
    const { error } = await supabase
      .from("usage_weekly")
      .upsert(
        { user_id: target.uid, week_key: target.weekKey, count: Number(data["count"] ?? 0) },
        { onConflict: "user_id,week_key" },
      );
    if (error) throw error;
    return;
  }

  if (target.type === "mindmap" && target.mapKey) {
    const row: Record<string, any> = {
      user_id: target.uid,
      map_key: target.mapKey,
      updated_at: new Date().toISOString(),
    };
    if ("title" in data) row["title"] = data["title"] ?? "Draft Concept";
    if ("nodes" in data) row["nodes"] = data["nodes"] ?? [];
    if ("links" in data) row["links"] = data["links"] ?? [];
    if ("globalRole" in data) row["global_role"] = data["globalRole"] ?? "default";
    if ("globalPrimer" in data) row["global_primer"] = data["globalPrimer"] ?? "";
    if ("hasShownPrimer" in data) row["has_shown_primer"] = Boolean(data["hasShownPrimer"]);

    if (merge) {
      const { error } = await supabase
        .from("mindmaps")
        .update(row as never)
        .eq("user_id", target.uid)
        .eq("map_key", target.mapKey);
      if (error) throw error;
      return;
    }

    const { error } = await supabase
      .from("mindmaps")
      .upsert(row as never, { onConflict: "user_id,map_key" });
    if (error) throw error;
    return;
  }
}

export async function updateDoc(ref: DocRef, data: Record<string, any>) {
  return setDoc(ref, data, { merge: true });
}

export async function deleteDoc(ref: DocRef) {
  const target = describe(ref);

  if (target.type === "mindmap" && target.mapKey) {
    const { error } = await supabase
      .from("mindmaps")
      .delete()
      .eq("user_id", target.uid)
      .eq("map_key", target.mapKey);
    if (error) throw error;
    return;
  }

  if (target.type === "profile") {
    const { error } = await supabase.from("profiles").delete().eq("id", target.uid);
    if (error) throw error;
  }
}

/* ---------- realtime ---------- */

export function onSnapshot(ref: DocRef, callback: (snap: DocSnapshot) => void) {
  const target = describe(ref);
  const id = ref.segments[ref.segments.length - 1]!;

  if (target.type !== "profile") {
    getDoc(ref).then(callback).catch(console.error);
    return () => {};
  }

  getDoc(ref).then(callback).catch(console.error);

  const channel = supabase
    .channel(`profile-${target.uid}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profiles", filter: `id=eq.${target.uid}` },
      (payload) => {
        const row = payload.new as Record<string, any> | null;
        callback(snapshot(id, row && Object.keys(row).length > 0 ? rowToProfile(row) : null));
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
