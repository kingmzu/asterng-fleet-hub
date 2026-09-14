import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_riders",
  title: "List riders",
  description: "List riders in the ASTERNG fleet, optionally filtered by status or a name/phone search.",
  inputSchema: {
    status: z.enum(["active", "inactive", "suspended", "all"]).default("all").describe("Filter by rider status."),
    search: z.string().trim().optional().describe("Match against rider name or phone number."),
    limit: z.number().int().min(1).max(100).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let query = supabaseForUser(ctx)
      .from("riders")
      .select("id, full_name, phone_number, status, outstanding_balance, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status && status !== "all") query = query.eq("status", status);
    if (search) {
      const safe = search.replace(/[,()*%]/g, " ").trim();
      if (safe) query = query.or(`full_name.ilike.%${safe}%,phone_number.ilike.%${safe}%`);
    }
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data ?? []) }],
          structuredContent: { riders: data ?? [] },
        };
  },
});
