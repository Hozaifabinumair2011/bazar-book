export type Category = "pharma" | "cosmetics" | "general";
export type Unit = "ml" | "mg" | "g" | "pcs";
export type ShopType = "medical" | "general" | "cosmetics" | "other";

export type Product = {
  id: string;
  company: string;
  name: string;
  category: Category;
  packQty: number;
  packUnit: Unit;
  packForm: string;
  contents: string;
  price: number;
  bonusBuy: number | null;
  bonusFree: number | null;
  /** Optional product photo as data URL (base64). Kept small for local storage. */
  image?: string | null;
};

export type Retailer = {
  id: string;
  name: string;
  shopType: ShopType;
  address: string;
  phone: string;
};

export type OrderLine = {
  productId: string;
  qty: number;
  name: string;
  company: string;
  category: Category;
  packQty: number;
  packUnit: Unit;
  packForm: string;
  contents: string;
  price: number;
  bonusBuy: number | null;
  bonusFree: number | null;
};

export type Order = {
  id: string;
  date: string;
  createdAt: string;
  retailerId: string;
  retailerName: string;
  shopType: ShopType;
  address: string;
  phone: string;
  note: string;
  lines: OrderLine[];
};

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "pharma", label: "Pharma" },
  { id: "cosmetics", label: "Cosmetics" },
  { id: "general", label: "General" },
];

export const UNITS: { id: Unit; label: string; short: string }[] = [
  { id: "ml", label: "ml", short: "ml" },
  { id: "mg", label: "mg", short: "mg" },
  { id: "g", label: "grams (g)", short: "g" },
  { id: "pcs", label: "pieces", short: "pcs" },
];

