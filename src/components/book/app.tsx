import { useEffect, useState } from "react";
import { ClipboardList, NotebookPen, Package, Store } from "lucide-react";
import { OrderForm } from "@/components/book/order-form";
import { Slip } from "@/components/book/slip";
import { Stock } from "@/components/book/stock";
import { Today } from "@/components/book/today";
import { useBook } from "@/lib/store";

type Tab = "today" | "order" | "stock" | "slip";

const TABS: { id: Tab; label: string; icon: typeof Store }[] = [
  { id: "today", label: "Today", icon: Store },
  { id: "order", label: "Order", icon: ClipboardList },
  { id: "stock", label: "Stock", icon: Package },
  { id: "slip", label: "Slip", icon: NotebookPen },
];

function useHydrated(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const finish = () => setReady(true);
    const unsub = useBook.persist.onFinishHydration(finish);
    if (useBook.persist.hasHydrated()) finish();
    return unsub;
  }, []);
  return ready;
}

export function BookApp() {
  const ready = useHydrated();
  if (!ready) {
    return (
      <div className="min-h-dvh bg-paper px-4 py-6 text-ink">
        <p className="text-lg font-bold">Bazaar Book</p>
        <p className="mt-1 text-sm text-muted">Opening the book…</p>
      </div>
    );
  }
  return <Shell />;
}

function Shell() {
  const [tab, setTab] = useState<Tab>("today");
  const [editId, setEditId] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);

  function go(next: Tab) {
    setTab(next);
    window.scrollTo(0, 0);
  }

  function openNew() {
    setEditId(null);
    setNonce((n) => n + 1);
    go("order");
  }

  function openEdit(id: string) {
    setEditId(id);
    setNonce((n) => n + 1);
    go("order");
  }

  const subtitle =
    tab === "today" ? "Market order book" : tab === "order" ? "Shop order" : tab === "stock" ? "Rates and bonus" : "Distribution slip";

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <header className="no-print sticky top-0 z-20 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal text-card">
            <NotebookPen className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-base leading-tight font-bold">Bazaar Book</p>
            <p className="truncate text-xs text-muted">{subtitle}</p>
          </div>
        </div>
      </header>

      {savedFlash ? (
        <p className="no-print mx-auto max-w-lg px-4 pt-3 text-sm font-semibold text-teal">Order saved. Copy the slip and send it to distribution.</p>
      ) : null}

      <main className="mx-auto max-w-lg px-4 pt-4 pb-28">
        <div className={tab === "today" ? "" : "hidden"}>
          <Today onNew={openNew} onEdit={openEdit} />
        </div>
        <div className={tab === "order" ? "" : "hidden"}>
          <OrderForm
            editId={editId}
            nonce={nonce}
            onSaved={() => {
              setSavedFlash(true);
              go("today");
              window.setTimeout(() => setSavedFlash(false), 2500);
            }}
          />
        </div>
        <div className={tab === "stock" ? "" : "hidden"}>
          <Stock />
        </div>
        <div className={tab === "slip" ? "" : "hidden"}>
          <Slip />
        </div>
      </main>

      <nav className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card safe-bottom">
        <ul className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => go(item.id)}
                  className={`flex min-h-16 w-full flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                    active ? "text-teal" : "text-muted"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
