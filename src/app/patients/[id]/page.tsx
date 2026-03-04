"use client";

import { Sheet } from "@/components/ui/sheet";
import { api } from "@/lib/api";
import { PATIENTS_MOCK_DATA } from "@/lib/mock-data";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Calendar, CheckCircle2, Clock, CreditCard, Download, Edit, FileText, ImageIcon, Paperclip, Phone, Plus, Upload, User, XCircle } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  gender: "male" | "female";
  birth_date: string | null;
}

interface TimelineEvent {
  id: string;
  type: "visit" | "payment" | "file";
  date: string;
  department?: string;
  department_color?: string;
  title: string;
  description?: string;
  amount?: number;
  status?: "PAID" | "PENDING" | "CANCELLED";
  payment_method?: string;
  file_name?: string;
  file_type?: "pdf" | "image" | "doc" | "other";
  file_size?: string;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_DEPARTMENTS = [
  { id: "d1", name: "Cardiology", color: "bg-blue-100 text-blue-700" },
  { id: "d2", name: "Neurology", color: "bg-purple-100 text-purple-700" },
  { id: "d3", name: "Pediatrics", color: "bg-green-100 text-green-700" },
  { id: "d4", name: "Orthopedics", color: "bg-amber-100 text-amber-700" },
  { id: "d5", name: "Emergency", color: "bg-rose-100 text-rose-700" },
  { id: "d6", name: "Radiology", color: "bg-cyan-100 text-cyan-700" },
];

const MOCK_TIMELINE: Record<string, TimelineEvent[]> = {
  default: [
    {
      id: "evt-1",
      type: "visit",
      date: "2026-02-25T09:00:00.000Z",
      department: "Cardiology",
      department_color: "bg-blue-100 text-blue-700",
      title: "Cardiology Consultation",
      description: "Routine cardiac checkup. ECG performed. No abnormalities detected.",
    },
    {
      id: "evt-2",
      type: "payment",
      date: "2026-02-25T10:30:00.000Z",
      title: "Payment received",
      amount: 450.0,
      status: "PAID",
      payment_method: "Card",
    },
    {
      id: "evt-3",
      type: "file",
      date: "2026-02-25T10:35:00.000Z",
      title: "ECG Report uploaded",
      file_name: "ecg-report-2026-02-25.pdf",
      file_type: "pdf",
      file_size: "1.2 MB",
    },
    {
      id: "evt-4",
      type: "visit",
      date: "2026-02-10T11:00:00.000Z",
      department: "Radiology",
      department_color: "bg-cyan-100 text-cyan-700",
      title: "MRI Scan — Radiology",
      description: "Brain MRI scan ordered by neurologist. Results pending review.",
    },
    {
      id: "evt-5",
      type: "payment",
      date: "2026-02-10T12:00:00.000Z",
      title: "Payment pending",
      amount: 320.0,
      status: "PENDING",
      payment_method: "Insurance",
    },
    {
      id: "evt-6",
      type: "file",
      date: "2026-02-10T13:10:00.000Z",
      title: "MRI Scan image uploaded",
      file_name: "mri-brain-scan.jpg",
      file_type: "image",
      file_size: "4.8 MB",
    },
    {
      id: "evt-7",
      type: "file",
      date: "2026-02-10T13:12:00.000Z",
      title: "Referral letter uploaded",
      file_name: "referral-neurology.pdf",
      file_type: "pdf",
      file_size: "340 KB",
    },
    {
      id: "evt-8",
      type: "visit",
      date: "2026-01-18T14:00:00.000Z",
      department: "Orthopedics",
      department_color: "bg-amber-100 text-amber-700",
      title: "Orthopedics — Knee Examination",
      description: "Patient reported knee pain. X-ray ordered. Prescribed physiotherapy for 4 weeks.",
    },
    {
      id: "evt-9",
      type: "payment",
      date: "2026-01-18T15:00:00.000Z",
      title: "Payment received",
      amount: 220.0,
      status: "PAID",
      payment_method: "Cash",
    },
    {
      id: "evt-10",
      type: "payment",
      date: "2025-12-05T10:00:00.000Z",
      title: "Payment cancelled",
      amount: 180.0,
      status: "CANCELLED",
      payment_method: "Card",
    },
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  PAID: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: CheckCircle2, dot: "bg-green-500" },
  PENDING: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: Clock, dot: "bg-amber-500" },
  CANCELLED: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: XCircle, dot: "bg-red-500" },
};

