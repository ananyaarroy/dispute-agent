import fs from "node:fs";
import { randomUUID } from "node:crypto";

const BASE = "https://api-m.sandbox.paypal.com";
const FILE = new URL("./seeded-orders.json", import.meta.url);

const addr = (name, line, city, state, zip) => ({
  name, line, city, state, zip,
});

// A mix of normal orders and planted suspicious patterns for the agent to find.
const SCENARIOS = [
  { tag: "ORD-001", amount: "24.99", desc: "Wireless mouse", ship: addr("Jordan Lee", "410 Pine St", "San Jose", "CA", "95112") },
  { tag: "ORD-002", amount: "18.50", desc: "Notebook set", ship: addr("Sam Rivera", "75 Oak Ave", "Austin", "TX", "78701") },
  { tag: "ORD-003", amount: "199.00", desc: "Gift card bundle", ship: addr("Alex Morgan", "12 Elm Rd", "Denver", "CO", "80202") },
  { tag: "ORD-004", amount: "199.00", desc: "Gift card bundle", ship: addr("Chris Bell", "930 Lake Dr", "Miami", "FL", "33101") },
  { tag: "ORD-005", amount: "199.00", desc: "Gift card bundle", ship: addr("Dana Cruz", "58 Hill Ct", "Seattle", "WA", "98101") },
  { tag: "ORD-006", amount: "1450.00", desc: "Laptop 15-inch", ship: addr("Global Freight Hub", "8800 NW 25th St", "Doral", "FL", "33172") },
  { tag: "ORD-007", amount: "89.00", desc: "Headphones", ship: addr("Taylor Reed", "201 Bay St", "Boston", "MA", "02108") },
  { tag: "ORD-008", amount: "34.00", desc: "Desk lamp", ship: addr("Jordan Lee", "410 Pine St", "San Jose", "CA", "95112") },
];

async function getToken() {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Missing PayPal credentials in .env.local");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

const load = () => (fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : []);
const save = (data) => fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

async function create(n) {
  const token = await getToken();
  const orders = load();
  for (const s of SCENARIOS.slice(0, n)) {
    if (orders.some((o) => o.tag === s.tag)) continue;
    const res = await fetch(`${BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": randomUUID(),
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: s.tag,
            description: s.desc,
            amount: { currency_code: "USD", value: s.amount },
            shipping: {
              name: { full_name: s.ship.name },
              address: {
                address_line_1: s.ship.line,
                admin_area_2: s.ship.city,
                admin_area_1: s.ship.state,
                postal_code: s.ship.zip,
                country_code: "US",
              },
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: "https://example.com/return",
              cancel_url: "https://example.com/cancel",
              user_action: "PAY_NOW",
              shipping_preference: "SET_PROVIDED_ADDRESS",
            },
          },
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Failed:", s.tag, JSON.stringify(data));
      continue;
    }
    const link = data.links.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
    orders.push({ id: data.id, tag: s.tag, amount: s.amount, desc: s.desc, status: "CREATED" });
    console.log(`${s.tag}  $${s.amount}  ${s.desc}\n  ${link}\n`);
  }
  save(orders);
}

async function capture() {
  const token = await getToken();
  const orders = load();
  for (const o of orders) {
    if (o.status === "CAPTURED") continue;
    const res = await fetch(`${BASE}/v2/checkout/orders/${o.id}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": randomUUID(),
      },
      body: "{}",
    });
    const data = await res.json();
    if (res.ok && data.status === "COMPLETED") {
      o.status = "CAPTURED";
      o.captureId = data.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      console.log("Captured", o.tag, o.captureId);
    } else {
      console.log("Not captured", o.tag, data.details?.[0]?.issue ?? data.name ?? res.status);
    }
  }
  save(orders);
}

const cmd = process.argv[2];
if (cmd === "create") await create(Number(process.argv[3] ?? SCENARIOS.length));
else if (cmd === "capture") await capture();
else console.log("Usage: node --env-file=.env.local scripts/seed-orders.mjs create [count] | capture");