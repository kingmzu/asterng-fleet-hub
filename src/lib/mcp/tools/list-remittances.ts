import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_remittances",
  title: "List remittances",
  description: "List recent rider remittance payments, optionally filtered by status or date range.",
  inputSchema: {
    status: z.string().trim().optional().describe("Filter by remittance status, e.g. paid, pending or overdue."),
    from_date: z.string().trim().optional().describe("Earliest remittance date (YYYY-MM-DD)."),
    to_date: z.string().trim().optional().describe("Latest remittance date (YYYY-MM-DD)."),
    limit: z.number().int().min(1).max(100).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, from_date, to_date, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let query = supabaseForUser(ctx)
      .from("remittances")
      .select("*")
      .order("remittance_date", { ascending: false })
      .limit(limit);
    if (status) query = query.eq("status", status);
    if (from_date) query = query.gte("remittance_date", from_date);
    if (to_date) query = query.lte("remittance_date", to_date);
    const { data, error } = await query;
    return error
      ? { content: [{ type: "text", text: error.message }], isError: true }
      : {
          content: [{ type: "text", text: JSON.stringify(data ?? []) }],
          structuredContent: { remittances: data ?? [] },
        };
  },
});
