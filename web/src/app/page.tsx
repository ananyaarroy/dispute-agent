"use client";

import { useEffect, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry, type ColDef } from "ag-grid-community";
import type { TxRow } from "@/lib/transactions";

ModuleRegistry.registerModules([AllCommunityModule]);

const money = (p: { value?: number }) => (p.value == null ? "" : `$${p.value.toFixed(2)}`);

const columns: ColDef<TxRow>[] = [
  { field: "orderTag", headerName: "Order", width: 110 },
  { field: "date", headerName: "Date", width: 190, valueFormatter: (p) => (p.value ? new Date(p.value).toLocaleString() : "") },
  { field: "item", headerName: "Item", flex: 1, minWidth: 150 },
  { field: "amount", headerName: "Amount", width: 110, valueFormatter: money },
  { field: "fee", headerName: "Fee", width: 90, valueFormatter: money },
  { field: "status", headerName: "Status", width: 120 },
  { field: "shipTo", headerName: "Ship to", flex: 1, minWidth: 150 },
  { field: "shipAddress", headerName: "Address", flex: 2, minWidth: 220 },
  { field: "buyerEmail", headerName: "Buyer", flex: 1, minWidth: 220 },
  { field: "id", headerName: "Transaction ID", width: 190 },
];

export default function Home() {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [disputeCount, setDisputeCount] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/transactions")
      .then((r) => r.json())
      .then((d) => (d.rows ? setRows(d.rows) : setError(JSON.stringify(d).slice(0, 300))))
      .catch((e) => setError(String(e)));
    fetch("/api/disputes")
      .then((r) => r.json())
      .then((d) => setDisputeCount(d.items?.length ?? 0))
      .catch(() => setDisputeCount(null));
  }, []);

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold">Dispute Agent</h1>
      <p className="mb-4 text-sm text-gray-500">
        PayPal sandbox merchant: {rows.length} payments, {disputeCount ?? "?"} open disputes
      </p>
      {error && <p className="mb-3 rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div style={{ height: 520 }}>
        <AgGridReact<TxRow> rowData={rows} columnDefs={columns} />
      </div>
    </main>
  );
}