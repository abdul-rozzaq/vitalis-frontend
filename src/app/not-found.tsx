"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { HeartPulse, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center max-w-sm"
      >
        <div className="w-16 h-16 bg-danger-50 rounded-lg flex items-center justify-center mb-6">
          <HeartPulse className="w-8 h-8 text-danger-500 relative z-10" />
        </div>

        <h1 className="text-3xl font-semibold text-text tracking-tight mb-2">404</h1>

        <p className="text-secondary text-sm mb-6">
          The page or record you are looking for seems to have gone missing from our clinical charts.
        </p>

        <Link href="/">
          <button className="bg-text text-background hover:opacity-90 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-1.5 transition-opacity cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
