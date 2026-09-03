import { initialsOf } from "@/shared/lib/helpers";
import { useTranslations } from "next-intl";
import { LabOrder } from "../types";
import { LabOrderCard } from "./LabOrderCard";

interface PatientLabGroupProps {
  // Bitta bemorga tegishli barcha lab buyurtmalari (turli laboratoriyalardan
  // bo'lishi mumkin). Bemor ismi bir marta, buyurtmalar esa pastda ro'yxat
  // qilib ko'rsatiladi — shuning uchun bitta bemor ro'yxatda ikki marta
  // chiqmaydi.
  orders: LabOrder[];
}

export function PatientLabGroup({ orders }: PatientLabGroupProps) {
  const t = useTranslations();

  // Faqat bitta buyurtma bo'lsa, guruh qobig'i shart emas — oddiy karta
  // yetarli (qo'shimcha ramka ikki marta chegara chizib qo'ymasligi uchun).
  if (orders.length === 1) {
    return <LabOrderCard order={orders[0]} />;
  }

  const patient = orders[0].patient;
  const initials = initialsOf(patient.first_name, patient.last_name);
  const totalActive = orders.reduce((sum, o) => sum + o.items.filter((i) => i.status === "PENDING" || i.status === "IN_PROGRESS").length, 0);

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden transition-colors hover:border-border-strong">
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-border bg-surface-secondary/40">
        <div className="relative w-11 h-11 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center text-xs font-bold text-primary shrink-0 tracking-wider select-none">
          {initials}
          {totalActive > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-warning text-white text-[10px] font-bold flex items-center justify-center border-2 border-surface">
              {totalActive}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text truncate">
            {patient.first_name} {patient.last_name}
          </p>
          <p className="text-xs text-text-muted truncate mt-0.5">
            {patient.phone_number}
            <span className="mx-2 opacity-40">·</span>
            {t("lab.multipleOrders", { count: orders.length })}
          </p>
        </div>
      </div>

      <div className="divide-y divide-border">
        {orders.map((order) => (
          <LabOrderCard key={order.id} order={order} hidePatientInfo />
        ))}
      </div>
    </div>
  );
}
