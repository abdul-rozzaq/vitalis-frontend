import { Providers } from "@/app/providers";
import { AppLayout } from "@/components/app-layout";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vitalis CRM | Hospital Management",
  description: "Minimalist Hospital CRM System",
  icons: {
    icon: "/logo.png",        // brauzer tab icon
    apple: "/logo.png",       // iOS uchun
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <NextTopLoader color="var(--color-primary-500)" height={2} />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AppLayout>{children}</AppLayout>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}