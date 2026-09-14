import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listRidersTool from "./tools/list-riders";
import listMotorcyclesTool from "./tools/list-motorcycles";
import listRemittancesTool from "./tools/list-remittances";
import fleetSummaryTool from "./tools/fleet-summary";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "asterng",
  title: "AsterNG",
  version: "0.1.0",
  instructions:
    "Tools for the ASTERNG motorcycle fleet platform. Use `list_riders`, `list_motorcycles` and `list_remittances` to read fleet records, and `fleet_summary` for totals. Amounts are Nigerian Naira (NGN). Data visibility follows the signed-in user's role.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listRidersTool, listMotorcyclesTool, listRemittancesTool, fleetSummaryTool],
});
