"use client";

import { Modal } from "@/components/design-system/Modal";
import { BulkAssignResult, isUnderstaffed, Shift, ShiftStaffRole } from "@/shared/lib/shifts-api";
import { ROLE_STYLES } from "@/shared/lib/status-styles";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Loader2, UserPlus, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { StaffMember, useBulkAssign, useStaffMembers } from "../api";

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Tanlanishi mumkin bo'lgan smenalar (board oynasidagi). */
  shifts: Shift[];
}

/** `Date.getDay()` (0 = yakshanba) bo'yicha indekslanadi. */
const WEEKDAY_SHORT = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

/** Tafsilotli skip hisobotida ko'rsatiladigan maksimal qator. */
const MAX_SKIP_ROWS = 8;

/**
 * Matritsa qatori — bir xil vaqt oralig'idagi smenalar.
 *
 * Shablon nomi bo'yicha guruhlash mumkin emas: `POST /shifts/generate`
 * `templateName` ni bazaga yozmaydi (`shifts.service.ts:236`), shuning uchun
 * generatsiya qilingan smenalarda `note` doim `null`. Vaqt oralig'i esa
 * shablonni aynan aniqlaydi.
 */
interface MatrixRow {
  key: string;
  label: string;
  startMinutes: number;
  /** dayKey → smena */
  cells: Map<string, Shift>;
}

