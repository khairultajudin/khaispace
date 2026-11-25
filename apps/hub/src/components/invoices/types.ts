export interface Customer {
  id: string;
  customer_name: string;
  company_name?: string;
  address?: string;
  phone?: string;
  email?: string;
  tin?: string; // LHDN Tax Identification Number (e.g. IG... / C...)
  brn?: string; // SSM / MyKad / Registration No.
  notes?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  payment_terms: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  tax_amount?: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  notes?: string;
  reference_no?: string;
  lhdn_classification?: string; // e.g. "022" (Others) or "004" (Consolidated)
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_order: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Quotation {
  id: string;
  quotation_number: string; // e.g. QT2611001
  customer_id: string;
  quotation_date: string;
  valid_until: string;
  status: "draft" | "sent" | "accepted" | "converted" | "expired";
  items: QuotationItem[];
  subtotal: number;
  discount_amount: number;
  tax_amount?: number;
  total_amount: number;
  notes?: string;
  converted_invoice_number?: string;
}

export interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: string;
  recipient_name: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  description?: string;
  receipt_file_id?: string;
  receipt_file_name?: string;
  receipt_file_type?: string;
  tax_deductible?: boolean;
}

export interface LhdnProfile {
  business_name: string;
  brn: string;
  tin: string;
  msic_code: string;
  msic_description: string;
  sst_registered: boolean;
  sst_number: string;
  address: string;
  city: string;
  postcode: string;
  state_code: string; // "07" = Pulau Pinang
  phone: string;
  email: string;
}

export interface InvoiceStore {
  customers: Customer[];
  invoices: Invoice[];
  items: InvoiceItem[];
  expenses: Expense[];
  quotations: Quotation[];
  lhdnProfile: LhdnProfile;
}

export const DEFAULT_LHDN_PROFILE: LhdnProfile = {
  business_name: "MK Venture Maker Solution",
  brn: "CA0356505-U",
  tin: "",
  msic_code: "62010",
  msic_description: "Computer programming, 3D printing & electronics prototyping services",
  sst_registered: false,
  sst_number: "NA",
  address: "Desa Cemara Blok B, Persiaran Sembilang",
  city: "Perai",
  postcode: "13700",
  state_code: "07",
  phone: "+60187604289",
  email: "mkventuremakersolution@gmail.com",
};

export function fmtRM(val: number): string {
  return `RM ${Number(val || 0).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function fmtDate(iso: string): string {
  if (!iso || !iso.includes("-")) return iso || "-";
  const [y, m, d] = iso.split("-");
  const mons = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d}-${mons[Math.max(0, parseInt(m, 10) - 1)] || m}-${y}`;
}

export function getReceiptNumber(invNo: string): string {
  return invNo.replace(/^INV/, "RCP");
}
