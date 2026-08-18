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

const PRINTER_STORAGE_KEY = "vitalis.receiptPrinter";
const DEFAULT_PRINTER_NAME = "Xprinter XP-A260M";
// Chek chiqarish o'chirilgani uchun endi kerak emas.
// const CLINIC_NAME = "EuroMed";
// const CLINIC_SUBTITLE = "MEDICAL CLINIC";
// const LOGO_PATH = "/logo.png";

// const PAYMENT_METHOD_LABELS: Record<string, string> = {
//   CASH: "Naqd",
//   CARD: "Karta",
//   TRANSFER: "O'tkazma",
//   OTHER: "Boshqa",
//   BONUS: "Bonus",
// };

// XPrinter (ESC/POS) cheki uchun ishlatilgan yordamchi funksiyalar - QZ Tray/Xprinter o'chirilgan.
// function sanitizeReceiptText(value: string): string {
//   return value
//     .replace(/[‘’ʼ]/g, "'")
//     .replace(/[“”]/g, '"')
//     .replace(/—/g, "-")
//     .replace(/–/g, "-")
//     .replace(/\u00a0/g, " ");
// }

// function padLine(left: string, right: string, width = 48): string {
//   const l = sanitizeReceiptText(left);
//   const r = sanitizeReceiptText(right);
//   const spaces = Math.max(1, width - l.length - r.length);
//   return `${l}${" ".repeat(spaces)}${r}`;
// }

// function center(text: string, width = 48): string {
//   const value = sanitizeReceiptText(text).slice(0, width);
//   const left = Math.max(0, Math.floor((width - value.length) / 2));
//   return `${" ".repeat(left)}${value}`;
// }

// Chek matnida foydalanilgan yordamchi funksiyalar - chop etish o'chirilgani uchun endi kerak emas.
// function money(value: string | number): string {
//   return Number(value || 0).toLocaleString("uz-UZ");
// }

// function getPaymentMethod(data: ReceiptData): string {
//   const explicit = data.paymentMethod || data.payment.paymentMethod;
//   if (explicit) return PAYMENT_METHOD_LABELS[explicit] || explicit;

//   const cash = Number(data.payment.cashAmount || 0);
//   const bonus = Number(data.payment.bonusAmount || 0);
//   if (cash > 0 && bonus > 0) return "Naqd + Bonus";
//   if (bonus > 0) return "Bonus";
//   if (cash > 0) return "Naqd";
//   return "-";
// }

// function getItems(data: ReceiptData): ReceiptItem[] {
//   return data.items ?? data.payment.invoice?.items ?? [];
// }

// const ESC = "\x1B";
// const GS = "\x1D";

// // ESC/POS control sequences (kept named so the receipt body below reads like markup)
// const INIT = ESC + "@";
// const ALIGN_CENTER = ESC + "a" + "\x01";
// const ALIGN_LEFT = ESC + "a" + "\x00";
// const BOLD_ON = ESC + "E" + "\x01";
// const BOLD_OFF = ESC + "E" + "\x00";
// const SIZE_NORMAL = GS + "!" + "\x00"; // 1x width, 1x height
// const SIZE_WIDE = GS + "!" + "\x10"; // 2x width, 1x height
// const SIZE_TALL = GS + "!" + "\x01"; // 1x width, 2x height
// const SIZE_BIG = GS + "!" + "\x11"; // 2x width, 2x height
// const FEED_AND_CUT = "\n\n\n" + GS + "V" + "\x00";

// const LINE_WIDTH = 48;
// const DOUBLE_LINE = "=".repeat(LINE_WIDTH);
// const THIN_LINE = "-".repeat(LINE_WIDTH);