const dayKeyOf = (iso: string) => format(new Date(iso), "yyyy-MM-dd");
const timeKeyOf = (s: Shift) =>
  `${format(new Date(s.startAt), "HH:mm")}–${format(new Date(s.endAt), "HH:mm")}`;

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({ isOpen, onClose, shifts }) => {
  const { data: staffMembers = [] } = useStaffMembers();
  const bulkAssign = useBulkAssign();

  // Bo'limlar smenalardan olinadi — bo'sh matritsa ochilib qolmasligi uchun.
  const departments = useMemo(() => {
    const map = new Map<string, string>();
    shifts.forEach((s) => map.set(s.departmentId, s.department.name));
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [shifts]);

  const [departmentId, setDepartmentId] = useState<string>("");
  const [shiftIds, setShiftIds] = useState<string[]>([]);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [onlyUnderstaffed, setOnlyUnderstaffed] = useState(true);
  const [preview, setPreview] = useState<BulkAssignResult | null>(null);
  /** `Shift+click` bilan diapazon tanlash uchun oxirgi bosilgan katak. */
  const [anchor, setAnchor] = useState<{ rowKey: string; dayIndex: number } | null>(null);

  const activeDepartmentId = departmentId || departments[0]?.id || "";

  const deptShifts = useMemo(
    () => shifts.filter((s) => s.departmentId === activeDepartmentId),
    [shifts, activeDepartmentId],
  );

  /** Ustunlar — smenasi bor kunlar, o'sish tartibida. */
  const days = useMemo(() => {
    const set = new Set(deptShifts.map((s) => dayKeyOf(s.startAt)));
    return [...set].sort();
  }, [deptShifts]);

  /** Qatorlar — vaqt oralig'i bo'yicha, boshlanish vaqti tartibida. */
  const rows = useMemo(() => {
    const map = new Map<string, MatrixRow>();
    for (const s of deptShifts) {
      const key = timeKeyOf(s);
      let row = map.get(key);
      if (!row) {
        const start = new Date(s.startAt);
        row = {
          key,
          label: s.note || key,
          startMinutes: start.getHours() * 60 + start.getMinutes(),
          cells: new Map(),
        };
        map.set(key, row);
      }
      // Nom bo'lsa vaqt oralig'idan ustun turadi.
      if (s.note && row.label === key) row.label = s.note;
      row.cells.set(dayKeyOf(s.startAt), s);
    }
    return [...map.values()].sort((a, b) => a.startMinutes - b.startMinutes);
  }, [deptShifts]);

  /** Filtr yoqilganda to'lgan smenalar tanlanmaydi (lekin matritsada qoladi). */
  const isSelectable = (s: Shift) => !onlyUnderstaffed || isUnderstaffed(s.staffing);

  const selected = useMemo(() => new Set(shiftIds), [shiftIds]);

  const applySelection = (next: string[]) => {
    setShiftIds(next);
    setPreview(null);
  };

  const toggleCell = (rowKey: string, dayIndex: number, shift: Shift, rangeSelect: boolean) => {
    if (!isSelectable(shift)) return;

    const row = rows.find((r) => r.key === rowKey);
    if (rangeSelect && anchor && anchor.rowKey === rowKey && row) {
      const [from, to] = [anchor.dayIndex, dayIndex].sort((a, b) => a - b);
      const inRange = days
        .slice(from, to + 1)
        .map((d) => row.cells.get(d))
        .filter((s): s is Shift => !!s && isSelectable(s))
        .map((s) => s.id);
      applySelection([...new Set([...shiftIds, ...inRange])]);
      return;
    }

    setAnchor({ rowKey, dayIndex });
    applySelection(
      selected.has(shift.id) ? shiftIds.filter((id) => id !== shift.id) : [...shiftIds, shift.id],
    );
  };

  /** Qator yoki ustun sarlavhasi — tanlanadigan hamma katakni almashtiradi. */
  const toggleGroup = (groupShifts: Shift[]) => {
    const ids = groupShifts.filter(isSelectable).map((s) => s.id);
    if (!ids.length) return;
    const allSelected = ids.every((id) => selected.has(id));
    applySelection(
      allSelected ? shiftIds.filter((id) => !ids.includes(id)) : [...new Set([...shiftIds, ...ids])],
    );
  };

  /** Tanlangan smenalar qator bo'yicha guruhlangan chiplar. */
  const selectionChips = useMemo(
    () =>
      rows
        .map((row) => ({
          key: row.key,
          label: row.label,
          ids: [...row.cells.values()].filter((s) => selected.has(s.id)).map((s) => s.id),
        }))
        .filter((c) => c.ids.length > 0),
    [rows, selected],
  );

  /** Tanlangan xodimlarni backend kutgan {userId, role} shakliga o'giradi. */
  const staffPayload = useMemo(
    () =>
      userIds
        .map((id) => staffMembers.find((m) => m.id === id))
        .filter((m): m is StaffMember => !!m)
        .map((m) => ({ userId: m.id, role: m.role as ShiftStaffRole })),
    [userIds, staffMembers],
  );

  const staffGroups = useMemo(() => {
    const byRole = new Map<string, StaffMember[]>();
    for (const m of staffMembers) {
      const list = byRole.get(m.role) ?? [];
      list.push(m);
      byRole.set(m.role, list);
    }
    return Object.keys(ROLE_STYLES)
      .filter((role) => byRole.has(role))
      .map((role) => ({
        role: role as ShiftStaffRole,
        title: ROLE_STYLES[role].label,
        members: byRole.get(role)!,
      }));
  }, [staffMembers]);

  const toggleUser = (id: string) => {
    setUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setPreview(null);
  };

  const toggleUserGroup = (members: StaffMember[]) => {
    const ids = members.map((m) => m.id);
    const allSelected = ids.every((id) => userIds.includes(id));
    setUserIds((prev) =>
      allSelected ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])],
    );
    setPreview(null);
  };

  const totalPairs = shiftIds.length * staffPayload.length;
  const canSubmit = shiftIds.length > 0 && staffPayload.length > 0;

  const run = (dryRun: boolean) => {
    bulkAssign.mutate(
      { shiftIds, staff: staffPayload, dryRun },
      {
        onSuccess: (res) => {
          if (dryRun) {
            setPreview(res);
            return;
          }
          toast.success(
            res.assigned > 0
              ? `${res.assigned} ta biriktirish qo'shildi${res.skipped.length ? `, ${res.skipped.length} tasi o'tkazib yuborildi` : ""}`
              : "Yangi biriktirish qo'shilmadi",
          );
          onClose();
        },
        onError: () => toast.error("Xatolik yuz berdi"),
      },
    );
  };

  // ── Skip hisobotini o'qiladigan matnga aylantirish ──────────────────────────
  const shiftLabel = (shiftId: string) => {
    const s = deptShifts.find((x) => x.id === shiftId) ?? shifts.find((x) => x.id === shiftId);
    if (!s) return "Smena";
    const d = new Date(s.startAt);
    return `${WEEKDAY_SHORT[d.getDay()]} ${format(d, "dd.MM")} · ${s.note || timeKeyOf(s)}`;
  };

  const userLabel = (userId: string) => {
    const m = staffMembers.find((x) => x.id === userId);
    return m ? `${m.first_name.charAt(0)}. ${m.last_name}` : "Xodim";
  };

  const todayKey = format(new Date(), "yyyy-MM-dd");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ommaviy biriktirish" size="2xl" closeOnBackdrop={false}>
      {/* ── Bo'lim + filtr ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-text-muted">Bo&apos;lim</label>
          <select
            value={activeDepartmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              applySelection([]);
              setAnchor(null);
            }}
            className="border border-border rounded-md px-2.5 py-1.5 text-sm bg-surface min-w-48"
          >
            {departments.length === 0 && <option value="">Smena yo&apos;q</option>}
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-1.5 text-xs text-text-muted cursor-pointer">
          <input
            type="checkbox"
            checked={onlyUnderstaffed}
            onChange={(e) => {
              const on = e.target.checked;
              setOnlyUnderstaffed(on);
              // Filtr yoqilsa, endi tanlab bo'lmaydigan smenalar tanlovdan chiqadi.
              if (on) {
                const stillValid = new Set(
                  deptShifts.filter((s) => isUnderstaffed(s.staffing)).map((s) => s.id),
                );
                applySelection(shiftIds.filter((id) => stillValid.has(id)));
              } else {
                setPreview(null);
              }
            }}
            className="accent-primary"
          />
          Faqat to&apos;lmaganlari
        </label>
      </div>

      {/* ── Matritsa ───────────────────────────────────────────────────────── */}
      {rows.length === 0 ? (
        <div className="border border-border rounded-lg p-8 text-center text-sm text-text-muted italic">
          Bu bo&apos;limda smena yo&apos;q
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-auto max-h-[42vh]">
          <table className="border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 bg-surface-secondary border-b border-r border-border px-3 py-2 text-left text-[11px] font-semibold text-text-muted w-32 min-w-32">
                  Smena turi
                </th>
                {days.map((day, dayIndex) => {
                  const date = new Date(`${day}T00:00:00`);
                  const isToday = day === todayKey;
                  const columnShifts = rows
                    .map((r) => r.cells.get(day))
                    .filter((s): s is Shift => !!s);
                  return (
                    <th
                      key={day}
                      onClick={() => toggleGroup(columnShifts)}
                      title="Shu kundagi barcha smenalarni tanlash"
                      className={`sticky top-0 z-20 bg-surface-secondary border-b border-border px-1 py-2 w-14 min-w-14 cursor-pointer hover:bg-surface-hover transition-colors ${
                        dayIndex > 0 && date.getDate() === 1 ? "border-l border-border" : ""
                      }`}
                    >
                      <div
                        className={`text-[10px] font-medium leading-tight ${isToday ? "text-primary" : "text-text-muted"}`}
                      >
                        {WEEKDAY_SHORT[date.getDay()]}
                      </div>
                      <div
                        className={`text-xs font-semibold leading-tight tabular-nums ${isToday ? "text-primary" : "text-text"}`}
                      >
                        {date.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rowShifts = [...row.cells.values()];
                const selectedInRow = rowShifts.filter((s) => selected.has(s.id)).length;
                return (
                  <tr key={row.key}>
                    <th
                      onClick={() => toggleGroup(rowShifts)}
                      title="Shu turdagi barcha smenalarni tanlash"
                      className="sticky left-0 z-10 bg-surface border-b border-r border-border px-3 py-1.5 text-left cursor-pointer hover:bg-surface-hover transition-colors w-32 min-w-32"
                    >
                      <div className="text-xs font-semibold text-text truncate">{row.label}</div>
                      <div className="text-[10px] text-text-muted tabular-nums">
                        {selectedInRow}/{rowShifts.length}
                      </div>
                    </th>
                    {days.map((day, dayIndex) => {
                      const shift = row.cells.get(day);
                      if (!shift) {
                        return (
                          <td
                            key={day}
                            className="border-b border-border-light text-center text-text-muted/40 text-xs w-14 min-w-14"
                          >
                            –
                          </td>
                        );
                      }

                      const assigned = shift.staffing.assignedDoctors + shift.staffing.assignedNurses;
                      const required = shift.staffing.requiredDoctors + shift.staffing.requiredNurses;
                      const isSel = selected.has(shift.id);
                      const selectable = isSelectable(shift);
                      const short = isUnderstaffed(shift.staffing);

                      return (
                        <td key={day} className="border-b border-border-light p-0.5 w-14 min-w-14">
                          <button
                            type="button"
                            disabled={!selectable}
                            onClick={(e) => toggleCell(row.key, dayIndex, shift, e.shiftKey)}
                            title={`${row.label} · ${format(new Date(shift.startAt), "dd.MM")} · ${assigned}/${required}${selectable ? "" : " — to'lgan"}`}
                            className={`w-full h-7 rounded text-[11px] font-medium tabular-nums transition-colors ${
                              isSel
                                ? "bg-primary text-white"
                                : !selectable
                                  ? "text-text-muted/40 cursor-not-allowed"
                                  : short
                                    ? "bg-warning-50 text-warning hover:bg-warning-100"
                                    : "bg-surface-secondary text-text-muted hover:bg-surface-hover"
                            }`}
                          >
                            {assigned}/{required}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tanlanganlar ───────────────────────────────────────────────────── */}
      {selectionChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {selectionChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => applySelection(shiftIds.filter((id) => !chip.ids.includes(id)))}
              className="flex items-center gap-1 bg-primary-50 text-primary-text rounded-full pl-2.5 pr-1.5 py-0.5 text-xs font-medium hover:brightness-95 transition-all"
            >
              {chip.label} ×{chip.ids.length}
              <X className="w-3 h-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => applySelection([])}
            className="text-xs text-text-muted hover:text-text underline ml-1"
          >
            Tozalash
          </button>
        </div>
      )}

      {/* ── Xodimlar ───────────────────────────────────────────────────────── */}
      <div className="mt-4 space-y-3">
        {staffGroups.length === 0 && (
          <p className="text-sm text-text-muted italic">Xodim topilmadi</p>
        )}
        {staffGroups.map((group) => {
          const selectedCount = group.members.filter((m) => userIds.includes(m.id)).length;
          return (
            <div key={group.role}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-text-muted">
                  {group.title}{" "}
                  <span className="tabular-nums font-normal">
                    ({selectedCount}/{group.members.length})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => toggleUserGroup(group.members)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {selectedCount === group.members.length ? "Bekor qilish" : "Barchasi"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {group.members.map((m) => {
                  const isSel = userIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleUser(m.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        isSel
                          ? "bg-primary text-white border-primary"
                          : "bg-surface text-text-secondary border-border hover:bg-surface-secondary"
                      }`}
                    >
                      {m.first_name} {m.last_name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Hisob ─────────────────────────────────────────────────────────── */}
      <div className="mt-4 rounded-lg bg-surface-secondary border border-border px-4 py-2.5">
        <p className="text-sm text-text tabular-nums">
          <strong>{shiftIds.length}</strong> smena × <strong>{staffPayload.length}</strong> xodim ={" "}
          <strong>{totalPairs}</strong> biriktirish
        </p>
        {totalPairs > 0 && staffPayload.length > 1 && (
          <p className="text-xs text-text-muted mt-0.5">
            Har bir tanlangan xodim har bir tanlangan smenaga biriktiriladi.
          </p>
        )}
      </div>

      {/* ── Preview ───────────────────────────────────────────────────────── */}
      {preview && (
        <div className="mt-3 border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-2.5 bg-surface-secondary border-b border-border">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-success">
              <CheckCircle2 className="w-4 h-4" />
              {preview.toCreate.length} ta biriktiriladi
            </span>
            {preview.skipped.length > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-warning">
                <AlertTriangle className="w-4 h-4" />
                {preview.skipped.length} tasi o&apos;tkazib yuboriladi
              </span>
            )}
          </div>
          {preview.skipped.length > 0 && (
            <ul className="px-4 py-2 space-y-1 max-h-32 overflow-y-auto">
              {preview.skipped.slice(0, MAX_SKIP_ROWS).map((s, i) => (
                <li key={`${s.shiftId}-${s.userId}-${i}`} className="text-xs text-text-secondary">
                  <span className="text-text font-medium">{shiftLabel(s.shiftId)}</span>
                  {" — "}
                  {userLabel(s.userId)}: {s.reason}
                </li>
              ))}
              {preview.skipped.length > MAX_SKIP_ROWS && (
                <li className="text-xs text-text-muted italic">
                  va yana {preview.skipped.length - MAX_SKIP_ROWS} ta
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-5">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text-muted hover:bg-surface-secondary"
        >
          Bekor qilish
        </button>
        <button
          type="button"
          onClick={() => run(true)}
          disabled={!canSubmit || bulkAssign.isPending}
          className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text hover:bg-surface-secondary flex items-center gap-2 disabled:opacity-50"
        >
          {bulkAssign.isPending && !preview && <Loader2 className="w-4 h-4 animate-spin" />}
          Ko&apos;rib chiqish
        </button>
        <button
          type="button"
          onClick={() => run(false)}
          disabled={!canSubmit || bulkAssign.isPending || !preview || preview.toCreate.length === 0}
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold hover:brightness-110 flex items-center gap-2 disabled:opacity-50"
        >
          {bulkAssign.isPending && preview ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {preview ? `${preview.toCreate.length} ta biriktirish` : "Biriktirish"}
        </button>
      </div>
    </Modal>
  );
};
