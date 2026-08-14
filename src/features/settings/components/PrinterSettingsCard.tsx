"use client";

import { getConfiguredReceiptPrinter, getReceiptPrinters, isQzTrayAvailable, setConfiguredReceiptPrinter, testReceiptPrinter } from "@/shared/lib/receipt-printer";
import { CheckCircle2, Loader2, Printer, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function PrinterSettingsCard() {
  const [qzAvailable, setQzAvailable] = useState<boolean | null>(null);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");

  const refreshPrinters = async () => {
    setLoading(true);
    setMessage("");
    try {
      const available = await isQzTrayAvailable();
      setQzAvailable(available);
      if (!available) {
        setPrinters([]);
        return;
      }

      const list = await getReceiptPrinters();
      setPrinters(list);

      const saved = getConfiguredReceiptPrinter();
      if (list.includes(saved)) {
        setSelectedPrinter(saved);
      } else if (list[0]) {
        setSelectedPrinter(list[0]);
        setConfiguredReceiptPrinter(list[0]);
      }
    } catch {
      setQzAvailable(false);
      setPrinters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedPrinter(getConfiguredReceiptPrinter());
    void refreshPrinters();
  }, []);

  const handlePrinterChange = (printer: string) => {
    setSelectedPrinter(printer);
    setConfiguredReceiptPrinter(printer);
    setMessage("Printer saqlandi");
    setTimeout(() => setMessage(""), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage("");
    try {
      await testReceiptPrinter();
      setMessage("Test cheki printerga yuborildi");
    } catch (error: any) {
      setMessage(error?.message || "Printer testida xatolik");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
          <Printer className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text">Chek printeri</h3>
          <p className="text-xs text-secondary">QZ Tray va Xprinter holatini boshqarish</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-hover px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-text-muted">QZ Tray</span>
            {qzAvailable === null ? (
              <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
            ) : qzAvailable ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success-600"><CheckCircle2 className="w-3.5 h-3.5" /> Ishlayapti</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-danger-600"><XCircle className="w-3.5 h-3.5" /> Ulanmagan</span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface-hover px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-text-muted">Printer</span>
            <span className={`text-xs font-medium ${printers.includes(selectedPrinter) ? "text-success-600" : "text-text-muted"}`}>
              {printers.includes(selectedPrinter) ? "Ulangan" : "Topilmadi"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text">Xprinter</label>
        <select
          value={selectedPrinter}
          onChange={(e) => handlePrinterChange(e.target.value)}
          disabled={loading || printers.length === 0}
          className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
        >
          {printers.length === 0 ? <option value={selectedPrinter}>{selectedPrinter || "Printer topilmadi"}</option> : printers.map((printer) => <option key={printer} value={printer}>{printer}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void refreshPrinters()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm font-medium text-secondary hover:bg-surface-hover disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Tekshirish
        </button>
        <button
          type="button"
          onClick={() => void handleTest()}
          disabled={!qzAvailable || printers.length === 0 || testing}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
          Test chek chiqarish
        </button>
        {message && <span className="text-xs text-secondary">{message}</span>}
      </div>

      {!qzAvailable && qzAvailable !== null && (
        <p className="text-xs text-text-muted rounded-lg bg-warning-50 px-3 py-2">
          QZ Tray kompyuterda ishlamayapti. To'lov oynasidagi chek funksiyasi baribir ishlaydi, lekin QZ Tray bo'lmasa brauzerning print oynasi ochiladi.
        </p>
      )}
    </div>
  );
}
