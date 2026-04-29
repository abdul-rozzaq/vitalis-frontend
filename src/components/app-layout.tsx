// "use client";

// import { LanguageSwitcher } from "@/components/ui/language-switcher";
// import { useAuth } from "@/hooks/use-auth";
// import { useTheme } from "@/hooks/use-theme";
// import Lottie from "lottie-react";
// import {
//   Bell,
//   Building2,
//   Calendar,
//   CreditCard,
//   FlaskConical,
//   GitFork,
//   LogOut,
//   Microscope,
//   Moon,
//   Sun,
//   User,
//   UserPen,
//   Users,
// } from "lucide-react";
// import { useTranslations } from "next-intl";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import React, { useState } from "react";
// import { Can } from "./ui/can";
// import { PatientSearch } from "./ui/patient-search";

// const IGNORE_PATHS = ["/login"];

// export function AppLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   const { user, logout, isLoading } = useAuth();
//   const { theme, toggleTheme } = useTheme();
//   const t = useTranslations();
//   const [notificationsOpen, setNotificationsOpen] = useState(false);

//   const NAVIGATIONS = [
//     {
//       label: t("nav.patients"),
//       href: "/patients",
//       icon: Users,
//       method: "GET",
//       path: "/api/patients",
//     },
//     {
//       label: t("nav.appointments"),
//       href: "/appointments",
//       icon: Calendar,
//       method: "GET",
//       path: "/api/appointments",
//     },
//     {
//       label: t("nav.employees"),
//       href: "/employees",
//       icon: UserPen,
//       method: "GET",
//       path: "/api/employees",
//     },
//     {
//       label: t("nav.departments"),
//       href: "/departments",
//       icon: Building2,
//       method: "GET",
//       path: "/api/departments",
//     },
//     {
//       label: t("nav.payments"),
//       href: "/payments",
//       icon: CreditCard,
//       method: "GET",
//       path: "/api/payments",
//     },

//     {
//       label: t("nav.lab"),
//       href: "/lab",
//       icon: FlaskConical,
//       method: "GET",
//       path: "/api/lab-orders",
//     },
//     {
//       label: t("nav.laboratories"),
//       href: "/laboratories",
//       icon: Microscope,
//       method: "GET",
//       path: "/api/laboratories",
//     },
//     {
//       label: t("nav.assignments"),
//       href: "/assignments",
//       icon: GitFork,
//       method: "GET",
//       path: "/api/assignments",
//     },
//   ];

//   if (IGNORE_PATHS.includes(pathname)) return <>{children}</>;

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-background flex items-center justify-center">
//         <Lottie
//           animationData={require("@/animations/loading.json")}
//           loop={true}
//           autoplay={true}
//           style={{ width: 120, height: 120 }}
//         />
//       </div>
//     );
//   }

//   if (!user) return null;

//   const roleName = user.role?.name;

//   return (
//     <div className="min-h-screen bg-background flex">
//       {/* Sidebar */}
//       <aside className="w-60 bg-surface border-r border-border flex flex-col">
//         <div className="px-5 py-4 border-b border-border">
//           <Link href="/">
//             <div className="flex items-center">
//               <img
//                 src="/logo.png"
//                 alt="Vitalis logo"
//                 className="w-32 h-12 object-contain shrink-0"
//               />
//             </div>
//           </Link>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 flex flex-col px-3 py-4 gap-0.5">
//           {NAVIGATIONS.map((nav) => (
//             <Can key={nav.href} method={nav.method} path={nav.path}>
//               <NavItem
//                 href={nav.href}
//                 icon={nav.icon}
//                 label={nav.label}
//                 active={pathname === nav.href || (nav.href !== "/" && pathname.startsWith(nav.href + "/"))}
//               />
//             </Can>
//           ))}
//         </nav>