export const SHOP_TYPES: { id: ShopType; label: string }[] = [
  { id: "medical", label: "Medical store" },
  { id: "general", label: "General store" },
  { id: "cosmetics", label: "Cosmetics" },
  { id: "other", label: "Other" },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function uid(): string {
  return crypto.randomUUID();
}

export function todayISO(now = new Date()): string {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${z(now.getMonth() + 1)}-${z(now.getDate())}`;
}

export function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + days);
  return todayISO(dt);
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

export function formatWeekday(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
  return WEEKDAYS[dt.getDay()] ?? "";
}

export function rupees(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const digits = Number.isInteger(rounded) ? 0 : 2;
  return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(rounded)}`;
}

export function categoryLabel(id: Category): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function shopLabel(id: ShopType): string {
  return SHOP_TYPES.find((s) => s.id === id)?.label ?? id;
}

export function unitShort(id: Unit): string {
  return UNITS.find((u) => u.id === id)?.short ?? id;
}

export function packText(item: { packQty: number; packUnit: Unit; packForm: string }): string {
  const size = `${trimNum(item.packQty)} ${unitShort(item.packUnit)}`;
  const form = item.packForm.trim();
  return form ? `${size} · ${form}` : size;
}

function trimNum(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function freeUnits(qty: number, buy: number | null, free: number | null): number {
  if (!buy || !free || buy <= 0 || free <= 0 || qty <= 0) return 0;
  return Math.floor(qty / buy) * free;
}

/** How many more pieces to reach the next bonus slab. Null if no scheme. */
export function bonusGap(qty: number, buy: number | null, free: number | null): number | null {
  if (!buy || !free || buy <= 0 || free <= 0) return null;
  const rem = qty % buy;
  if (rem === 0 && qty > 0) return buy;
  return buy - rem;
}

export function schemeLabel(buy: number | null, free: number | null): string | null {
  if (!buy || !free || buy <= 0 || free <= 0) return null;
  return `${buy} buy + ${free} free`;
}

export function lineValue(qty: number, price: number): number {
  return qty * price;
}

export function orderValue(order: { lines: { qty: number; price: number }[] }): number {
  return order.lines.reduce((sum, line) => sum + lineValue(line.qty, line.price), 0);
}

export type InvoiceLine = OrderLine & { free: number; value: number };

export type Invoice = {
  retailerId: string;
  name: string;
  shopType: ShopType;
  address: string;
  phone: string;
  notes: string[];
  lines: InvoiceLine[];
  value: number;
};

export function invoicesFor(orders: Order[]): Invoice[] {
  const sorted = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const map = new Map<string, Invoice>();
  for (const order of sorted) {
    let invoice = map.get(order.retailerId);
    if (!invoice) {
      invoice = {
        retailerId: order.retailerId,
        name: order.retailerName,
        shopType: order.shopType,
        address: order.address,
        phone: order.phone,
        notes: [],
        lines: [],
        value: 0,
      };
      map.set(order.retailerId, invoice);
    } else {
      invoice.name = order.retailerName;
      invoice.shopType = order.shopType;
      invoice.address = order.address;
      invoice.phone = order.phone;
    }
    if (order.note.trim()) invoice.notes.push(order.note.trim());
    for (const line of order.lines) {
      const found = invoice.lines.find((l) => l.productId === line.productId && l.price === line.price);
      if (found) found.qty += line.qty;
      else invoice.lines.push({ ...line, free: 0, value: 0 });
    }
  }
  for (const invoice of map.values()) {
    invoice.lines = invoice.lines.map((line) => {
      const free = freeUnits(line.qty, line.bonusBuy, line.bonusFree);
      const value = lineValue(line.qty, line.price);
      return { ...line, free, value };
    });
    invoice.value = invoice.lines.reduce((sum, line) => sum + line.value, 0);
  }
  return [...map.values()];
}

export type PickLine = {
  key: string;
  name: string;
  company: string;
  packQty: number;
  packUnit: Unit;
  packForm: string;
  qty: number;
  free: number;
  value: number;
};

export function pickList(invoices: Invoice[]): PickLine[] {
  const map = new Map<string, PickLine>();
  for (const invoice of invoices) {
    for (const line of invoice.lines) {
      const key = `${line.productId}|${line.price}`;
      const found = map.get(key);
      if (found) {
        found.qty += line.qty;
        found.free += line.free;
        found.value += line.value;
      } else {
        map.set(key, {
          key,
          name: line.name,
          company: line.company,
          packQty: line.packQty,
          packUnit: line.packUnit,
          packForm: line.packForm,
          qty: line.qty,
          free: line.free,
          value: line.value,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.company.localeCompare(b.company) || a.name.localeCompare(b.name));
}

export function slipPlainText(date: string, orders: Order[], visits: number): string {
  const invoices = invoicesFor(orders);
  const picks = pickList(invoices);
  const total = invoices.reduce((sum, inv) => sum + inv.value, 0);
  const lines: string[] = [
    "Bazaar Book — distribution order",
    `${formatWeekday(date)}, ${formatDate(date)}`,
    `Shops: ${invoices.length}`,
  ];
  if (visits > invoices.length) lines.push(`Visits: ${visits} · Orders: ${invoices.length}`);
  lines.push(`Total booking: ${rupees(total)}`, "");
  invoices.forEach((inv, i) => {
    lines.push(`${i + 1}. ${inv.name}`);
    lines.push(shopLabel(inv.shopType));
    lines.push(`Address: ${inv.address}`);
    if (inv.phone.trim()) lines.push(`Phone: ${inv.phone.trim()}`);
    for (const line of inv.lines) {
      const bonus = line.free > 0 ? ` + bonus ${line.free}` : "";
      lines.push(`• ${line.name} ${packText(line)} — ${line.qty}${bonus} × ${rupees(line.price)} = ${rupees(line.value)}`);
      lines.push(`  Company: ${line.company}`);
    }
    if (inv.notes.length) lines.push(`Note: ${inv.notes.join(" · ")}`);
    lines.push(`Order value: ${rupees(inv.value)}`, "");
  });
  lines.push("—— Stock total (warehouse) ——");
  if (picks.length === 0) lines.push("No items");
  for (const pick of picks) {
    const bonus = pick.free > 0 ? ` + bonus ${pick.free}` : "";
    lines.push(`• ${pick.name} ${packText(pick)} — ${pick.qty}${bonus} = ${pick.qty + pick.free} pcs · ${rupees(pick.value)}`);
  }
  lines.push("", `Total booking: ${rupees(total)}`);
  return lines.join("\n");
}

export function snapshotLine(product: Product, qty: number): OrderLine {
  return {
    productId: product.id,
    qty,
    name: product.name,
    company: product.company,
    category: product.category,
    packQty: product.packQty,
    packUnit: product.packUnit,
    packForm: product.packForm,
    contents: product.contents,
    price: product.price,
    bonusBuy: product.bonusBuy,
    bonusFree: product.bonusFree,
  };
}

export const SEED_PRODUCTS: Product[] = [];

export const SEED_RETAILERS: Retailer[] = [];

export function norm(value: string): string {
  return value.trim().toLowerCase();
}
