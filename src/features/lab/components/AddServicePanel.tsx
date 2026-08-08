"use client";

import { Modal } from "@/components/design-system/Modal";
import { Combobox } from "@/components/ui/combobox";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useOrderActions } from "../hooks/useOrderActions";
import { Laboratory, LabOrder } from "../types";

interface AddServicePanelProps {
  order: LabOrder;
  laboratory?: Laboratory;
}

// Natija kiritish sahifasidan buyurtmaga qo'shimcha xizmat qo'shish paneli.
// Laboratoriyaning xizmatlari ro'yxatidan buyurtmaga hali qo'shilmaganlarini
// tanlab, to'lovli yoki bepul ekanini belgilab qo'shadi.
export function AddServicePanel({ order, laboratory }: AddServicePanelProps) {
  const t = useTranslations();
  const orderActions = useOrderActions(order);
  const [isOpen, setIsOpen] = useState(false);
  const [serviceId, setServiceId] = useState<string>("");
  const [isPaid, setIsPaid] = useState(true);

  const availableServices = useMemo(() => {
    const existingIds = new Set(order.items.filter((i) => i.status !== "CANCELLED").map((i) => i.serviceId));
    return (laboratory?.services ?? []).filter((s) => !existingIds.has(s.id));
  }, [laboratory, order.items]);

  const options = availableServices.map((s) => ({ value: s.id, label: s.name }));

  const close = () => {
    setIsOpen(false);
    setServiceId("");
    setIsPaid(true);
  };

  const handleSubmit = () => {
    if (!serviceId) return;
    orderActions.addItem.mutate(
      { serviceId, isPaid },
      { onSuccess: close },
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium border border-border rounded-lg px-3.5 py-2 text-text hover:bg-surface-hover transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {t("lab.addServiceButton")}
      </button>

      <Modal isOpen={isOpen} onClose={close} title={t("lab.addServiceButton")} size="sm">
        <div className="p-6 space-y-4">
          {options.length === 0 ? (
            <p className="text-sm text-text-muted">{t("lab.noAvailableServices")}</p>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text">{t("lab.service")}</label>
                <Combobox
                  options={options}
                  value={serviceId}
                  onChange={setServiceId}
                  placeholder={t("lab.selectServicePlaceholder")}
                  searchPlaceholder={t("lab.selectServicePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-text">{t("lab.paymentQuestion")}</p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaid(true)}
                    className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                      isPaid ? "border-primary bg-primary-50/40" : "border-border hover:bg-surface-hover"
                    }`}
                  >
                    <p className="text-xs font-semibold text-text">{t("lab.paidOption")}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{t("lab.paidHint")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaid(false)}
                    className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                      !isPaid ? "border-primary bg-primary-50/40" : "border-border hover:bg-surface-hover"
                    }`}
                  >
                    <p className="text-xs font-semibold text-text">{t("lab.freeOption")}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{t("lab.freeHint")}</p>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {options.length > 0 && (
          <div className="shrink-0 border-t border-border px-6 py-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className="text-sm font-medium border border-border rounded-lg px-3.5 py-2 text-text hover:bg-surface-hover transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!serviceId || orderActions.addItem.isPending}
              className="flex items-center gap-1.5 text-sm font-medium bg-primary text-white rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {orderActions.addItem.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("lab.addServiceButton")}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
