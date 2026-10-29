import fs from "node:fs";

const BASE = "https://api-m.sandbox.paypal.com";
const orders = JSON.parse(fs.readFileSync(new URL("./seeded-orders.json", import.meta.url), "utf8"));

async function token() {
  const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET;
  const r = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  return (await r.json()).access_token;
}

const t = await token();
const H = { Authorization: `Bearer ${t}`, "Content-Type": "application/json" };

console.log("--- Existing disputes ---");
let r = await fetch(`${BASE}/v1/customer/disputes?page_size=10`, { headers: H });
console.log(r.status, (await r.text()).slice(0, 800));

const tag = process.argv[2] ?? "ORD-004";
const o = orders.find((x) => x.tag === tag);
if (!o?.captureId) throw new Error("No captured order " + tag);

console.log(`\n--- Trying to create a dispute on ${tag} (${o.captureId}) ---`);
r = await fetch(`${BASE}/v1/customer/disputes`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({
    disputed_transactions: [{ buyer_transaction_id: o.captureId }],
    reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    dispute_amount: { currency_code: "USD", value: o.amount },
    extensions: { merchant_contacted: false },
  }),
});
console.log(r.status, (await r.text()).slice(0, 1500));
