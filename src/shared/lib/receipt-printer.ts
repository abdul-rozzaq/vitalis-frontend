"use client";

import type { InvoicePayment, PaymentMethod } from "@/features/invoices/types";

export interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
}

export interface ReceiptData {
  payment: InvoicePayment;
  patientName: string;
  invoiceNumber?: string;
  paymentMethod?: PaymentMethod | string | null;
  cashierName?: string;
  items?: ReceiptItem[];
}

const CLINIC_NAME = "EuroMed";
const CLINIC_SUBTITLE = "MEDICAL CLINIC";
const LOGO_PATH = "/logo.png";
const PRINTER_STORAGE_KEY = "vitalis:receipt-printer";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Naqd",
  CARD: "Karta",
  TRANSFER: "O'tkazma",
  OTHER: "Boshqa",
  BONUS: "Bonus",
};

function money(value: string | number): string {
  return Number(value || 0).toLocaleString("uz-UZ");
}

function getPaymentMethod(data: ReceiptData): string {
  const explicit = data.paymentMethod || data.payment.paymentMethod;
  if (explicit) return PAYMENT_METHOD_LABELS[explicit] || explicit;

  const cash = Number(data.payment.cashAmount || 0);
  const bonus = Number(data.payment.bonusAmount || 0);
  if (cash > 0 && bonus > 0) return "Naqd + Bonus";
  if (bonus > 0) return "Bonus";
  if (cash > 0) return "Naqd";
  return "-";
}

function getItems(data: ReceiptData): ReceiptItem[] {
  return data.items ?? data.payment.invoice?.items ?? [];
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char] as string);
}

