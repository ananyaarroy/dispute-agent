import { paypalFetch } from "@/lib/paypal";

export async function GET() {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const q = new URLSearchParams({
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    fields: "all",
    page_size: "100",
  });
  const r = await paypalFetch(`/v1/reporting/transactions?${q}`);
  return Response.json(r.body, { status: r.ok ? 200 : r.status });
}