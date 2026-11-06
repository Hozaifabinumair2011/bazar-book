import { Minus, Plus, Store, Trash2 } from "lucide-react";
import {
  formatDate,
  formatWeekday,
  orderValue,
  rupees,
  shopLabel,
  todayISO,
} from "@/lib/book";
import { useBook } from "@/lib/store";
import { Button, IconBtn } from "@/components/book/ui";
import { useMemo, useState } from "react";

export function Today({ onNew, onEdit }: { onNew: () => void; onEdit: (id: string) => void }) {
  const date = todayISO();
  const allOrders = useBook((s) => s.orders);
  const orders = useMemo(() => allOrders.filter((o) => o.date === date), [allOrders, date]);
  const visits = useBook((s) => s.visits[date] ?? 0);
  const setVisits = useBook((s) => s.setVisits);
  const deleteOrder = useBook((s) => s.deleteOrder);
  const hintDismissed = useBook((s) => s.hintDismissed);
  const dismissHint = useBook((s) => s.dismissHint);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const total = orders.reduce((sum, order) => sum + orderValue(order), 0);
  const shops = new Set(orders.map((o) => o.retailerId)).size;
  const pieces = orders.reduce((sum, order) => sum + order.lines.reduce((n, line) => n + line.qty, 0), 0);
  const sorted = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-line bg-card p-4">
        <p className="text-sm font-medium text-muted">
          {formatWeekday(date)} · {formatDate(date)}
        </p>
        <p className="mt-2 text-sm font-semibold text-amber">Today’s booking</p>
        <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-ink">{rupees(total)}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Shops with orders" value={String(shops)} />
          <Stat label="Pieces billed" value={String(pieces)} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-paper px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Visits today</p>
            <p className="text-xs text-muted">Every shop you called on, order or not</p>
          </div>
          <div className="flex items-center gap-2">
            <IconBtn label="Fewer visits" onClick={() => setVisits(date, visits - 1)}>
              <Minus className="size-4" />
            </IconBtn>
            <span className="w-8 text-center text-lg font-bold tabular-nums">{visits}</span>
            <IconBtn label="More visits" onClick={() => setVisits(date, visits + 1)}>
              <Plus className="size-4" />
            </IconBtn>
          </div>
        </div>
      </section>

      {!hintDismissed && (
        <section className="rounded-xl border border-line bg-teal-soft p-4 text-sm text-ink">
          <p className="font-semibold text-teal">Sample stock is loaded</p>
          <p className="mt-1 text-pretty">
            Noor Labs, Mehran Care, and Saheli Home are only a starting list. Replace them on the Stock tab with your companies, rates, and bonus schemes.
          </p>
          <button type="button" onClick={dismissHint} className="mt-2 min-h-11 text-sm font-semibold text-teal">
            Got it
          </button>
        </section>
      )}

      <Button className="w-full" onClick={onNew}>
        New order
      </Button>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted">Today’s orders</h2>
        {sorted.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-muted">
            No orders yet. Write the first shop order, then send the slip to distribution.
          </p>
        ) : (
          sorted.map((order) => (
            <article key={order.id} className="rounded-xl border border-line bg-card p-3">
              <button type="button" onClick={() => onEdit(order.id)} className="block w-full text-left">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">{order.retailerName}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
                      <Store className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {shopLabel(order.shopType)} · {order.address}
                      </span>
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-bold tabular-nums text-amber">{rupees(orderValue(order))}</p>
                </div>
                <p className="mt-2 text-sm text-muted">
                  {order.lines.length} items
                  {order.phone ? ` · ${order.phone}` : ""}
                </p>
              </button>
              {pendingDelete === order.id ? (
                <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
                  <p className="text-sm text-danger">Delete this order?</p>
                  <div className="flex gap-2">
                    <Button tone="ghost" className="min-h-11 px-3" onClick={() => setPendingDelete(null)}>
                      No
                    </Button>
                    <Button
                      tone="danger"
                      className="min-h-11 px-3"
                      onClick={() => {
                        deleteOrder(order.id);
                        setPendingDelete(null);
                      }}
                    >
                      Yes, delete
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPendingDelete(order.id)}
                  className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-danger"
                >
                  <Trash2 className="size-4" />
                  Delete
                </button>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-paper px-3 py-2">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