// Xprinter XP-A260M (80mm rulon, bosib chiqarish kengligi ~72mm) uchun
// moslashtirilgan chek HTML - QZ Tray orqali ham, brauzer print orqali ham ishlatiladi.
function buildReceiptHtml(data: ReceiptData): string {
  const payment = data.payment;
  const method = getPaymentMethod(data);
  const items = getItems(data);
  const createdAt = new Date(payment.createdAt).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const logoUrl = `${window.location.origin}${LOGO_PATH}`;
  const total = Number(payment.totalAmount);
  const cash = Number(payment.cashAmount);
  const bonus = Number(payment.bonusAmount);

  const itemRows = items.length
    ? items
        .map((item, index) => {
          const quantity = Number(item.quantity || 1);
          const itemTotal = Number(item.totalPrice || Number(item.unitPrice || 0) * quantity);
          return `
            <tr>
              <td class="num">${index + 1}</td>
              <td class="service">
                <div class="service-name">${escapeHtml(item.description || "Xizmat")}</div>
                <div class="service-meta">${quantity} × ${money(item.unitPrice)} UZS</div>
              </td>
              <td class="price">${money(itemTotal)} UZS</td>
            </tr>`;
        })
        .join("")
    : `<tr><td colspan="3" class="empty">Xizmat ma'lumotlari mavjud emas</td></tr>`;

  return `<!doctype html>
<html lang="uz">
<head>
<meta charset="utf-8" />
<title>EuroMed - To'lov cheki</title>
<style>
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    width: 80mm;
    /* 4mm side padding keeps content within the printer's 72mm print head width */
    padding: 3mm 4mm 4mm;
    font-family: Arial, Helvetica, sans-serif;
    color: #172033;
    font-size: 11px;
    line-height: 1.3;
  }
  .header { text-align: center; }
  .logo {
    width: 42mm;
    max-height: 13mm;
    object-fit: contain;
    display: block;
    margin: 0 auto 1.5mm;
  }
  .clinic-name { font-size: 17px; font-weight: 800; letter-spacing: .4px; }
  .subtitle { font-size: 8px; letter-spacing: 2px; color: #687386; font-weight: 700; margin-top: 1px; }
  .receipt-title { margin-top: 2.5mm; font-size: 14px; font-weight: 800; letter-spacing: .5px; }
  .receipt-subtitle { font-size: 8px; color: #7a8494; margin-top: 1px; }
  .divider { border-top: 1px dashed #aeb7c5; margin: 2.5mm 0; }
  .info { display: grid; gap: 1.6mm; }
  .row { display: flex; justify-content: space-between; gap: 4mm; }
  .label { color: #718096; }
  .value { text-align: right; font-weight: 600; max-width: 56%; word-break: break-word; }
  .method {
    display: inline-block;
    padding: 1.2mm 2.5mm;
    border: 1px solid #bfd4f6;
    background: #f1f7ff;
    color: #2165bd;
    border-radius: 2mm;
    font-weight: 800;
  }
  .section-title { font-size: 10px; font-weight: 800; text-align: center; letter-spacing: .3px; margin-bottom: 2mm; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th {
    background: #f3f6fa;
    color: #526174;
    font-size: 8.5px;
    text-align: left;
    padding: 1.8mm 1.5mm;
    border-bottom: 1px solid #dce2ea;
  }
  td { padding: 2mm 1.5mm; border-bottom: 1px solid #e8ecf1; vertical-align: top; }
  .num { width: 8%; color: #7b8798; }
  .service { width: 56%; }
  .price { width: 36%; text-align: right; font-weight: 700; white-space: nowrap; }
  .service-name { font-weight: 700; word-break: break-word; }
  .service-meta { font-size: 8px; color: #8791a0; margin-top: .7mm; }
  .empty { text-align: center; color: #8b95a3; padding: 3mm 0; }
  .amounts { display: grid; gap: 1.7mm; }
  .total-box {
    margin-top: 2mm;
    padding: 2.5mm;
    border: 1px solid #cbdcf4;
    background: #f4f8fe;
    border-radius: 2mm;
  }
  .total-row { display: flex; align-items: center; justify-content: space-between; gap: 4mm; }
  .total-label { font-size: 13px; font-weight: 800; }
  .total-value { font-size: 16px; font-weight: 900; color: #1763bd; white-space: nowrap; }
  .thanks { text-align: center; margin-top: 3mm; font-weight: 800; font-size: 11px; }
  .thanks-small { text-align: center; margin-top: 1mm; color: #768194; font-size: 8.5px; }
  .footer { margin-top: 2.5mm; padding-top: 2mm; border-top: 1px solid #dfe4eb; text-align: center; color: #7a8494; font-size: 7.5px; }
  .footer strong { color: #3e4b5e; }
  .tear-spacer { height: 18mm; }
</style>
</head>
<body>
  <header class="header">
    <img class="logo" src="${escapeHtml(logoUrl)}" alt="EuroMed" />
    <div class="clinic-name">EuroMed</div>
    <div class="subtitle">MEDICAL CLINIC</div>
    <div class="receipt-title">TO'LOV CHEKI</div>
    <div class="receipt-subtitle">To'lov tasdig'i</div>
  </header>

  <div class="divider"></div>

  <section class="info">
    <div class="row"><span class="label">Bemor</span><span class="value">${escapeHtml(data.patientName)}</span></div>
    <div class="row"><span class="label">Sana</span><span class="value">${escapeHtml(createdAt)}</span></div>
    ${data.invoiceNumber ? `<div class="row"><span class="label">Invoice</span><span class="value">${escapeHtml(data.invoiceNumber)}</span></div>` : ""}
    <div class="row"><span class="label">To'lov turi</span><span class="value"><span class="method">${escapeHtml(method)}</span></span></div>
    ${data.cashierName ? `<div class="row"><span class="label">Kassir</span><span class="value">${escapeHtml(data.cashierName)}</span></div>` : ""}
  </section>

  <div class="divider"></div>

  <section>
    <div class="section-title">TO'LOV QILINGAN XIZMATLAR</div>
    <table>
      <thead><tr><th>№</th><th>Xizmat</th><th style="text-align:right">Summa</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
  </section>

  <div class="divider"></div>

  <section class="amounts">
    ${cash > 0 ? `<div class="row"><span class="label">Naqd</span><span class="value">${money(cash)} UZS</span></div>` : ""}
    ${bonus > 0 ? `<div class="row"><span class="label">Bonus</span><span class="value">${money(bonus)} UZS</span></div>` : ""}
  </section>

  <div class="total-box">
    <div class="total-row"><span class="total-label">JAMI</span><span class="total-value">${money(total)} UZS</span></div>
  </div>

  <div class="thanks">To'lovingiz uchun rahmat!</div>
  <div class="thanks-small">Sog'lig'ingizni ishonchli qo'llarda asrang.</div>

  <div class="footer">
    <div><strong>EuroMed Medical Clinic</strong></div>
    <div>Ushbu chek to'lov tasdig'i sifatida berildi.</div>
  </div>

  <div class="tear-spacer"></div>
</body>
</html>`;
}

