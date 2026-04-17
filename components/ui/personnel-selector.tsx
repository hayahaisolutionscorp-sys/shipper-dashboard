"use client";

import { useState, useRef, useEffect } from "react";
import { IconLoader2, IconUserPlus, IconX, IconChevronDown } from "@tabler/icons-react";
import type { Personnel } from "@/services/auth.service";
import { useGsapDropdownPresence } from "@/lib/gsap-animations";

interface PersonnelSelectorProps {
  personnel: Personnel[];
  role: string;
  assignedId?: string;
  onSelect: (personnelId: string) => void;
  onRemove: () => void;
  isLoading?: boolean;
}

export function PersonnelSelector({
  personnel,
  role,
  assignedId,
  onSelect,
  onRemove,
  isLoading,
}: PersonnelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { mounted, dropdownRef } = useGsapDropdownPresence(isOpen);

  const assigned = personnel.find((p) => p.id === assignedId);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" />
        <span className="text-xs">Loading...</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {assigned ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border/50">
            <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold border border-primary/20">
              {assigned.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
              {assigned.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <IconX className="size-3" />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-muted/50 transition-all text-xs font-medium"
        >
          <IconUserPlus className="size-3.5" />
          Assign {role}
          <IconChevronDown className={`size-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      )}

      {mounted && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full mt-1.5 w-56 bg-card border border-border rounded-xl shadow-xl z-30 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground">
              Available {role}
            </p>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {personnel.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No {role.toLowerCase()} available
              </p>
            ) : (
              personnel.map((person) => (
                <button
                  key={person.id}
                  onClick={() => {
                    onSelect(person.id);
                    setIsOpen(false);
                  }}
                  disabled={person.id === assignedId}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold border border-primary/20">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {person.name}
                    </p>
                    {person.phone && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {person.phone}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
