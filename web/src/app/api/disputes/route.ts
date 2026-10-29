import { paypalFetch } from "@/lib/paypal";

export async function GET() {
  const r = await paypalFetch("/v1/customer/disputes?page_size=50");
  return Response.json(r.body, { status: r.ok ? 200 : r.status });
}