"use client";

import { AttendanceEvent, AttendanceEventStatus } from "../lib/attendance-api";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { ChevronDown, ChevronUp, Image as ImageIcon, X } from "lucide-react";
import { useState, Fragment } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

interface AttendanceEventsTableProps {
  events: AttendanceEvent[];
}

const statusConfig: Record<AttendanceEventStatus, { label: string; color: string }> = {
  PENDING: { label: "Kutilmoqda", color: "bg-secondary-100 text-secondary-700 border-secondary-200" },
  MATCHED: { label: "Moslashtirilgan", color: "bg-success-100 text-success-700 border-success-200" },
  UNKNOWN_EMPLOYEE: { label: "Noma'lum xodim", color: "bg-danger-100 text-danger-700 border-danger-200" },
  NO_SHIFT: { label: "Smena topilmadi", color: "bg-warning-100 text-warning-700 border-warning-200" },
};

export function AttendanceEventsTable({ events }: AttendanceEventsTableProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedPicture, setSelectedPicture] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const getImageUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    return `${apiUrl.replace("/api", "")}${path}`;
  };

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-secondary border border-border rounded-xl bg-surface">
        Skanerlash yozuvlari topilmadi
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface shadow-sm mt-6">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-surface-hover/50 text-secondary border-b border-border">
          <tr>
            <th className="px-4 py-3 font-medium">Vaqt</th>
            <th className="px-4 py-3 font-medium">Tur</th>
            <th className="px-4 py-3 font-medium">Qurilma (IP)</th>
            <th className="px-4 py-3 font-medium">Xodim ID / Ism</th>
            <th className="px-4 py-3 font-medium">Holat</th>
            <th className="px-4 py-3 font-medium w-10 text-center"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {events.map((event) => {
            const status = statusConfig[event.status] || { label: event.status, color: "bg-surface text-secondary" };
            const isExpanded = expandedIds.has(event.id);
            
            return (
              <Fragment key={event.id}>
                <tr 
                  className="hover:bg-surface-hover transition-colors cursor-pointer"
                  onClick={() => toggleExpand(event.id)}
                >
                <td className="px-4 py-3 font-medium text-text">
                  {format(new Date(event.eventAt), "dd MMM yyyy, HH:mm:ss", { locale: uz })}
                </td>
                <td className="px-4 py-3">
                  {event.rawStatus === "checkIn" ? (
                    <span className="text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded">Kirish</span>
                  ) : event.rawStatus === "checkOut" ? (
                    <span className="text-warning-600 font-medium bg-warning-50 px-2 py-0.5 rounded">Chiqish</span>
                  ) : (
                    <span className="text-secondary">{event.rawStatus}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-secondary text-xs">
                  {event.deviceIp}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-text">
                    {event.user ? `${event.user.last_name} ${event.user.first_name}` : "-"}
                  </div>
                  <div className="text-xs text-secondary font-mono">
                    ID: {event.employeeNoStr}
                  </div>
                </td>
                  <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${status.color}`}>
                    {status.label}
                  </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 text-secondary hover:text-text hover:bg-surface border border-transparent hover:border-border rounded transition-all inline-flex items-center justify-center">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-surface-hover/30 border-t border-border/50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="flex gap-6 items-start ml-12">
                        {event.picturePath ? (
                          <div 
                            className="relative w-32 h-32 rounded-lg overflow-hidden border border-border shadow-sm shrink-0 bg-surface cursor-pointer group"
                            onClick={() => setSelectedPicture(event.picturePath as string)}
                          >
                            <Image
                              src={getImageUrl(event.picturePath)}
                              alt={`Yuz skaner - ${event.employeeNoStr}`}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                               <div className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full font-medium transition-opacity">
                                 Kattalashtirish
                               </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-secondary bg-surface shrink-0">
                            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-xs">Rasm yo'q</span>
                          </div>
                        )}
                        <div className="space-y-3 flex-1 text-sm text-secondary">
                          <div className="grid grid-cols-2 gap-4 max-w-lg">
                            <div>
                              <div className="text-xs font-medium uppercase text-text-muted mb-1">Xodim ma'lumoti</div>
                              <div className="text-text">ID raqam: {event.employeeNoStr}</div>
                              {event.user && (
                                <div className="text-text">{event.user.first_name} {event.user.last_name}</div>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-medium uppercase text-text-muted mb-1">Tizim holati</div>
                              <div className="text-text">Status: {event.status}</div>
                              <div className="text-text">Event: {event.rawStatus}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      {selectedPicture && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200"
          onClick={() => setSelectedPicture(null)}
        >
          <button 
            className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10 p-2.5 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
            onClick={() => setSelectedPicture(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <div 
            className="relative w-full max-w-3xl h-full max-h-[85vh] rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={getImageUrl(selectedPicture)}
              alt="Hodim rasmi"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
