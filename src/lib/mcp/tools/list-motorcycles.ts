import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_motorcycles",
  title: "List motorcycles",
  description: "List motorcycles in the ASTERNG fleet with plate number, model and assignment status.",
  inputSchema: {
    status: z.string().trim().optional().describe("Filter by motorcycle status, e.g. available or assigned."),
    search: z.string().trim().optional().describe("Match against plate number or model."),
    limit: z.number().int().min(1).max(100).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let query = supabaseForUser(ctx)
      .from("motorcycles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) query = query.eq("status", status);
    if (search) {
      const safe = search.replace(/[,()*%]/g, " ").trim();
      if (safe) query = query.or(`plate_number.ilike.%${safe}%,model.ilike.%${safe}%`);
    }
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data ?? []) }],
          structuredContent: { motorcycles: data ?? [] },
        };
  },
});