// XPrinter (ESC/POS thermal) chek generatori - QZ Tray printeri xatolik berayotgani uchun o'chirilgan.
// function buildEscPosReceipt(data: ReceiptData): string {
//   const payment = data.payment;
//   const method = getPaymentMethod(data);
//   const items = getItems(data);
//   const createdAt = new Date(payment.createdAt).toLocaleString("uz-UZ", {
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
//
//   const total = Number(payment.totalAmount);
//   const cash = Number(payment.cashAmount);
//   const bonus = Number(payment.bonusAmount);
//
//   const lines: string[] = [
//     INIT,
//     ALIGN_CENTER,
//     BOLD_ON + SIZE_WIDE,
//     CLINIC_NAME,
//     SIZE_NORMAL + BOLD_OFF,
//     CLINIC_SUBTITLE,
//     "",
//     BOLD_ON + SIZE_TALL,
//     "TO'LOV CHEKI",
//     SIZE_NORMAL + BOLD_OFF,
//     "To'lov tasdig'i",
//     ALIGN_LEFT,
//     DOUBLE_LINE,
//     padLine("Bemor", sanitizeReceiptText(data.patientName), LINE_WIDTH),
//     padLine("Sana", createdAt, LINE_WIDTH),
//     ...(data.invoiceNumber ? [padLine("Invoice", data.invoiceNumber, LINE_WIDTH)] : []),
//     padLine("To'lov turi", method, LINE_WIDTH),
//     DOUBLE_LINE,
//   ];
//
//   if (items.length > 0) {
//     lines.push(ALIGN_CENTER + BOLD_ON + "TO'LOV QILINGAN XIZMATLAR" + BOLD_OFF + ALIGN_LEFT);
//     lines.push(THIN_LINE);
//     items.forEach((item, index) => {
//       const description = sanitizeReceiptText(item.description || "Xizmat");
//       const quantity = Number(item.quantity || 1);
//       const itemTotal = Number(item.totalPrice || Number(item.unitPrice || 0) * quantity);
//       lines.push(BOLD_ON + `${index + 1}. ${description}`.slice(0, LINE_WIDTH) + BOLD_OFF);
//       lines.push(padLine(`   ${quantity} x ${money(item.unitPrice)}`, `${money(itemTotal)} UZS`, LINE_WIDTH));
//     });
//     lines.push(THIN_LINE);
//   }
//
//   if (cash > 0) lines.push(padLine("Naqd", `${money(cash)} UZS`, LINE_WIDTH));
//   if (bonus > 0) lines.push(padLine("Bonus", `${money(bonus)} UZS`, LINE_WIDTH));
//   lines.push(THIN_LINE);
//   lines.push(BOLD_ON + SIZE_BIG);
//   lines.push(padLine("JAMI", `${money(total)} UZS`, 24));
//   lines.push(SIZE_NORMAL + BOLD_OFF);
//   lines.push(DOUBLE_LINE);
//   if (data.cashierName) lines.push(padLine("Kassir", sanitizeReceiptText(data.cashierName), LINE_WIDTH));
//   lines.push("");
//   lines.push(ALIGN_CENTER);
//   lines.push(BOLD_ON + "To'lovingiz uchun rahmat!" + BOLD_OFF);
//   lines.push(CLINIC_NAME + " Medical Clinic");
//   lines.push(ALIGN_LEFT);
//   lines.push(FEED_AND_CUT);
//
//   return lines.join("\n");
// }

// QZ Tray ulanish funksiyalari - hozircha o'chirilgan (printer xatolik beryapti).
// async function getQz() {
//   const qz = await import("qz-tray");
//   return qz.default ?? qz;
// }
//
// async function connectQz() {
//   const qz = await getQz();
//   if (!qz.websocket.isActive()) {
//     await qz.websocket.connect();
//   }
//   return qz;
// }

export async function isQzTrayAvailable(): Promise<boolean> {
  // QZ Tray / Xprinter o'chirilgan - doim mavjud emas deb qaytariladi.
  return false;
  // try {
  //   const qz = await connectQz();
  //   return qz.websocket.isActive();
  // } catch {
  //   return false;
  // }
}

