"use client";

import { useAuth } from "@/hooks/use-auth";
import { Activity, Calendar, ChevronRight, Clock, Plus, Users } from "lucide-react";
import { motion } from "motion/react";

const stats = [
  {
    label: "Active Patients",
    value: "1,284",
    icon: Users,
    color: "text-info-600",
    bg: "bg-info-50",
  },
  {
    label: "Appointments Today",
    value: "42",
    icon: Calendar,
    color: "text-primary",
    bg: "bg-primary-50",
  },
  { label: "Critical Cases", value: "7", icon: Activity, color: "text-danger-600", bg: "bg-danger-50" },
];

const recentPatients = [
  { name: "Sarah Johnson", id: "P-9021", status: "In Treatment", time: "10m ago" },
  { name: "Michael Chen", id: "P-8842", status: "Follow-up", time: "45m ago" },
  { name: "Emma Wilson", id: "P-9103", status: "Discharged", time: "2h ago" },
];

export default function HomePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-text tracking-tight">Dashboard</h2>
          <p className="text-secondary text-sm mt-0.5">Welcome back, {user.first_name}. Here&apos;s what&apos;s happening today.</p>
        </div>
        <button className="bg-primary hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
          <Plus className="w-4 h-4" />
          New Patient
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-surface p-4 rounded-lg border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.bg} ${stat.color} p-2 rounded-md`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-primary bg-primary-50 px-1.5 py-0.5 rounded">+12%</span>
            </div>
            <p className="text-secondary text-xs font-medium">{stat.label}</p>
            <h3 className="text-2xl font-semibold text-text mt-0.5">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Patients */}
        <div className="lg:col-span-2 bg-surface rounded-lg border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text">Recent Patients</h3>
            <button className="text-primary text-xs font-medium hover:underline cursor-pointer">View All</button>
          </div>
          <div className="divide-y divide-border-light">
            {recentPatients.map((patient) => (
              <div key={patient.id} className="px-4 py-3 flex items-center justify-between hover:bg-surface-hover transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-background rounded-md flex items-center justify-center text-text-muted text-sm font-semibold group-hover:bg-surface transition-colors">
                    {patient.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{patient.name}</p>
                    <p className="text-[11px] text-text-muted">{patient.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        patient.status === "In Treatment"
                          ? "bg-info-50 text-info-600"
                          : patient.status === "Follow-up"
                            ? "bg-warning-50 text-warning-600"
                            : "bg-background text-text-muted"
                      }`}
                    >
                      {patient.status}
                    </span>
                    <div className="flex items-center gap-1 text-text-muted text-[10px] mt-0.5 justify-end">
                      <Clock className="w-3 h-3" />
                      {patient.time}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hospital Info */}
        <div className="bg-surface-dark rounded-lg p-5 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-base font-semibold mb-1">{(user as any).hospital ?? "Hospital"}</h3>
            <p className="text-zinc-400 text-xs mb-6">System Status: Optimal</p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center">
                  <Activity className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Server Load</p>
                  <p className="text-sm font-semibold">24%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center">
                  <Lock className="w-4 h-4 text-info-600" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Security</p>
                  <p className="text-sm font-semibold">Encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Lock({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
