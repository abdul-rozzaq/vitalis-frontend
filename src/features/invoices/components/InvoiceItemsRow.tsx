import { InvoiceItem } from "../types";
import { formatCurrency as fmt } from "@/shared/lib/formatters";

export function InvoiceItemsRow({ items }: { items: InvoiceItem[] }) {
  if (!items?.length) return <p className="text-xs text-text-muted italic">Satrlar yo'q</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1.5 px-2 text-text-muted font-medium">Tavsif</th>
            <th className="text-center py-1.5 px-2 text-text-muted font-medium">Son</th>
            <th className="text-right py-1.5 px-2 text-text-muted font-medium">Birlik narxi</th>
            <th className="text-right py-1.5 px-2 text-text-muted font-medium">Jami</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-border/40">
              <td className="py-1.5 px-2 text-text">{it.description}</td>
              <td className="py-1.5 px-2 text-center text-text-muted">{it.quantity}</td>
              <td className="py-1.5 px-2 text-right text-text-muted">{fmt(it.unitPrice)} UZS</td>
              <td className="py-1.5 px-2 text-right font-semibold text-text">{fmt(it.totalPrice)} UZS</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