export async function testReceiptPrinter(): Promise<void> {
  // QZ Tray / Xprinter o'chirilgan.
  throw new Error("QZ Tray / Xprinter hozircha o'chirilgan");
  // const qz = await connectQz();
  // const printer = getConfiguredReceiptPrinter();
  // const availablePrinters = await qz.printers.find();
  //
  // if (!availablePrinters.includes(printer)) {
  //   throw new Error(`Printer topilmadi: ${printer}`);
  // }
  //
  // const config = qz.configs.create(printer, { encoding: "CP437" });
  //
  // await qz.print(config, [
  //   {
  //     type: "raw",
  //     format: "command",
  //     flavor: "plain",
  //     data: [
  //       ESC + "@",
  //       ESC + "a" + "\x01",
  //       ESC + "E" + "\x01",
  //       center(CLINIC_NAME),
  //       ESC + "E" + "\x00",
  //       center(CLINIC_SUBTITLE),
  //       "Printer test",
  //       "Xprinter XP-A260M",
  //       "\n\n\n",
  //       GS + "V" + "\x00",
  //     ].join("\n"),
  //   },
  // ]);
}

export async function getReceiptPrinters(): Promise<string[]> {
  // QZ Tray / Xprinter o'chirilgan - printer ro'yxati bo'sh qaytariladi.
  return [];
  // const qz = await connectQz();
  // const printers = await qz.printers.find();
  // return Array.isArray(printers) ? printers : [printers];
}

export function getConfiguredReceiptPrinter(): string {
  if (typeof window === "undefined") return DEFAULT_PRINTER_NAME;
  return localStorage.getItem(PRINTER_STORAGE_KEY) || DEFAULT_PRINTER_NAME;
}

export function setConfiguredReceiptPrinter(printer: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(PRINTER_STORAGE_KEY, printer);
  }
}

// QZ Tray orqali Xprinterga chop etish - hozircha o'chirilgan (printer xatolik beryapti).
// async function printWithQz(data: ReceiptData): Promise<void> {
//   const qz = await connectQz();
//   const printer = getConfiguredReceiptPrinter();
//   const availablePrinters = await qz.printers.find();
//
//   if (!availablePrinters.includes(printer)) {
//     throw new Error(`Printer topilmadi: ${printer}`);
//   }
//
//   const config = qz.configs.create(printer, { encoding: "CP437" });
//
//   await qz.print(config, [
//     {
//       type: "raw",
//       format: "command",
//       flavor: "plain",
//       data: buildEscPosReceipt(data),
//     },
//   ]);
// }

// Brauzer orqali chek chop etish ham hozircha butunlay o'chirilgan - printReceipt endi hech narsa qilmaydi.
// function buildBrowserReceiptHtml(data: ReceiptData): string {
//   const payment = data.payment;
//   const method = getPaymentMethod(data);
//   const items = getItems(data);
//   const createdAt = new Date(payment.createdAt).toLocaleString("uz-UZ", {
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
//   const logoUrl = `${window.location.origin}${LOGO_PATH}`;
//   const total = Number(payment.totalAmount);
//   const cash = Number(payment.cashAmount);
//   const bonus = Number(payment.bonusAmount);

//   const itemRows = items.length
//     ? items
//         .map((item, index) => {
//           const quantity = Number(item.quantity || 1);
//           const itemTotal = Number(item.totalPrice || Number(item.unitPrice || 0) * quantity);
//           return `
//             <tr>
//               <td class="num">${index + 1}</td>
//               <td class="service">
//                 <div class="service-name">${escapeHtml(item.description || "Xizmat")}</div>
//                 <div class="service-meta">${quantity} × ${money(item.unitPrice)} UZS</div>
//               </td>
//               <td class="price">${money(itemTotal)} UZS</td>
//             </tr>`;
//         })
//         .join("")
//     : `<tr><td colspan="3" class="empty">Xizmat ma'lumotlari mavjud emas</td></tr>`;

