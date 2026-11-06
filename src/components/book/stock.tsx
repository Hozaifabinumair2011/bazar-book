import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  CATEGORIES,
  SHOP_TYPES,
  UNITS,
  categoryLabel,
  norm,
  packText,
  rupees,
  schemeLabel,
  shopLabel,
  uid,
  type Category,
  type Product,
  type Retailer,
  type ShopType,
  type Unit,
} from "@/lib/book";
import { useBook } from "@/lib/store";
import { Button, Chip, FieldLabel } from "@/components/book/ui";

export function Stock() {
  const products = useBook((s) => s.products);
  const retailers = useBook((s) => s.retailers);
  const saveProduct = useBook((s) => s.saveProduct);
  const deleteProduct = useBook((s) => s.deleteProduct);
  const saveRetailer = useBook((s) => s.saveRetailer);
  const deleteRetailer = useBook((s) => s.deleteRetailer);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [editor, setEditor] = useState<Product | "new" | null>(null);
  const [shopEditor, setShopEditor] = useState<Retailer | "new" | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [pane, setPane] = useState<"stock" | "shops">("stock");

  const visible = useMemo(() => {
    const q = norm(query);
    return products
      .filter((p) => (category === "all" ? true : p.category === category))
      .filter((p) => !q || norm(`${p.name} ${p.company} ${p.contents}`).includes(q))
      .sort((a, b) => a.category.localeCompare(b.category) || a.company.localeCompare(b.company) || a.name.localeCompare(b.name));
  }, [products, query, category]);

  const lastCompany = products.at(-1)?.company ?? "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Chip className="w-full" active={pane === "stock"} onClick={() => setPane("stock")}>
          Products and rates
        </Chip>
        <Chip className="w-full" active={pane === "shops"} onClick={() => setPane("shops")}>
          Saved shops
        </Chip>
      </div>

      {pane === "shops" ? (
        <div className="space-y-3">
          <Button className="w-full" onClick={() => setShopEditor("new")}>
            <Plus className="size-4" />
            New shop
          </Button>
          {retailers.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-muted">
              No shops saved yet. A new shop is also saved when you take an order.
            </p>
          ) : (
            <ul className="space-y-2">
              {retailers.map((shop) => (
                <li key={shop.id} className="rounded-xl border border-line bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{shop.name}</p>
                      <p className="text-sm text-muted">{shopLabel(shop.shopType)}</p>
                      <p className="text-sm">{shop.address}</p>
                      {shop.phone ? <p className="text-sm tabular-nums text-muted">{shop.phone}</p> : null}
                    </div>
                    <button
                      type="button"
                      aria-label="Edit shop"
                      className="grid size-11 place-items-center rounded-full border border-line"
                      onClick={() => setShopEditor(shop)}
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>
                  {pending === shop.id ? (
                    <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                      <span className="text-sm text-danger">Delete this shop?</span>
                      <div className="flex gap-2">
                        <Button tone="ghost" className="px-3" onClick={() => setPending(null)}>
                          No
                        </Button>
                        <Button
                          tone="danger"
                          className="px-3"
                          onClick={() => {
                            deleteRetailer(shop.id);
                            setPending(null);
                          }}
                        >
                          Yes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="mt-1 min-h-11 text-sm font-semibold text-danger" onClick={() => setPending(shop.id)}>
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <Button className="w-full" onClick={() => setEditor("new")}>
            <Plus className="size-4" />
            New product
          </Button>
          <div className="relative">
            <Search className="pointer-events-none absolute top-3.5 left-3 size-4 text-muted" />
            <input
              className="field pl-9"
              placeholder="Search product or company"
              value={query}
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
          {visible.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-card px-4 py-8 text-center text-sm text-muted">
              No products yet. Tap <strong>New product</strong> above — add name, Net rate, bonus (e.g. 10+1) and optionally a photo of the box.
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((product) => {
                const scheme = schemeLabel(product.bonusBuy, product.bonusFree);
                return (
                  <li key={product.id} className="rounded-xl border border-line bg-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 gap-3">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt=""
                            className="size-14 shrink-0 rounded-lg object-cover border border-line"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-teal">
                            {product.company} · {categoryLabel(product.category)}
                          </p>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-sm text-muted">{packText(product)}</p>
                          <p className="text-sm text-pretty">{product.contents}</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums">{rupees(product.price)}</p>
                          <p className="text-xs font-semibold text-amber">{scheme ?? "No bonus"}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Edit product"
                        className="grid size-11 shrink-0 place-items-center rounded-full border border-line"
                        onClick={() => setEditor(product)}
                      >
                        <Pencil className="size-4" />
                      </button>
                    </div>
                    {pending === product.id ? (
                      <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                        <span className="text-sm text-danger">Delete this product?</span>
                        <div className="flex gap-2">
                          <Button tone="ghost" className="px-3" onClick={() => setPending(null)}>
                            No
                          </Button>
                          <Button
                            tone="danger"
                            className="px-3"
                            onClick={() => {
                              deleteProduct(product.id);
                              setPending(null);
                            }}
                          >
                            Yes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="mt-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-danger"
                        onClick={() => setPending(product.id)}
                      >
                        <Trash2 className="size-4" />
                        Delete
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {editor ? (
        <ProductEditor
          initial={editor === "new" ? null : editor}
          defaultCompany={lastCompany}
          onClose={() => setEditor(null)}
          onSave={(product) => {
            saveProduct(product);
            setEditor(null);
          }}
        />
      ) : null}
      {shopEditor ? (
        <ShopEditor
          initial={shopEditor === "new" ? null : shopEditor}
          onClose={() => setShopEditor(null)}
          onSave={(shop) => {
            saveRetailer(shop);
            setShopEditor(null);
          }}
        />
      ) : null}
    </div>
  );
}

function resizeImage(file: File, maxSize = 400, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function ProductEditor({
  initial,
  defaultCompany,
  onClose,
  onSave,
}: {
  initial: Product | null;
  defaultCompany: string;
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const [company, setCompany] = useState(initial?.company ?? defaultCompany);
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "pharma");
  const [packQty, setPackQty] = useState(initial ? String(initial.packQty) : "");
  const [packUnit, setPackUnit] = useState<Unit>(initial?.packUnit ?? "ml");
  const [packForm, setPackForm] = useState(initial?.packForm ?? "");
  const [contents, setContents] = useState(initial?.contents ?? "");
  const [price, setPrice] = useState(initial ? String(initial.price) : "");
  const [bonusOn, setBonusOn] = useState(Boolean(initial?.bonusBuy && initial.bonusFree));
  const [bonusBuy, setBonusBuy] = useState(initial?.bonusBuy ? String(initial.bonusBuy) : "10");
  const [bonusFree, setBonusFree] = useState(initial?.bonusFree ? String(initial.bonusFree) : "1");
  const [image, setImage] = useState<string | null>(initial?.image ?? null);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState("");

  async function onPickImage(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a photo (JPG or PNG).");
      return;
    }
    setImageBusy(true);
    setError("");
    try {
      const dataUrl = await resizeImage(file);
      setImage(dataUrl);
    } catch {
      setError("Could not process the photo. Try another one.");
    } finally {
      setImageBusy(false);
    }
  }

  function submit() {
    const qty = Number(packQty);
    const rate = Number(price);
    const buy = Number(bonusBuy);
    const free = Number(bonusFree);
    if (!company.trim() || !name.trim()) {
      setError("Enter the company and the product name.");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Enter the pack size — for example 60 ml or 500 mg.");
      return;
    }
    if (!contents.trim()) {
      setError("Write what is inside the product.");
      return;
    }
    if (!Number.isFinite(rate) || rate < 0) {
      setError("Enter a valid rate.");
      return;
    }
    if (bonusOn && (!Number.isFinite(buy) || !Number.isFinite(free) || buy <= 0 || free <= 0)) {
      setError("Enter the buy quantity and the free quantity for the bonus.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      company: company.trim(),
      name: name.trim(),
      category,
      packQty: qty,
      packUnit,
      packForm: packForm.trim(),
      contents: contents.trim(),
      price: rate,
      bonusBuy: bonusOn ? buy : null,
      bonusFree: bonusOn ? free : null,
      image: image || null,
    });
  }

  return (
    <div className="no-print fixed inset-0 z-30 overflow-y-auto bg-paper">
      <div className="mx-auto max-w-lg px-4 pt-4 pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "Edit product" : "New product"}</h2>
          <button type="button" onClick={onClose} className="min-h-11 text-sm font-semibold text-muted">
            Close
          </button>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-line bg-card p-3">
            <FieldLabel>Product photo (optional)</FieldLabel>
            <div className="mt-2 flex items-center gap-3">
              {image ? (
                <img src={image} alt="" className="size-20 rounded-lg object-cover border border-line" />
              ) : (
                <div className="grid size-20 place-items-center rounded-lg border border-dashed border-line bg-paper text-xs text-muted">
                  No photo
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-line bg-paper px-3 text-sm font-semibold">
                  {imageBusy ? "Processing…" : image ? "Change photo" : "Add photo"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    disabled={imageBusy}
                    onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                  />
                </label>
                {image ? (
                  <button type="button" className="text-sm font-semibold text-danger" onClick={() => setImage(null)}>
                    Remove photo
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">Photo is saved on this phone only. Use a clear photo of the box.</p>
          </div>
          <label className="block">
            <FieldLabel>Company</FieldLabel>
            <input className="field" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Akron / Noor Labs" />
          </label>
          <label className="block">
            <FieldLabel>Product name</FieldLabel>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="MouthGel / Epidex" />
          </label>
          <div>
            <FieldLabel>Category</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <Chip key={item.id} active={category === item.id} onClick={() => setCategory(item.id)}>
                  {item.label}
                </Chip>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <FieldLabel>Pack size</FieldLabel>
              <input className="field tabular-nums" inputMode="decimal" value={packQty} onChange={(e) => setPackQty(e.target.value)} placeholder="60" />
            </label>
            <label className="block">
              <FieldLabel>Unit</FieldLabel>
              <select className="field" value={packUnit} onChange={(e) => setPackUnit(e.target.value as Unit)}>
                {UNITS.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <FieldLabel>Pack form</FieldLabel>
            <input className="field" value={packForm} onChange={(e) => setPackForm(e.target.value)} placeholder="bottle, strip, tube, cream" />
          </label>
          <label className="block">
            <FieldLabel>What’s inside</FieldLabel>
            <textarea
              className="field min-h-20"
              value={contents}
              onChange={(e) => setContents(e.target.value)}
              placeholder="Omeprazole 40mg / Drotaverine HCl"
            />
          </label>
          <label className="block">
            <FieldLabel>Order rate / Net (Rs)</FieldLabel>
            <input className="field tabular-nums" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="85" />
          </label>
          <div className="rounded-xl border border-line bg-card p-3">
            <label className="flex min-h-11 items-center justify-between gap-3">
              <span className="text-sm font-semibold">This product has a bonus</span>
              <input type="checkbox" className="size-5 accent-teal" checked={bonusOn} onChange={(e) => setBonusOn(e.target.checked)} />
            </label>
            {bonusOn ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block">
                  <FieldLabel>Buy</FieldLabel>
                  <input className="field tabular-nums" inputMode="numeric" value={bonusBuy} onChange={(e) => setBonusBuy(e.target.value)} />
                </label>
                <label className="block">
                  <FieldLabel>Free</FieldLabel>
                  <input className="field tabular-nums" inputMode="numeric" value={bonusFree} onChange={(e) => setBonusFree(e.target.value)} />
                </label>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted">Turn this off and the order shows the rate only, with no free pieces.</p>
            )}
          </div>
          {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
          <Button className="w-full" onClick={submit}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function ShopEditor({
  initial,
  onClose,
  onSave,
}: {
  initial: Retailer | null;
  onClose: () => void;
  onSave: (shop: Retailer) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [shopType, setShopType] = useState<ShopType>(initial?.shopType ?? "general");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [error, setError] = useState("");

  function submit() {
    if (!name.trim() || !address.trim()) {
      setError("Enter both the name and the address.");
      return;
    }
    onSave({
      id: initial?.id ?? uid(),
      name: name.trim(),
      shopType,
      address: address.trim(),
      phone: phone.trim(),
    });
  }

  return (
    <div className="no-print fixed inset-0 z-30 overflow-y-auto bg-paper">
      <div className="mx-auto max-w-lg space-y-3 px-4 pt-4 pb-10">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">{initial ? "Edit shop" : "New shop"}</h2>
          <button type="button" onClick={onClose} className="min-h-11 text-sm font-semibold text-muted">
            Close
          </button>
        </div>
        <label className="block">
          <FieldLabel>Name</FieldLabel>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div>
          <FieldLabel>किस्म</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {SHOP_TYPES.map((item) => (
              <Chip key={item.id} active={shopType === item.id} onClick={() => setShopType(item.id)}>
                {item.label}
              </Chip>
            ))}
          </div>
        </div>
        <label className="block">
          <FieldLabel>Address</FieldLabel>
          <input className="field" value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <label className="block">
          <FieldLabel>Phone</FieldLabel>
          <input className="field tabular-nums" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
        <Button className="w-full" onClick={submit}>
          सेव करें
        </Button>
      </div>
    </div>
  );
}
