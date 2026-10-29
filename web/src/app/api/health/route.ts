import { getAccessToken } from "@/lib/paypal";

export async function GET() {
  try {
    await getAccessToken();
    return Response.json({ ok: true, message: "PayPal sandbox auth works" });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}