import { paypalFetch } from "@/lib/paypal";
import { normalize } from "@/lib/transactions";

export async function GET(req: Request) {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const q = new URLSearchParams({
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    fields: "all",
    page_size: "100",
  });
  const r = await paypalFetch(`/v1/reporting/transactions?${q}`);
  if (!r.ok) return Response.json(r.body, { status: r.status });
  const raw = new URL(req.url).searchParams.get("raw");
  return Response.json(raw ? r.body : { rows: normalize(r.body) });
}