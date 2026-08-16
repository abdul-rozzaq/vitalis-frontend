"use client";

import dynamic from "next/dynamic";

// Faqat mijoz tomonida render qilinadi. Ba'zi brauzer kengaytmalari
// (masalan, "force dark mode") sahifa yuklanishidan oldin <style>
// teglariga o'zgartirish kiritadi, bu esa NextTopLoader server render
// qilingan HTML bilan solishtirilganda hydration xatosiga olib keladi.
// ssr: false bilan bu komponent faqat hydration tugagandan keyin
// qo'shiladi, shu sababli bunday nomuvofiqlik yuzaga kelmaydi.
const NextTopLoader = dynamic(() => import("nextjs-toploader"), { ssr: false });

export function TopLoader() {
  return <NextTopLoader color="var(--color-primary-500)" height={2} />;
}
