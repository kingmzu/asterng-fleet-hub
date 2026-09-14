import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "fleet_summary",
  title: "Fleet summary",
  description: "Summarise the ASTERNG fleet: rider and motorcycle counts, outstanding balances, and remittance and expense totals for a recent period.",
  inputSchema: {
    days: z.number().int().min(1).max(365).default(30).describe("Number of past days to total remittances and expenses over."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ days }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);

    const [riders, bikes, remits, expenses] = await Promise.all([
      supabase.from("riders").select("status, outstanding_balance"),
      supabase.from("motorcycles").select("status"),
      supabase.from("remittances").select("amount").gte("remittance_date", since),
      supabase.from("expenses").select("amount").gte("expense_date", since),
    ]);

    const failure = [riders, bikes, remits, expenses].find((r) => r.error);
    if (failure?.error) return { content: [{ type: "text", text: failure.error.message }], isError: true };

    const count = (rows: { status?: string | null }[] | null) =>
      (rows ?? []).reduce<Record<string, number>>((acc, row) => {
        const key = row.status ?? "unknown";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
    const sum = (rows: { amount?: number | null }[] | null) =>
      (rows ?? []).reduce((total, row) => total + Number(row.amount ?? 0), 0);

    const totalRemitted = sum(remits.data as never);
    const totalExpenses = sum(expenses.data as never);
    const summary = {
      period_days: days,
      riders_total: riders.data?.length ?? 0,
      riders_by_status: count(riders.data as never),
      outstanding_balance_total: (riders.data ?? []).reduce(
        (t: number, r: { outstanding_balance?: number | null }) => t + Number(r.outstanding_balance ?? 0),
        0,
      ),
      motorcycles_total: bikes.data?.length ?? 0,
      motorcycles_by_status: count(bikes.data as never),
      remittances_total: totalRemitted,
      expenses_total: totalExpenses,
      net_profit: totalRemitted - totalExpenses,
      currency: "NGN",
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});
