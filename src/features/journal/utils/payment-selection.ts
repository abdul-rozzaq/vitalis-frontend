import { Invoice, InvoiceItem } from "@/features/invoices/types";

export function journalItemDue(item: InvoiceItem) {
  return Math.max(0, Number(item.totalPrice) - Number(item.paidAmount ?? 0));
}

export function paymentGroupIds(invoice: Invoice, itemId: string) {
  const ids = new Set([itemId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const child of invoice.issuedInvoices ?? []) {
      if (child.status === "PAID" || child.status === "CANCELLED") continue;
      const linked = child.items.map(item => item.journalItemId).filter((id): id is string => Boolean(id));
      if (linked.some(id => ids.has(id))) {
        for (const id of linked) {
          if (!ids.has(id)) { ids.add(id); changed = true; }
        }
      }
    }
  }
  return [...ids];
}

export function journalSelectionDue(invoice: Invoice, itemIds: string[]) {
  const selected = new Set(itemIds);
  const unbilled = invoice.items.filter(item => selected.has(item.id)).reduce((sum, item) => sum + Number(item.remainingAmount ?? item.totalPrice), 0);
  const billed = (invoice.issuedInvoices ?? []).filter(child => child.status === "ISSUED" || child.status === "PARTIALLY_PAID").filter(child => child.items.some(item => item.journalItemId && selected.has(item.journalItemId))).reduce((sum, child) => sum + Number(child.totalAmount) - Number(child.paidCash) - Number(child.paidBonus), 0);
  return Math.max(0, unbilled + billed);
}