//   return `<!doctype html>
// <html lang="uz">
// <head>
// <meta charset="utf-8" />
// <title>EuroMed - To'lov cheki</title>
// <style>
//   @page { size: 80mm auto; margin: 0; }
//   * { box-sizing: border-box; }
//   html, body { margin: 0; padding: 0; background: #fff; }
//   body {
//     width: 80mm;
//     /* 4mm side padding keeps content within the printer's 72mm print head width */
//     padding: 3mm 4mm 4mm;
//     font-family: Arial, Helvetica, sans-serif;
//     color: #172033;
//     font-size: 11px;
//     line-height: 1.3;
//   }
//   .header { text-align: center; }
//   .logo {
//     width: 42mm;
//     max-height: 13mm;
//     object-fit: contain;
//     display: block;
//     margin: 0 auto 1.5mm;
//   }
//   .clinic-name { font-size: 17px; font-weight: 800; letter-spacing: .4px; }
//   .subtitle { font-size: 8px; letter-spacing: 2px; color: #687386; font-weight: 700; margin-top: 1px; }
//   .receipt-title { margin-top: 2.5mm; font-size: 14px; font-weight: 800; letter-spacing: .5px; }
//   .receipt-subtitle { font-size: 8px; color: #7a8494; margin-top: 1px; }
//   .divider { border-top: 1px dashed #aeb7c5; margin: 2.5mm 0; }
//   .info { display: grid; gap: 1.6mm; }
//   .row { display: flex; justify-content: space-between; gap: 4mm; }
//   .label { color: #718096; }
//   .value { text-align: right; font-weight: 600; max-width: 56%; word-break: break-word; }
//   .method {
//     display: inline-block;
//     padding: 1.2mm 2.5mm;
//     border: 1px solid #bfd4f6;
//     background: #f1f7ff;
//     color: #2165bd;
//     border-radius: 2mm;
//     font-weight: 800;
//   }
//   .section-title { font-size: 10px; font-weight: 800; text-align: center; letter-spacing: .3px; margin-bottom: 2mm; }
//   table { width: 100%; border-collapse: collapse; table-layout: fixed; }
//   th {
//     background: #f3f6fa;
//     color: #526174;
//     font-size: 8.5px;
//     text-align: left;
//     padding: 1.8mm 1.5mm;
//     border-bottom: 1px solid #dce2ea;
//   }
//   td { padding: 2mm 1.5mm; border-bottom: 1px solid #e8ecf1; vertical-align: top; }
//   .num { width: 8%; color: #7b8798; }
//   .service { width: 56%; }
//   .price { width: 36%; text-align: right; font-weight: 700; white-space: nowrap; }
//   .service-name { font-weight: 700; word-break: break-word; }
//   .service-meta { font-size: 8px; color: #8791a0; margin-top: .7mm; }
//   .empty { text-align: center; color: #8b95a3; padding: 3mm 0; }
//   .amounts { display: grid; gap: 1.7mm; }
//   .total-box {
//     margin-top: 2mm;
//     padding: 2.5mm;
//     border: 1px solid #cbdcf4;
//     background: #f4f8fe;
//     border-radius: 2mm;
//   }
//   .total-row { display: flex; align-items: center; justify-content: space-between; gap: 4mm; }
//   .total-label { font-size: 13px; font-weight: 800; }
//   .total-value { font-size: 16px; font-weight: 900; color: #1763bd; white-space: nowrap; }
//   .thanks { text-align: center; margin-top: 3mm; font-weight: 800; font-size: 11px; }
//   .thanks-small { text-align: center; margin-top: 1mm; color: #768194; font-size: 8.5px; }
//   .footer { margin-top: 2.5mm; padding-top: 2mm; border-top: 1px solid #dfe4eb; text-align: center; color: #7a8494; font-size: 7.5px; }
//   .footer strong { color: #3e4b5e; }
// </style>
// </head>
// <body>
//   <header class="header">
//     <img class="logo" src="${escapeHtml(logoUrl)}" alt="EuroMed" />
//     <div class="clinic-name">EuroMed</div>
//     <div class="subtitle">MEDICAL CLINIC</div>
//     <div class="receipt-title">TO'LOV CHEKI</div>
//     <div class="receipt-subtitle">To'lov tasdig'i</div>
//   </header>

