"use client";

import { useEffect, useRef, useState } from "react";

interface BoardEntry {
  roomName: string;
  firstName: string;
  lastName: string;
  admittedAt: string;
}

const COLS = 2; // chap va o'ng panel
const CARD_H = 52; // px — har bir qator balandligi
const PAGE_INTERVAL = 5_000;

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

function formatAdmittedAt(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function Clock() {
  const fmt = () => new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

  const [time, setTime] = useState(fmt);

  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 30_000);

    return () => clearInterval(id);
  }, []);

  return <>{time}</>;
}

// ─── Column header (takrorlanadi — chap va o'ng uchun) ───────────────────────
function ColHeader() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "100px 1fr 100px",
        alignItems: "center",
        padding: "0 18px",
        height: 36,
        background: "rgba(0,0,0,0.02)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        borderRadius: "10px 10px 0 0",
        flexShrink: 0,
      }}
    >
      <span style={thStyle}>Palata raqam</span>
      <span style={thStyle}>Ism familyasi</span>
      <span style={{ ...thStyle, textAlign: "right" }}>Yotgan kuni</span>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "rgba(0, 0, 0, 0.4)",
  fontWeight: 500,
};

// ─── Single row ──────────────────────────────────────────────────────────────
function Row({ entry, even }: { entry: BoardEntry; even: boolean }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "100px 1fr 100px",
        alignItems: "center",
        padding: "0 18px",
        height: CARD_H,
        background: even ? "rgba(0, 0, 0, 0.015)" : "transparent",
        borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0, 0, 0, 0.04)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = even ? "rgba(0, 0, 0, 0.015)" : "transparent")}
    >
      <span
        style={{
          fontSize: "clamp(13px, 1.3vw, 17px)",
          fontWeight: 400,
          color: "rgba(0, 0, 0, 0.6)",
          letterSpacing: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {entry.roomName}
      </span>

      <span
        style={{
          fontSize: "clamp(14px, 1.5vw, 20px)",
          fontWeight: 400,
          color: "rgba(0, 0, 0, 0.85)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          paddingRight: 12,
        }}
      >
        {entry.lastName} {entry.firstName}
      </span>

      <span
        style={{
          fontSize: "clamp(11px, 1vw, 14px)",
          color: "rgba(0, 0, 0, 0.4)",
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
        }}
      >
        {formatAdmittedAt(entry.admittedAt)}
      </span>
    </div>
  );
}

