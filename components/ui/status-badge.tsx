"use client";

import { motion } from "framer-motion";
import { IconLoader2 } from "@tabler/icons-react";
import { FC } from "react";

interface StatusBadgeProps {
  status: string;
  onChange?: (status: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  maintenance: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  retired: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
};

export const StatusBadge: FC<StatusBadgeProps> = ({ status, onChange, isLoading, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  const colorClasses = statusColors[status.toLowerCase()] || "bg-muted text-muted-foreground border-muted-foreground/20";

  return (
    <div className="relative inline-block group">
      {isLoading ? (
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${colorClasses} opacity-80`}>
          <IconLoader2 className="size-3 animate-spin" />
          <span className="capitalize">{status}</span>
        </div>
      ) : (
        <div className="relative">
          <select
            value={status}
            onChange={handleChange}
            disabled={disabled}
            className={`appearance-none pl-3 pr-8 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all capitalize ${colorClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="retired">Retired</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-current"
            >
              <path
                d="M1 1L5 5L9 1"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