//   <div class="divider"></div>

//   <section class="info">
//     <div class="row"><span class="label">Bemor</span><span class="value">${escapeHtml(data.patientName)}</span></div>
//     <div class="row"><span class="label">Sana</span><span class="value">${escapeHtml(createdAt)}</span></div>
//     ${data.invoiceNumber ? `<div class="row"><span class="label">Invoice</span><span class="value">${escapeHtml(data.invoiceNumber)}</span></div>` : ""}
//     <div class="row"><span class="label">To'lov turi</span><span class="value"><span class="method">${escapeHtml(method)}</span></span></div>
//     ${data.cashierName ? `<div class="row"><span class="label">Kassir</span><span class="value">${escapeHtml(data.cashierName)}</span></div>` : ""}
//   </section>

//   <div class="divider"></div>

//   <section>
//     <div class="section-title">TO'LOV QILINGAN XIZMATLAR</div>
//     <table>
//       <thead><tr><th>№</th><th>Xizmat</th><th style="text-align:right">Summa</th></tr></thead>
//       <tbody>${itemRows}</tbody>
//     </table>
//   </section>

//   <div class="divider"></div>

//   <section class="amounts">
//     ${cash > 0 ? `<div class="row"><span class="label">Naqd</span><span class="value">${money(cash)} UZS</span></div>` : ""}
//     ${bonus > 0 ? `<div class="row"><span class="label">Bonus</span><span class="value">${money(bonus)} UZS</span></div>` : ""}
//   </section>

//   <div class="total-box">
//     <div class="total-row"><span class="total-label">JAMI</span><span class="total-value">${money(total)} UZS</span></div>
//   </div>

//   <div class="thanks">To'lovingiz uchun rahmat!</div>
//   <div class="thanks-small">Sog'lig'ingizni ishonchli qo'llarda asrang.</div>

//   <div class="footer">
//     <div><strong>EuroMed Medical Clinic</strong></div>
//     <div>Ushbu chek to'lov tasdig'i sifatida berildi.</div>
//   </div>

//   <script>
//     window.onload = function () {
//       window.print();
//       setTimeout(function () { window.close(); }, 700);
//     };
//   </script>
// </body>
// </html>`;
// }

// function escapeHtml(value: string): string {
//   return value.replace(/[&<>'"]/g, (char) => ({
//     "&": "&amp;",
//     "<": "&lt;",
//     ">": "&gt;",
//     "'": "&#39;",
//     '"': "&quot;",
//   })[char] as string);
// }

// function printWithBrowser(data: ReceiptData): void {
//   const iframe = document.createElement("iframe");
//   iframe.style.position = "fixed";
//   iframe.style.right = "0";
//   iframe.style.bottom = "0";
//   iframe.style.width = "0";
//   iframe.style.height = "0";
//   iframe.style.border = "0";
//   iframe.setAttribute("aria-hidden", "true");
//   document.body.appendChild(iframe);

//   const cleanup = () => {
//     window.setTimeout(() => iframe.remove(), 1200);
//   };

//   iframe.onload = () => {
//     const printWindow = iframe.contentWindow;
//     if (!printWindow) {
//       cleanup();
//       return;
//     }
//     printWindow.focus();
//     printWindow.print();
//     cleanup();
//   };

//   iframe.srcdoc = buildBrowserReceiptHtml(data);
// }

export async function printReceipt(_data: ReceiptData): Promise<"qz" | "browser"> {
  // Chek chiqarish (QZ Tray, Xprinter va brauzer print) hozircha butunlay o'chirilgan.
  throw new Error("Chek chiqarish hozircha o'chirilgan");
  // printWithBrowser(data);
  // return "browser";
  // try {
  //   await printWithQz(data);
  //   return "qz";
  // } catch (qzError) {
  //   console.warn("QZ Tray orqali chop etib bo'lmadi, browser print ishlatiladi:", qzError);
  //   printWithBrowser(data);
  //   return "browser";
  // }
}
