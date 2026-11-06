import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search } from "lucide-react";
import {
  CATEGORIES,
  SHOP_TYPES,
  bonusGap,
  categoryLabel,
  freeUnits,
  lineValue,
  norm,
  packText,
  rupees,
  schemeLabel,
  shopLabel,
  snapshotLine,
  todayISO,
  uid,
  type Category,
  type OrderLine,
  type Product,
  type Retailer,
  type ShopType,
} from "@/lib/book";
import { useBook, type NewOrder } from "@/lib/store";
import { Button, Chip, FieldLabel, IconBtn } from "@/components/book/ui";

type DraftRetailer = {
  id?: string;
  name: string;
  shopType: ShopType;
  address: string;
  phone: string;
};

const emptyRetailer = (): DraftRetailer => ({
  name: "",
  shopType: "general",
  address: "",
  phone: "",
});

export function OrderForm({
  editId,
  nonce,
  onSaved,
}: {
  editId: string | null;
  nonce: number;
  onSaved: () => void;
}) {
  const products = useBook((s) => s.products);
  const retailers = useBook((s) => s.retailers);
  const saveOrder = useBook((s) => s.saveOrder);

  const [date, setDate] = useState(todayISO);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [retailer, setRetailer] = useState<DraftRetailer | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftShop, setDraftShop] = useState<DraftRetailer>(emptyRetailer);
  const [shopQuery, setShopQuery] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (nonce === 0) return;
    setError("");
    setQuery("");
    setShopQuery("");
    setCategory("all");
    if (!editId) {
      setDate(todayISO());
      setOrderId(null);
      setRetailer(null);
      setCreating(false);
      setDraftShop(emptyRetailer());
      setLines([]);
      setNote("");
      return;
    }
    const order = useBook.getState().orders.find((o) => o.id === editId);
    if (!order) return;
    setDate(order.date);
    setOrderId(order.id);
    setRetailer({
      id: order.retailerId,
      name: order.retailerName,
      shopType: order.shopType,
      address: order.address,
      phone: order.phone,
    });
    setCreating(false);
    setLines(order.lines.map((line) => ({ ...line })));
    setNote(order.note);
  }, [nonce, editId]);

  const shopMatches = useMemo(() => {
    const q = norm(shopQuery);
    return retailers
      .filter((r) => !q || norm(`${r.name} ${r.address} ${r.phone}`).includes(q))
      .slice(0, 8);
  }, [retailers, shopQuery]);

  const visibleProducts = useMemo(() => {
    const q = norm(query);
    const inCart = new Set(lines.map((l) => l.productId));
    return products
      .filter((p) => (category === "all" ? true : p.category === category))
      .filter((p) => !q || norm(`${p.name} ${p.company} ${p.contents} ${p.packForm}`).includes(q))
      .sort((a, b) => Number(inCart.has(b.id)) - Number(inCart.has(a.id)) || a.company.localeCompare(b.company) || a.name.localeCompare(b.name));
  }, [products, query, category, lines]);

  const total = lines.reduce((sum, line) => sum + lineValue(line.qty, line.price), 0);

  function qtyOf(productId: string): number {
    return lines.find((l) => l.productId === productId)?.qty ?? 0;
  }

  function setQty(product: Product, qty: number) {
    setLines((current) => {
      const next = Math.max(0, Math.floor(qty));
      if (next === 0) return current.filter((l) => l.productId !== product.id);
      const existing = current.find((l) => l.productId === product.id);
      if (existing) return current.map((l) => (l.productId === product.id ? { ...l, qty: next } : l));
      return [...current, snapshotLine(product, next)];
    });
  }

  function chooseRetailer(shop: Retailer) {
    setRetailer(shop);
    setCreating(false);
    setError("");
  }

  function submit() {
    const shop = creating ? draftShop : retailer;
    if (!shop || !shop.name.trim()) {
      setError("Enter the shop name.");
      return;
    }
    if (!shop.address.trim()) {
      setError("Enter the shop address.");
      return;
    }
    const kept = lines.filter((l) => l.qty > 0);
    if (kept.length === 0) {
      setError("Add a quantity for at least one product.");
      return;
    }
    const payload: NewOrder = {
      id: orderId ?? undefined,
      date,
      retailer: {
        id: shop.id ?? uid(),
        name: shop.name.trim(),
        shopType: shop.shopType,
        address: shop.address.trim(),
        phone: shop.phone.trim(),
      },
      note,
      lines: kept,
    };
    saveOrder(payload);
    onSaved();
  }

  return (
    <div className="space-y-4 pb-28">
      <label className="block">
        <FieldLabel>Order date</FieldLabel>
        <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted">Shop</h2>
        {retailer && !creating ? (
          <div className="rounded-xl border border-teal bg-teal-soft p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{retailer.name}</p>
                <p className="text-sm text-muted">{shopLabel(retailer.shopType)}</p>
                <p className="text-sm">{retailer.address}</p>
                {retailer.phone ? <p className="text-sm tabular-nums text-muted">{retailer.phone}</p> : null}
              </div>
              <button
                type="button"
                className="min-h-11 shrink-0 text-sm font-semibold text-teal"
                onClick={() => {
                  setRetailer(null);
                  setCreating(false);
                }}
              >
                Change
              </button>
            </div>
          </div>
        ) : creating ? (
          <ShopFields
            value={draftShop}
            onChange={setDraftShop}
            onCancel={() => {
              setCreating(false);
              setDraftShop(emptyRetailer());
            }}
          />
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted" />
              <input
                className="field pl-9"
                placeholder="Search shops — name, address, phone"
                value={shopQuery}
                autoComplete="off"
                onChange={(e) => setShopQuery(e.target.value)}
              />
            </div>
            {shopMatches.length > 0 ? (
              <ul className="overflow-hidden rounded-xl border border-line bg-card">
                {shopMatches.map((shop) => (
                  <li key={shop.id} className="border-b border-line last:border-b-0">
                    <button type="button" onClick={() => chooseRetailer(shop)} className="block w-full px-3 py-3 text-left">
                      <p className="font-semibold">{shop.name}</p>
                      <p className="text-sm text-muted">
                        {shopLabel(shop.shopType)} · {shop.address}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No saved shop found.</p>
            )}
            <Button
              tone="line"
              className="w-full"
              onClick={() => {
                setCreating(true);
                setDraftShop({ ...emptyRetailer(), name: shopQuery.trim() });
              }}
            >
              Add a new shop
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted">Products</h2>
          {lines.length > 0 && (
            <p className="text-sm font-semibold tabular-nums text-amber">
              {lines.length} lines · {rupees(total)}
            </p>
          )}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted" />
          <input
            className="field pl-9"
            placeholder="Product, company, or contents"
            value={query}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            All
          </Chip>
          {CATEGORIES.map((item) => (
            <Chip key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>
              {item.label}
            </Chip>
          ))}
        </div>
        {visibleProducts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            This product is not in the list. Add it on the Stock tab.
          </p>
        ) : (
          <ul className="space-y-2">
            {visibleProducts.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                line={lines.find((l) => l.productId === product.id)}
                qty={qtyOf(product.id)}
                onQty={(n) => setQty(product, n)}
              />
            ))}
          </ul>
        )}
      </section>

      <label className="block">
        <FieldLabel>Note (optional)</FieldLabel>
        <input
          className="field"
          placeholder="Example: morning dispatch, credit"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}

      <div className="above-nav no-print fixed inset-x-0 z-20 border-t border-line bg-card px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">This order</p>
            <p className="truncate text-lg font-bold tabular-nums text-amber">{rupees(total)}</p>
          </div>
          <Button className="min-w-36" onClick={submit}>
            {orderId ? "Update order" : "Save order"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShopFields({
  value,
  onChange,
  onCancel,
}: {
  value: DraftRetailer;
  onChange: (next: DraftRetailer) => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-line bg-card p-3">
      <label className="block">
        <FieldLabel>Shop name</FieldLabel>
        <input
          className="field"
          value={value.name}
          autoComplete="off"
          placeholder="Kamran General Store"
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>
      <div>
        <FieldLabel>Shop type</FieldLabel>
        <div className="flex flex-wrap gap-2">
          {SHOP_TYPES.map((item) => (
            <Chip key={item.id} active={value.shopType === item.id} onClick={() => onChange({ ...value, shopType: item.id })}>
              {item.label}
            </Chip>
          ))}
        </div>
      </div>
      <label className="block">
        <FieldLabel>Address</FieldLabel>
        <input
          className="field"
          value={value.address}
          autoComplete="off"
          placeholder="Shop 14, Sarafa Bazar"
          onChange={(e) => onChange({ ...value, address: e.target.value })}
        />
      </label>
      <label className="block">
        <FieldLabel>Phone number</FieldLabel>
        <input
          className="field tabular-nums"
          inputMode="tel"
          value={value.phone}
          autoComplete="off"
          placeholder="0300-0000000"
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
        />
      </label>
      <button type="button" onClick={onCancel} className="min-h-11 text-sm font-semibold text-muted">
        Choose a saved shop
      </button>
    </div>
  );
}

function ProductRow({
  product,
  line,
  qty,
  onQty,
}: {
  product: Product;
  line?: OrderLine;
  qty: number;
  onQty: (n: number) => void;
}) {
  const shown = line ?? snapshotLine(product, qty);
  const free = freeUnits(qty, shown.bonusBuy, shown.bonusFree);
  const gap = bonusGap(qty, shown.bonusBuy, shown.bonusFree);
  const scheme = schemeLabel(shown.bonusBuy, shown.bonusFree);
  const stale = line && line.price !== product.price;

  return (
    <li className={`rounded-xl border bg-card p-3 ${qty > 0 ? "border-teal" : "border-line"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          {product.image ? (
            <img
              src={product.image}
              alt=""
              className="size-14 shrink-0 rounded-lg object-cover border border-line"
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-teal">{shown.company}</p>
            <p className="text-base font-semibold">{shown.name}</p>
            <p className="text-sm text-muted">
              {packText(shown)} · {categoryLabel(shown.category)}
            </p>
            <p className="text-sm text-pretty text-ink">{shown.contents}</p>
          </div>
        </div>
        <p className="shrink-0 text-right text-sm font-bold tabular-nums">
          {rupees(shown.price)}
          {stale ? <span className="mt-0.5 block text-xs font-medium text-muted">Old rate</span> : null}
        </p>
      </div>
      <p className="mt-1 text-xs font-semibold text-amber">{scheme ?? "No bonus on this product"}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <IconBtn label="Decrease quantity" onClick={() => onQty(qty - 1)} disabled={qty === 0}>
            <Minus className="size-4" />
          </IconBtn>
          <input
            aria-label={`${shown.name} quantity`}
            inputMode="numeric"
            className="w-14 border-0 bg-transparent text-center text-lg font-bold tabular-nums outline-none"
            value={qty === 0 ? "" : String(qty)}
            placeholder="0"
            onChange={(e) => onQty(Number(e.target.value.replace(/\D/g, "") || "0"))}
          />
          <IconBtn label="Increase quantity" onClick={() => onQty(qty + 1)}>
            <Plus className="size-4" />
          </IconBtn>
        </div>
        <p className="text-right text-sm font-bold tabular-nums">{qty > 0 ? rupees(lineValue(qty, shown.price)) : "—"}</p>
      </div>
      {qty > 0 && scheme ? (
        <p className="mt-1 text-sm text-muted">
          {free > 0 ? `Bonus ${free} free · send ${qty + free}` : "No bonus yet"}
          {gap && gap > 0 ? ` · ${gap} more for the next bonus` : ""}
        </p>
      ) : null}
    </li>
  );
}
