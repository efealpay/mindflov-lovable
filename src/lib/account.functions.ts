import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes the signed-in user's account and all of their data. */
export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.from("mindmaps").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("usage_weekly").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("subscriptions").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", context.userId);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);

    return { success: true };
  });
