// src/lib/export-excel.ts
// Ishlatish uchun: npm install xlsx

import * as XLSX from "xlsx";

/**
 * Ma'lumotlarni Excel (.xlsx) formatida yuklab olish
 * @param filename   - fayl nomi (massan "employees")
 * @param headers    - ustun nomlari ["Ism", "Telefon", ...]
 * @param rows       - qatorlar [["Ali", "+998..."], ...]
 * @param sheetName  - Excel sheet nomi (default: "Ma'lumotlar")
 */
export function exportToExcel(filename: string, headers: string[], rows: (string | number | null | undefined)[][], sheetName = "Ma'lumotlar") {
  // 1. Headers + rows ni bitta massivga birlashtiramiz
  const data = [headers, ...rows];

  // 2. XLSX worksheet yaratamiz
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // 3. Ustun kengliklarini avtomatik hisoblash
  const colWidths = headers.map((header, colIdx) => {
    const maxLen = Math.max(header.length, ...rows.map((row) => String(row[colIdx] ?? "").length));
    return { wch: Math.min(maxLen + 4, 50) }; // max 50 belgi
  });
  worksheet["!cols"] = colWidths;

  // 4. Workbook yaratamiz
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 5. Yuklab olish
  XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