// ─── Panel (chap yoki o'ng) ───────────────────────────────────────────────────
function Panel({ items, startIndex }: { items: BoardEntry[]; startIndex: number }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        borderRadius: 10,
        overflow: "hidden",
        minWidth: 0,
        backgroundColor: "#ffffff",
      }}
    >
      <ColHeader />
      <div style={{ flex: 1, overflow: "hidden" }}>
        {items.map((entry, i) => (
          <Row key={i} entry={entry} even={i % 2 === 0} />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BoardPage() {
  const [data, setData] = useState<BoardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const mainRef = useRef<HTMLDivElement>(null);
  const [rowsPerPanel, setRowsPerPanel] = useState(6);
  const [currentPage, setCurrentPage] = useState(0);

  async function load() {
    try {
      const res = await fetch("/api/wards/board", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json: BoardEntry[] = await res.json();
      setData(json);
      setError(false);
      setLastUpdated(new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function calc() {
      if (!mainRef.current) return;
      const h = mainRef.current.clientHeight - 16;
      const available = h - 36; // minus ColHeader height
      const rows = Math.max(1, Math.floor(available / CARD_H));
      setRowsPerPanel(rows);
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const perPage = rowsPerPanel * COLS;
  const pageCount = Math.max(1, Math.ceil(data.length / perPage));

  useEffect(() => {
    setCurrentPage(0);
  }, [data]);

  useEffect(() => {
    if (pageCount <= 1) {
      setCurrentPage(0);
      return;
    }
    const id = setInterval(() => setCurrentPage((p) => (p + 1) % pageCount), PAGE_INTERVAL);
    return () => clearInterval(id);
  }, [pageCount]);

  const pageItems = data.slice(currentPage * perPage, (currentPage + 1) * perPage);
  const leftItems = pageItems.slice(0, rowsPerPanel);
  const rightItems = pageItems.slice(rowsPerPanel, rowsPerPanel * 2);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100dvh",
        background: "#f8fafc",
        color: "#000000",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* ─── Header ─── */}
      <header
        style={{
          height: 58,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          flexShrink: 0,
          borderBottom: "1px solid rgba(0, 0, 0, 0.07)",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              fontSize: 13,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "rgba(0, 0, 0, 0.4)",
              fontWeight: 400,
            }}
          >
            <img src="./logo.png" alt="" style={{ maxWidth: "100px", height: "auto" }} />
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, color: "rgba(0, 0, 0, 0.6)", letterSpacing: 1 }}>Bemorlar joylashuvi</span>
          <span
            style={{
              background: "rgba(0, 0, 0, 0.04)",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              color: "rgba(0, 0, 0, 0.4)",
              letterSpacing: 0.5,
            }}
          >
            Jami: {data.length}
          </span>
        </div>

        <div style={{ textAlign: "right", lineHeight: 1.4 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 300,
              letterSpacing: 2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Clock />
          </div>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main
        ref={mainRef}
        style={{
          flex: 1,
          overflow: "hidden",
          padding: "10px 14px",
          position: "relative",
        }}
      >
        {loading && (
          <Center>
            <Muted>Yuklanmoqda...</Muted>
          </Center>
        )}
        {!loading && error && (
          <Center>
            <Muted>Ma&apos;lumot yuklanmadi. Sahifani yangilang.</Muted>
          </Center>
        )}
        {!loading && !error && data.length === 0 && (
          <Center>
            <Muted>Hozircha bemorlar yo&apos;q</Muted>
          </Center>
        )}

        {!loading && !error && data.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 10,
              height: "100%",
              paddingBottom: pageCount > 1 ? 26 : 0,
            }}
          >
            <Panel items={leftItems} startIndex={0} />
            {/* O'ng panel — ma'lumot bo'lsagina ko'rsatiladi */}
            {rightItems.length > 0 ? (
              <Panel items={rightItems} startIndex={rowsPerPanel} />
            ) : (
              /* Bo'sh placeholder — chap panel kengligini saqlaydi */
              <div style={{ flex: 1 }} />
            )}
          </div>
        )}

        {pageCount > 1 && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "rgba(0, 0, 0, 0.05)",
            }}
          >
            <div
              key={`${currentPage}-${lastUpdated}`}
              style={{
                height: "100%",
                background: "rgba(0, 0, 0, 0.28)",
                animation: `barProgress ${PAGE_INTERVAL}ms linear forwards`,
              }}
            />
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer
        style={{
          height: 36,
          borderTop: "1px solid rgba(0, 0, 0, 0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          flexShrink: 0,
          background: "#ffffff",
        }}
      >
        <span style={{ fontSize: 11, color: "rgba(0, 0, 0, 0.3)", letterSpacing: 1 }}>
          Jami: <b style={{ color: "rgba(0, 0, 0, 0.6)", fontWeight: 500 }}>{data.length}</b> bemor
        </span>

        {pageCount > 1 && (
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 3,
                  borderRadius: 2,
                  width: i === currentPage ? 28 : 16,
                  background: i === currentPage ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0.15)",
                  transition: "all 0.4s ease",
                }}
              />
            ))}
          </div>
        )}

        <span
          style={{
            fontSize: 11,
            color: "rgba(0, 0, 0, 0.3)",
            letterSpacing: 1,
            fontVariantNumeric: "tabular-nums",
            minWidth: 40,
            textAlign: "right",
          }}
        >
          {pageCount > 1 ? `${currentPage + 1} / ${pageCount}` : ""}
        </span>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: .4; transform: scale(0.8); }
        }
        @keyframes barProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>{children}</div>;
}
function Muted({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 22, color: "rgba(0, 0, 0, 0.3)", fontWeight: 300, margin: 0 }}>{children}</p>;
}
