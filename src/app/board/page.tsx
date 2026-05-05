"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

interface BoardEntry {
  roomName: string;
  capacity: number;
  firstName: string;
  lastName: string;
}

async function fetchBoard(): Promise<BoardEntry[]> {
  const res = await fetch("/api/wards/board", { cache: "no-store" });
  if (!res.ok) throw new Error("Serverdan ma'lumot olishda xatolik");
  return res.json();
}

function Clock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
  );
  useEffect(() => {
    const id = setInterval(
      () =>
        setTime(
          new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
        ),
      60_000,
    );
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

// 3 ustun, 20-40 bemor uchun optimal
const COLS = 3;

export default function BoardPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery<BoardEntry[]>({
    queryKey: ["board"],
    queryFn: fetchBoard,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    })
    : null;

  const count = data?.length ?? 0;
  const rows = Math.ceil(count / COLS);

  // Har qator balandligi content maydonini teng bo'lish uchun
  const rowHeightPct = rows > 0 ? `${(100 / rows).toFixed(4)}%` : "auto";

  return (
    <div
      className="bg-white text-black flex flex-col overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Header — 56px fixed */}
      <header
        className="flex items-center justify-between px-8 border-b border-gray-200 shrink-0"
        style={{ height: 56 }}
      >
        <img src="/logo.png" alt="Vitalis" className="h-7 object-contain" />
        <p className="text-lg font-semibold tracking-wide text-gray-600">
          Bemor joylashuvi
        </p>
        <div className="text-right leading-tight">
          <p className="text-xl font-mono font-bold text-gray-800">
            <Clock />
          </p>
          {lastUpdated && (
            <p className="text-[11px] text-gray-400">Yangilandi: {lastUpdated}</p>
          )}
        </div>
      </header>

      {/* Main — qolgan barcha joy */}
      <main className="flex-1 overflow-hidden p-3">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl text-gray-400 font-light">Yuklanmoqda...</p>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center h-full">
            <p className="text-xl text-gray-400 text-center">
              Ma&apos;lumot yuklanmadi. Sahifani yangilang.
            </p>
          </div>
        )}

        {!isLoading && !isError && count === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-2xl text-gray-400 font-light">
              Hozircha bemorlar yo&apos;q
            </p>
          </div>
        )}

        {!isLoading && !isError && count > 0 && (
          <div
            className="border border-gray-200 rounded-lg overflow-hidden h-full"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, ${rowHeightPct})`,
            }}
          >
            {data!.map((entry, i) => {
              const col = i % COLS;
              const row = Math.floor(i / COLS);
              const isLastCol = col === COLS - 1;
              const isLastRow = row === rows - 1;
              const isEvenRow = row % 2 === 0;

              return (
                <div
                  key={i}
                  className={[
                    "flex items-center gap-3 px-5 overflow-hidden",
                    !isLastCol ? "border-r border-gray-200" : "",
                    !isLastRow ? "border-b border-gray-200" : "",
                    isEvenRow ? "bg-white" : "bg-gray-50",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {/* Xona raqami */}
                  <span
                    className="font-bold text-gray-900 shrink-0 tabular-nums whitespace-nowrap"
                    style={{ fontSize: "clamp(14px, 2.2vw, 28px)" }}
                  >
                    {entry.roomName}
                  </span>

                  {/* Ajratuvchi chiziq */}
                  <span className="w-px bg-gray-300 shrink-0 self-stretch my-2" />

                  {/* Bemor ismi */}
                  <span
                    className="font-medium text-gray-800 leading-tight truncate min-w-0"
                    style={{ fontSize: "clamp(13px, 1.9vw, 24px)" }}
                  >
                    {entry.lastName} {entry.firstName}
                  </span>
                </div>
              );
            })}

            {/* Oxirgi qatorni to'ldirish */}
            {count % COLS !== 0 &&
              Array.from({ length: COLS - (count % COLS) }).map((_, i) => (
                <div
                  key={`pad-${i}`}
                  className={(rows - 1) % 2 === 0 ? "bg-white" : "bg-gray-50"}
                />
              ))}
          </div>
        )}
      </main>
    </div>
  );
}
