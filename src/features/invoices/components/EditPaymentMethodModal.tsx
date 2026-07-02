"use client";

import { Modal } from "@/components/design-system/Modal";
import { PaymentMethod, PAYMENT_METHOD_LABELS } from "@/features/invoices/types";
import { api } from "@/shared/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface EditPaymentMethodModalProps {
  paymentId: string;
  currentMethod: PaymentMethod | null | undefined;
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "TRANSFER", "OTHER"];

export function EditPaymentMethodModal({
  paymentId,
  currentMethod,
  onClose,
  onSuccess,
}: EditPaymentMethodModalProps) {
  const [method, setMethod] = useState<PaymentMethod>(currentMethod || "CASH");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: (newMethod: PaymentMethod) =>
      api.patch(`/invoices/payments/${paymentId}/method`, { paymentMethod: newMethod }).then((r) => r.data),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.message || "Xatolik yuz berdi"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(method);
  };

  return (
    <Modal isOpen onClose={onClose} title="To'lov usulini tahrirlash" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text">Yangi to'lov usuli</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer text-left ${
                  method === m
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-surface border-border text-text-muted hover:border-border-strong hover:text-text"
                }`}
              >
                {PAYMENT_METHOD_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-danger-600 font-medium">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-surface border border-border text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
          >
            {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
