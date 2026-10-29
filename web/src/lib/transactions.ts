/* eslint-disable @typescript-eslint/no-explicit-any */
export type TxRow = {
  id: string;
  date: string;
  item: string;
  amount: number;
  fee: number;
  status: string;
  orderTag: string;
  buyerName: string;
  buyerEmail: string;
  shipTo: string;
  shipAddress: string;
};

const STATUS: Record<string, string> = { S: "Completed", P: "Pending", D: "Denied", V: "Reversed", F: "Refunded" };

export function normalize(raw: any): TxRow[] {
  const details: any[] = raw?.transaction_details ?? [];
  return details
    .filter((d) => d.transaction_info?.transaction_event_code === "T0006")
    .map((d) => {
      const t = d.transaction_info ?? {};
      const p = d.payer_info ?? {};
      const s = d.shipping_info ?? {};
      const a = s.address ?? {};
      return {
        id: t.transaction_id,
        date: t.transaction_initiation_date,
        item: d.cart_info?.item_details?.[0]?.item_name ?? t.transaction_subject ?? "",
        amount: Number(t.transaction_amount?.value ?? 0),
        fee: Math.abs(Number(t.fee_amount?.value ?? 0)),
        status: STATUS[t.transaction_status] ?? t.transaction_status ?? "",
        orderTag: t.custom_field ?? "",
        buyerName: p.payer_name?.alternate_full_name ?? "",
        buyerEmail: p.email_address ?? "",
        shipTo: s.name ?? "",
        shipAddress: [a.line1, a.city, a.state, a.postal_code].filter(Boolean).join(", "),
      } as TxRow;
    })
    .sort((x, y) => (x.date < y.date ? 1 : -1));
}