const FILE_ICONS = {
  pdf: { icon: FileText, color: "text-red-500", bg: "bg-red-50" },
  image: { icon: ImageIcon, color: "text-blue-500", bg: "bg-blue-50" },
  doc: { icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
  other: { icon: Paperclip, color: "text-gray-500", bg: "bg-gray-50" },
};

const TYPE_DOT: Record<string, { bg: string; icon: React.ElementType; iconColor: string }> = {
  visit: { bg: "bg-primary-100", icon: Building2, iconColor: "text-primary-600" },
  payment: { bg: "bg-green-100", icon: CreditCard, iconColor: "text-green-600" },
  file: { bg: "bg-slate-100", icon: Paperclip, iconColor: "text-slate-600" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

// ─── File Attach Button ────────────────────────────────────────────────────────

function AttachFileButton({ visitId }: { visitId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [attached, setAttached] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttached(file.name);
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
      {attached ? (
        <span className="text-xs text-primary-600 font-medium flex items-center gap-1 bg-primary-50 px-2 py-0.5 rounded-full">
          <Paperclip className="w-3 h-3" />
          {attached}
        </span>
      ) : null}
      <button
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-text-secondary bg-surface border border-border hover:bg-surface-hover hover:text-primary-600 transition-colors cursor-pointer"
        title="Attach file to this visit"
      >
        <Upload className="w-3 h-3" />
        Attach file
      </button>
    </div>
  );
}

// ─── Event Cards ───────────────────────────────────────────────────────────────

function VisitCard({ event }: { event: TimelineEvent }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${event.department_color || "bg-gray-100 text-gray-700"}`}>
          <Building2 className="w-3 h-3" />
          {event.department}
        </span>
        <span className="text-xs text-text-muted">{formatTime(event.date)}</span>
      </div>
      {/* Title + description */}
      <div>
        <p className="font-medium text-text-primary text-sm">{event.title}</p>
        {event.description && <p className="text-xs text-text-secondary leading-relaxed mt-1">{event.description}</p>}
      </div>
      {/* Attach file */}
      <div className="pt-1 border-t border-border">
        <AttachFileButton visitId={event.id} />
      </div>
    </div>
  );
}

function PaymentCard({ event }: { event: TimelineEvent }) {
  const s = STATUS_STYLES[event.status ?? "PENDING"];
  const StatusIcon = s.icon;
  return (
    <div className={`border rounded-lg p-4 flex items-center justify-between gap-4 ${s.bg} ${s.border}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s.bg}`}>
          <StatusIcon className={`w-4 h-4 ${s.text}`} />
        </div>
        <div>
          <p className={`text-sm font-medium ${s.text}`}>{event.title}</p>
          {event.payment_method && (
            <div className="flex items-center gap-1 mt-0.5">
              <CreditCard className="w-3 h-3 text-text-muted" />
              <span className="text-xs text-text-muted">{event.payment_method}</span>
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className={`text-base font-bold ${s.text}`}>${Number(event.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        <span className="text-xs text-text-muted">{formatTime(event.date)}</span>
      </div>
    </div>
  );
}

function FileCard({ event }: { event: TimelineEvent }) {
  const ft = FILE_ICONS[event.file_type ?? "other"];
  const FileIcon = ft.icon;
  return (
    <div className="bg-surface border border-border rounded-lg p-3.5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${ft.bg} flex items-center justify-center shrink-0`}>
          <FileIcon className={`w-4 h-4 ${ft.color}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">{event.file_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-text-muted">{event.file_size}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-xs text-text-muted">{formatTime(event.date)}</span>
          </div>
        </div>
      </div>
      <button className="p-1.5 rounded-md hover:bg-surface-hover text-text-secondary transition-colors cursor-pointer" title="Download">
        <Download className="w-4 h-4" />
      </button>
    </div>
  );
}

function EventCard({ event }: { event: TimelineEvent }) {
  if (event.type === "visit") return <VisitCard event={event} />;
  if (event.type === "payment") return <PaymentCard event={event} />;
  if (event.type === "file") return <FileCard event={event} />;
  return null;
}

// ─── Add Visit Sheet ───────────────────────────────────────────────────────────

function AddVisitForm({ onCancel }: { onCancel: () => void }) {
  const [selectedDept, setSelectedDept] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary-500" />
          Department
        </label>
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm cursor-pointer"
        >
          <option value="">Select department...</option>
          {MOCK_DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          Visit Date
        </label>
        <input
          type="datetime-local"
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-500" />
          Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe the visit, diagnosis, or treatment..."
          rows={4}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-primary-500" />
          Attach Files (optional)
        </label>
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-surface-hover transition-colors">
          <Upload className="w-5 h-5 text-text-muted mb-1" />
          <span className="text-xs text-text-muted">Click to upload or drag & drop</span>
          <input type="file" multiple className="hidden" />
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-surface border border-border text-text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          Save Visit
        </button>
      </div>
    </div>
  );
}

// ─── Edit Patient Form ─────────────────────────────────────────────────────────

function EditPatientForm({ patient, onCancel }: { patient: Patient; onCancel: () => void }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            First Name
          </label>
          <input
            defaultValue={patient.first_name}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" />
            Last Name
          </label>
          <input
            defaultValue={patient.last_name}
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Phone className="w-4 h-4 text-primary-500" />
          Phone Number
        </label>
        <input
          defaultValue={patient.phone_number}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-500" />
          Birth Date
        </label>
        <input
          type="date"
          defaultValue={patient.birth_date ?? ""}
          className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-text-primary">Gender</label>
        <div className="flex gap-4">
          {["male", "female"].map((g) => (
            <label key={g} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="gender" value={g} defaultChecked={patient.gender === g} className="w-4 h-4 accent-primary-600 cursor-pointer" />
              <span className="text-sm text-text-secondary capitalize">{g}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-surface border border-border text-text-secondary hover:bg-surface-hover px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm shadow-primary-600/20 cursor-pointer"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [sheetMode, setSheetMode] = useState<"visit" | "edit" | null>(null);

  const { data: patientData } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => api.get(`/patients/${id}`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const { data: timelineData } = useQuery({
    queryKey: ["patient-timeline", id],
    queryFn: () => api.get(`/patients/${id}/timeline`).then((res) => res.data),
    refetchOnWindowFocus: false,
  });

  const patient: Patient = patientData ?? PATIENTS_MOCK_DATA.find((p) => p.id === id) ?? PATIENTS_MOCK_DATA[0];
  const timeline: TimelineEvent[] = timelineData ?? MOCK_TIMELINE[id] ?? MOCK_TIMELINE.default;

  const grouped = timeline.reduce<Record<string, TimelineEvent[]>>((acc, evt) => {
    const day = new Date(evt.date).toDateString();
    if (!acc[day]) acc[day] = [];
    acc[day].push(evt);
    return acc;
  }, {});

  const groupedEntries = Object.entries(grouped).sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());

  const fullName = `${patient.first_name} ${patient.last_name}`;
  const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase();
  const visitCount = timeline.filter((e) => e.type === "visit").length;
  const fileCount = timeline.filter((e) => e.type === "file").length;
  const totalPaid = timeline.filter((e) => e.type === "payment" && e.status === "PAID").reduce((s, e) => s + Number(e.amount ?? 0), 0);

  return (
    <div className="p-6 max-w-6xl mx-auto w-full space-y-5">
      {/* Back link */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/patients" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Patients
        </Link>
      </motion.div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* ── LEFT SIDEBAR ───────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 }} className="w-full lg:w-72 shrink-0 space-y-4">
          {/* Patient card */}
          <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
            {/* Avatar + Name */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">{initials}</div>
              <div>
                <h1 className="text-lg font-bold text-text-primary leading-tight">{fullName}</h1>
                <span className="text-xs text-text-muted capitalize">{patient.gender}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Details */}
            <div className="space-y-2.5">
              {patient.birth_date && (
                <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                  <Calendar className="w-4 h-4 text-text-muted shrink-0" />
                  {new Date(patient.birth_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm text-text-secondary">
                <Phone className="w-4 h-4 text-text-muted shrink-0" />
                <span className="font-mono">{patient.phone_number}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-text-primary">{visitCount}</p>
                <p className="text-[11px] text-text-muted">Visits</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 0 })}</p>
                <p className="text-[11px] text-text-muted">Paid</p>
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{fileCount}</p>
                <p className="text-[11px] text-text-muted">Files</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Actions</p>

            <button
              onClick={() => setSheetMode("visit")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors cursor-pointer shadow-sm shadow-primary-600/20"
            >
              <Plus className="w-4 h-4" />
              New Department Visit
            </button>

            <button
              onClick={() => setSheetMode("edit")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary text-sm font-medium transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              Edit Patient Info
            </button>

            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary text-sm font-medium transition-colors cursor-pointer">
              <CreditCard className="w-4 h-4" />
              Record Payment
            </button>

            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary text-sm font-medium transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              Upload File
            </button>
          </div>

          {/* Departments visited */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Departments Visited</p>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(timeline.filter((e) => e.type === "visit" && e.department).map((e) => e.department!))].map((dept) => {
                const deptColor = timeline.find((e) => e.department === dept)?.department_color ?? "bg-gray-100 text-gray-700";
                return (
                  <span key={dept} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${deptColor}`}>
                    <Building2 className="w-3 h-3" />
                    {dept}
                  </span>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT TIMELINE ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="flex-1 min-w-0 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">Activity Timeline</h2>
            <button
              onClick={() => setSheetMode("visit")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Visit
            </button>
          </div>

          {groupedEntries.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-12 text-center">
              <p className="text-text-secondary text-sm">No activity recorded yet.</p>
            </div>
          ) : (
            groupedEntries.map(([day, events], groupIdx) => (
              <div key={day}>
                {/* Date divider */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-xs font-medium text-text-secondary">{formatDate(events[0].date)}</span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Events */}
                <div className="relative ml-4">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-3">
                    {events.map((event, evtIdx) => {
                      const dot = TYPE_DOT[event.type];
                      const DotIcon = dot.icon;
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: groupIdx * 0.04 + evtIdx * 0.03 }}
                          className="flex gap-4"
                        >
                          <div className="relative z-10 shrink-0">
                            <div className={`w-8 h-8 rounded-full ${dot.bg} flex items-center justify-center border-2 border-surface-secondary`}>
                              <DotIcon className={`w-3.5 h-3.5 ${dot.iconColor}`} />
                            </div>
                          </div>
                          <div className="flex-1 pb-1">
                            <EventCard event={event} />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      </div>

      {/* ── SHEETS ─────────────────────────────────────────────────────────── */}
      <Sheet isOpen={sheetMode === "visit"} onClose={() => setSheetMode(null)} title="New Department Visit" description="Record a new department visit for this patient.">
        <AddVisitForm onCancel={() => setSheetMode(null)} />
      </Sheet>

      <Sheet isOpen={sheetMode === "edit"} onClose={() => setSheetMode(null)} title="Edit Patient" description="Update the patient's personal information.">
        <EditPatientForm patient={patient} onCancel={() => setSheetMode(null)} />
      </Sheet>
    </div>
  );
}
