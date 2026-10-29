const BASE = "https://api-m.sandbox.paypal.com";
const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET;
const tr = await fetch(`${BASE}/v1/oauth2/token`, {
  method: "POST",
  headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
  body: "grant_type=client_credentials",
});
const H = { Authorization: `Bearer ${(await tr.json()).access_token}`, "Content-Type": "application/json" };

const list = await (await fetch(`${BASE}/v1/customer/disputes?page_size=20`, { headers: H })).json();
console.log(`Found ${list.items?.length ?? 0} disputes\n`);
for (const it of list.items ?? []) {
  const d = await (await fetch(`${BASE}/v1/customer/disputes/${it.dispute_id}`, { headers: H })).json();
  console.log("ID:", d.dispute_id);
  console.log("Reason:", d.reason, "| Stage:", d.dispute_life_cycle_stage, "| Status:", d.status);
  console.log("Amount:", d.dispute_amount?.value, "| Due:", d.seller_response_due_date);
  console.log("Buyer txn:", d.disputed_transactions?.[0]?.buyer_transaction_id, "| Seller txn:", d.disputed_transactions?.[0]?.seller_transaction_id);
  console.log("Allowed seller responses:", JSON.stringify(d.allowed_response_options?.seller ?? d.allowed_response_options ?? "none"));
  console.log("Messages:", JSON.stringify((d.messages ?? []).map((m) => ({ by: m.posted_by, text: String(m.content).slice(0, 120) }))));
  console.log("---");
}