function buildBrowserReceiptHtml(data: ReceiptData): string {
  return buildReceiptHtml(data).replace(
    "</body>",
    `<script>
    window.onload = function () {
      window.print();
      setTimeout(function () { window.close(); }, 700);
    };
  </script></body>`
  );
}

function printWithBrowser(data: ReceiptData): void {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 1200);
  };

  iframe.onload = () => {
    const printWindow = iframe.contentWindow;
    if (!printWindow) {
      cleanup();
      return;
    }
    printWindow.focus();
    printWindow.print();
    cleanup();
  };

  iframe.srcdoc = buildBrowserReceiptHtml(data);
}

// ---- QZ Tray integratsiyasi ----

let qzModule: any = null;
let qzConfigured = false;

async function getQz(): Promise<any> {
  if (!qzModule) {
    qzModule = await import("qz-tray");
  }
  if (!qzConfigured) {
    qzModule.security.setSignatureAlgorithm("SHA512");

    qzModule.security.setCertificatePromise((resolve: (v: string) => void, reject: (e: any) => void) => {
      fetch("/qz-certificate.txt")
        .then((res) => res.text())
        .then(resolve)
        .catch(reject);
    });

    qzModule.security.setSignaturePromise((toSign: string) => (resolve: (v: string) => void, reject: (e: any) => void) => {
      fetch("/api/print/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request: toSign }),
      })
        .then((res) => res.json())
        .then((data) => resolve(data.signature))
        .catch(reject);
    });

    qzConfigured = true;
  }
  return qzModule;
}

export async function isQzTrayAvailable(): Promise<boolean> {
  try {
    const qz = await getQz();
    if (qz.websocket.isActive()) return true;
    await qz.websocket.connect();
    return qz.websocket.isActive();
  } catch {
    return false;
  }
}

export async function getReceiptPrinters(): Promise<string[]> {
  const qz = await getQz();
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }
  const printers = await qz.printers.find();
  return Array.isArray(printers) ? printers : [printers].filter(Boolean);
}

export function getConfiguredReceiptPrinter(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(PRINTER_STORAGE_KEY) || "";
}

export function setConfiguredReceiptPrinter(printer: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PRINTER_STORAGE_KEY, printer);
}

async function printWithQz(data: ReceiptData): Promise<void> {
  const qz = await getQz();
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }

  const printerName = getConfiguredReceiptPrinter();
  if (!printerName) {
    throw new Error("Xprinter tanlanmagan. Sozlamalar bo'limida printerni tanlang.");
  }

  const config = qz.configs.create(printerName);
  await qz.print(config, [
    {
      type: "pixel",
      format: "html",
      flavor: "plain",
      data: buildReceiptHtml(data),
    },
  ]);
}

export async function testReceiptPrinter(): Promise<void> {
  const printerName = getConfiguredReceiptPrinter();
  if (!printerName) {
    throw new Error("Xprinter tanlanmagan. Avval printerni tanlang.");
  }

  const qz = await getQz();
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }

  const config = qz.configs.create(printerName);
  await qz.print(config, [
    {
      type: "pixel",
      format: "html",
      flavor: "plain",
      data: `<!doctype html><html><body style="width:80mm;font-family:Arial;padding:4mm;">
        <h3>EuroMed - Test chek</h3>
        <p>Printer: ${escapeHtml(printerName)}</p>
        <p>Sana: ${escapeHtml(new Date().toLocaleString("uz-UZ"))}</p>
      </body></html>`,
    },
  ]);
}

export async function printReceipt(data: ReceiptData): Promise<void> {
  const printerName = getConfiguredReceiptPrinter();
  if (!printerName) {
    printWithBrowser(data);
    return;
  }

  try {
    await printWithQz(data);
  } catch {
    printWithBrowser(data);
  }
}
