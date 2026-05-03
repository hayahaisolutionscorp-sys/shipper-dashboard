"use client";

import { useState, useRef, useEffect, useCallback, FC } from "react";
import { createPortal } from "react-dom";
import { IconLoader2, IconChevronDown, IconCheck } from "@tabler/icons-react";
import { useGsapDropdownPresence } from "@/lib/gsap-animations";

interface StatusBadgeProps {
  status: string;
  onChange?: (status: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    dotColor: "bg-emerald-500",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    dotColor: "bg-amber-500",
  },
  {
    value: "retired",
    label: "Retired",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    dotColor: "bg-gray-400",
  },
];

export const StatusBadge: FC<StatusBadgeProps> = ({ status, onChange, isLoading, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { mounted, dropdownRef } = useGsapDropdownPresence(isOpen);

  const current =
    STATUS_OPTIONS.find((o) => o.value === status.toLowerCase()) ?? STATUS_OPTIONS[0];

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 6, left: rect.left });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (!containerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition, dropdownRef]);

  const dropdown =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={dropdownRef}
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
            className="fixed w-44 bg-card border border-border rounded-xl shadow-xl z-[9999] overflow-hidden p-1"
          >
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange?.(opt.value);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <span className={`size-2 rounded-full shrink-0 ${opt.dotColor}`} />
                <span className="text-sm font-medium text-foreground flex-1">{opt.label}</span>
                {opt.value === status.toLowerCase() && (
                  <IconCheck className="size-3 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  if (isLoading) {
    return (
      <div
        className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${current.color} opacity-80`}
      >
        <IconLoader2 className="size-3 animate-spin" />
        <span className="capitalize">{status}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50 disabled:cursor-not-allowed ${current.color}`}
      >
        <span className="capitalize">{status}</span>
        <IconChevronDown
          className={`size-3 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {dropdown}
    </div>
  );
};