//         {/* User info + Logout */}
//         <div className="px-3 py-3 border-t border-border space-y-1">
//           <Link href="/settings">
//             <div
//               className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors hover:bg-surface-hover cursor-pointer ${pathname === "/settings" ? "bg-primary-50" : ""}`}
//             >
//               <div className="w-7 h-7 bg-background rounded-full flex items-center justify-center border border-border shrink-0">
//                 <User className="w-3.5 h-3.5 text-text-muted" />
//               </div>
//               <div className="min-w-0">
//                 <p
//                   className={`text-sm font-medium leading-tight truncate ${pathname === "/settings" ? "text-primary" : "text-text"}`}
//                 >
//                   {user.first_name} {user.last_name}
//                 </p>
//                 <p className="text-[11px] text-text-muted truncate">
//                   {roleName}
//                 </p>
//               </div>
//             </div>
//           </Link>
//           <button
//             onClick={() => logout()}
//             className="w-full flex items-center gap-2.5 px-3 py-2 text-secondary hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors group cursor-pointer text-sm"
//           >
//             <LogOut className="w-4 h-4" />
//             <span className="font-medium">{t("nav.signOut")}</span>
//           </button>
//         </div>
//       </aside>

//       {/* Main Content */}
//       <main className="flex-1 flex flex-col min-w-0">
//         {/* Header */}
//         <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 w-full relative">
//           <div className="flex items-center gap-3 flex-1 max-w-md">
//             <PatientSearch />
//           </div>

//           <div className="flex items-center gap-3">
//             <LanguageSwitcher />
//             <div className="relative">
//               <button
//                 onClick={() => setNotificationsOpen((v) => !v)}
//                 className="relative p-1.5 text-text-muted hover:text-text transition-colors cursor-pointer"
//               >
//                 <Bell className="w-[18px] h-[18px]" />
//                 <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-danger-500 rounded-full"></span>
//               </button>
//               {notificationsOpen && (
//                 <div className="absolute top-10 right-0 w-72 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
//                   <div className="px-4 py-3 border-b border-border">
//                     <p className="font-semibold text-text text-sm">
//                       {t("notifications.title")}
//                     </p>
//                   </div>
//                   <div className="px-4 py-6 flex flex-col items-center justify-center gap-2">
//                     <Bell className="w-8 h-8 text-text-muted opacity-40" />
//                     <p className="text-secondary text-sm text-center">
//                       {t("notifications.empty")}
//                     </p>
//                   </div>
//                 </div>
//               )}
//             </div>
//             <button
//               onClick={toggleTheme}
//               className="p-1.5 text-text-muted hover:text-text transition-colors cursor-pointer"
//               title={
//                 theme === "dark"
//                   ? t("theme.switchToLight")
//                   : t("theme.switchToDark")
//               }
//             >
//               {theme === "dark" ? (
//                 <Sun className="w-[18px] h-[18px]" />
//               ) : (
//                 <Moon className="w-[18px] h-[18px]" />
//               )}
//             </button>
//           </div>
//         </header>

//         {/* Page Content */}
//         <div className="flex-1 overflow-auto">{children}</div>
//       </main>
//     </div>
//   );
// }

// function NavItem({
//   icon: Icon,
//   label,
//   active = false,
//   href,
// }: {
//   icon: any;
//   label: string;
//   active?: boolean;
//   href: string;
// }) {
//   return (
//     <Link href={href}>
//       <button
//         className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium ${active
//             ? "bg-primary-50 text-primary"
//             : "text-secondary hover:bg-surface-hover hover:text-text"
//           }`}
//       >
//         <Icon className="w-[18px] h-[18px]" />
//         <span>{label}</span>
//       </button>
//     </Link>
//   );
// }


"use client";

