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
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  });

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }));
    }, 60 * 1000); // Har daqiqada yangilash

    return () => clearInterval(id);
  }, []);

  return <span>{time}</span>;
}

export default function BoardPage() {
  const { data, isLoading, isError, dataUpdatedAt } = useQuery<BoardEntry[]>({
    queryKey: ["board"],
    queryFn: fetchBoard,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : null;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-5 border-b border-gray-200">
        <img src="/logo.png" alt="Vitalis" className="h-10 object-contain" />
        <div className="text-center">
          <p className="text-2xl font-semibold tracking-wide text-gray-700">Bemor joylashuvi</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold text-gray-800">
            <Clock />
          </p>
          {lastUpdated && <p className="text-sm text-gray-400 mt-0.5">Yangilandi: {lastUpdated}</p>}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-8">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-4xl text-gray-400 font-light">Yuklanmoqda...</p>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center h-full">
            <p className="text-3xl text-gray-400 font-light">Ma&apos;lumot yuklanmadi. Iltimos, sahifani yangilang.</p>
          </div>
        )}

        {!isLoading && !isError && data && data.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-4xl text-gray-400 font-light">Hozircha bemorlar yo&apos;q</p>
          </div>
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <div className="grid grid-cols-2 gap-0 border border-gray-200 rounded-lg overflow-hidden">
            {data.map((entry: any, i: number) => (
              <div key={i} className={`flex items-center gap-6 px-10 py-6 border-b border-gray-200 ${i % 2 === 0 ? "border-r border-gray-200" : ""} ${i % 4 < 2 ? "bg-white" : "bg-gray-50"}`}>
                <span className="text-5xl font-bold text-gray-900 shrink-0 tabular-nums whitespace-nowrap">{entry.roomName}</span>
                <span className="w-px h-12 bg-gray-300 shrink-0" />
                <span className="text-4xl font-medium text-gray-800 leading-tight min-w-0 truncate">
                  {entry.lastName} {entry.firstName}
                </span>
              </div>
            ))}
            {/* Pad odd count so grid doesn't leave empty bottom-right without border */}
            {data.length % 2 !== 0 && <div className={`px-10 py-6 ${data.length % 4 < 2 ? "bg-white" : "bg-gray-50"}`} />}
          </div>
        )}
      </main>
    </div>
  );
}
