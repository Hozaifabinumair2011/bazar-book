import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Printer } from "lucide-react";
import {
  formatDate,
  formatWeekday,
  invoicesFor,
  packText,
  pickList,
  rupees,
  shiftDate,
  shopLabel,
  slipPlainText,
  todayISO,
} from "@/lib/book";
import { useBook } from "@/lib/store";
import { Button } from "@/components/book/ui";

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "true");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export function Slip() {
  const [date, setDate] = useState(todayISO);
  const [mode, setMode] = useState<"shops" | "warehouse">("shops");
  const [copied, setCopied] = useState(false);
  const allOrders = useBook((s) => s.orders);
  const orders = useMemo(() => allOrders.filter((o) => o.date === date), [allOrders, date]);
  const visits = useBook((s) => s.visits[date] ?? 0);
  const invoices = useMemo(() => invoicesFor(orders), [orders]);
  const picks = useMemo(() => pickList(invoices), [invoices]);
  const total = invoices.reduce((sum, inv) => sum + inv.value, 0);

  async function copySlip() {
    const text = slipPlainText(date, orders, visits);
    const ok = await writeClipboard(text);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous day" className="grid size-11 place-items-center rounded-full border border-line bg-card" onClick={() => setDate((d) => shiftDate(d, -1))}>
          <ChevronLeft className="size-5" />
        </button>
        <label className="min-w-0 flex-1 text-center">
          <span className="block text-sm font-semibold">{formatWeekday(date)}</span>
          <input className="field mt-1 text-center" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button type="button" aria-label="Next day" className="grid size-11 place-items-center rounded-full border border-line bg-card" onClick={() => setDate((d) => shiftDate(d, 1))}>
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="no-print grid grid-cols-2 gap-2">
        <Button tone={mode === "shops" ? "primary" : "line"} onClick={() => setMode("shops")}>
          By shop
        </Button>
        <Button tone={mode === "warehouse" ? "primary" : "line"} onClick={() => setMode("warehouse")}>
          Warehouse list
        </Button>
      </div>

      <div className="no-print grid grid-cols-2 gap-2">
        <Button tone="line" onClick={() => void copySlip()}>
          <Copy className="size-4" />
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button tone="line" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print
        </Button>
      </div>

      <article className="slip-sheet rounded-xl border border-line bg-card p-4">
        <header className="border-b border-line pb-3 text-center">
          <p className="text-xs font-semibold tracking-wide text-teal">Distribution order</p>
          <h2 className="text-xl font-bold">Bazaar Book</h2>
          <p className="text-sm text-muted">
            {formatWeekday(date)}, {formatDate(date)}
          </p>
        </header>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-paper px-3 py-2">
            <p className="text-xs text-muted">Shops</p>
            <p className="text-xl font-bold tabular-nums">{invoices.length}</p>
          </div>
          <div className="rounded-xl bg-amber-soft px-3 py-2">
            <p className="text-xs text-amber">Total booking</p>
            <p className="text-xl font-bold tabular-nums text-amber">{rupees(total)}</p>
          </div>
        </div>
        {visits > invoices.length ? (
          <p className="mt-2 text-center text-sm text-muted">
            Visits {visits} · Shops with orders {invoices.length}
          </p>
        ) : null}

        {invoices.length === 0 ? (
          <p className="px-2 py-8 text-center text-sm text-muted">No booking on this date.</p>
        ) : mode === "shops" ? (
          <div className="mt-4 space-y-4">
            {invoices.map((inv, index) => (
              <section key={inv.retailerId} className="border-t border-line pt-3">
                <p className="text-xs font-semibold text-muted">Shop {String(index + 1).padStart(2, "0")}</p>
                <h3 className="text-base font-bold">{inv.name}</h3>
                <p className="text-sm text-muted">{shopLabel(inv.shopType)}</p>
                <p className="text-sm">Address: {inv.address}</p>
                {inv.phone ? <p className="text-sm tabular-nums">Phone: {inv.phone}</p> : null}
                <ul className="mt-2 space-y-2">
                  {inv.lines.map((line) => (
                    <li key={`${line.productId}-${line.price}`} className="text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{line.name}</p>
                          <p className="text-muted">
                            {packText(line)} · {line.company}
                          </p>
                          <p className="text-muted">{line.contents}</p>
                          <p>
                            {line.qty} × {rupees(line.price)}
                            {line.free > 0 ? ` · bonus ${line.free} free` : ""}
                          </p>
                        </div>
                        <p className="shrink-0 font-semibold tabular-nums">{rupees(line.value)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                {inv.notes.length > 0 ? <p className="mt-2 text-sm">Note: {inv.notes.join(" · ")}</p> : null}
                <p className="mt-2 text-right text-sm font-bold tabular-nums text-amber">Order value {rupees(inv.value)}</p>
              </section>
            ))}
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {picks.map((pick) => (
              <li key={pick.key} className="border-t border-line pt-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{pick.name}</p>
                    <p className="text-muted">
                      {packText(pick)} · {pick.company}
                    </p>
                    <p>
                      Order {pick.qty}
                      {pick.free > 0 ? ` + bonus ${pick.free}` : ""} · Send {pick.qty + pick.free}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums">{rupees(pick.value)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}

        {invoices.length > 0 ? (
          <p className="mt-4 border-t border-line pt-3 text-right text-base font-bold tabular-nums">Total booking {rupees(total)}</p>
        ) : null}
      </article>
    </div>
  );
}