import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import Lottie from "lottie-react";
import {
  Bell,
  Building2,
  Calendar,
  CreditCard,
  FlaskConical,
  GitFork,
  LogOut,
  Microscope,
  Moon,
  Sun,
  User,
  UserPen,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { Can } from "./ui/can";
import { PatientSearch } from "./ui/patient-search";

const IGNORE_PATHS = ["/login"];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations();
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const NAVIGATIONS = [
    {
      label: t("nav.patients"),
      href: "/patients",
      icon: Users,
      method: "GET",
      path: "/api/patients",
    },
    {
      label: t("nav.appointments"),
      href: "/appointments",
      icon: Calendar,
      method: "GET",
      path: "/api/appointments",
    },
    {
      label: t("nav.employees"),
      href: "/employees",
      icon: UserPen,
      method: "GET",
      path: "/api/employees",
    },
    {
      label: t("nav.departments"),
      href: "/departments",
      icon: Building2,
      method: "GET",
      path: "/api/departments",
    },
    {
      label: t("nav.payments"),
      href: "/payments",
      icon: CreditCard,
      method: "GET",
      path: "/api/payments",
    },

    {
      label: t("nav.lab"),
      href: "/lab",
      icon: FlaskConical,
      method: "GET",
      path: "/api/lab-orders",
    },
    {
      label: t("nav.laboratories"),
      href: "/laboratories",
      icon: Microscope,
      method: "GET",
      path: "/api/laboratories",
    },
    {
      label: t("nav.assignments"),
      href: "/assignments",
      icon: GitFork,
      method: "GET",
      path: "/api/assignments",
    },
  ];

  if (IGNORE_PATHS.includes(pathname)) return <>{children}</>;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Lottie
          animationData={require("@/animations/loading.json")}
          loop={true}
          autoplay={true}
          style={{ width: 120, height: 120 }}
        />
      </div>
    );
  }

  if (!user) return null;

  const roleName = user?.role;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 bg-surface border-r border-border flex flex-col">
        <div className="px-5 py-4 border-b border-border">
          <Link href="/">
            <div className="flex items-center">
              <img
                src="/logo.png"
                alt="Vitalis logo"
                className="w-32 h-12 object-contain shrink-0"
              />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col px-3 py-4 gap-0.5">
          {NAVIGATIONS.map((nav) => (
            <Can key={nav.href} method={nav.method} path={nav.path}>
              <NavItem
                href={nav.href}
                icon={nav.icon}
                label={nav.label}
                active={pathname === nav.href || (nav.href !== "/" && pathname.startsWith(nav.href + "/"))}
              />
            </Can>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="px-3 py-3 border-t border-border space-y-1">
          <Link href="/settings">
            <div
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors hover:bg-surface-hover cursor-pointer ${pathname === "/settings" ? "bg-primary-50" : ""}`}
            >
              <div className="w-7 h-7 bg-background rounded-full flex items-center justify-center border border-border shrink-0">
                <User className="w-3.5 h-3.5 text-text-muted" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-medium leading-tight truncate ${pathname === "/settings" ? "text-primary" : "text-text"}`}
                >
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-[11px] text-text-muted truncate">
                  {roleName}
                </p>
              </div>
            </div>
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-secondary hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors group cursor-pointer text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">{t("nav.signOut")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 w-full relative">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <PatientSearch />
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((v) => !v)}
                className="relative p-1.5 text-text-muted hover:text-text transition-colors cursor-pointer"
              >
                <Bell className="w-[18px] h-[18px]" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-danger-500 rounded-full"></span>
              </button>
              {notificationsOpen && (
                <div className="absolute top-10 right-0 w-72 bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-semibold text-text text-sm">
                      {t("notifications.title")}
                    </p>
                  </div>
                  <div className="px-4 py-6 flex flex-col items-center justify-center gap-2">
                    <Bell className="w-8 h-8 text-text-muted opacity-40" />
                    <p className="text-secondary text-sm text-center">
                      {t("notifications.empty")}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 text-text-muted hover:text-text transition-colors cursor-pointer"
              title={
                theme === "dark"
                  ? t("theme.switchToLight")
                  : t("theme.switchToDark")
              }
            >
              {theme === "dark" ? (
                <Sun className="w-[18px] h-[18px]" />
              ) : (
                <Moon className="w-[18px] h-[18px]" />
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false,
  href,
}: {
  icon: any;
  label: string;
  active?: boolean;
  href: string;
}) {
  return (
    <Link href={href}>
      <button
        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium ${active
          ? "bg-primary-50 text-primary"
          : "text-secondary hover:bg-surface-hover hover:text-text"
          }`}
      >
        <Icon className="w-[18px] h-[18px]" />
        <span>{label}</span>
      </button>
    </Link>
  );
}