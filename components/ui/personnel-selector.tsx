"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { motionConfig } from "@/components/motion/page-transition";
import { IconSearch, IconX, IconUserPlus } from "@tabler/icons-react";
import type { Personnel } from "@/services/auth.service";

interface PersonnelSelectorProps {
  personnel: Personnel[];
  assignedId?: string;
  onSelect: (personnelId: string) => Promise<void>;
  onRemove: () => Promise<void>;
  role: "Drivers" | "Helpers";
  isLoading?: boolean;
}

export const PersonnelSelector: React.FC<PersonnelSelectorProps> = ({
  personnel,
  assignedId,
  onSelect,
  onRemove,
  role,
  isLoading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 256 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const assignedPerson = personnel.find((p) => p.id === assignedId);
  const filtered = personnel.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.phone?.includes(search) ?? false),
  );

  // Recalculate position on open and on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;

    const updatePos = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 256;
      // Flip left if it would overflow the right edge
      const left =
        rect.left + dropdownWidth > window.innerWidth
          ? rect.right - dropdownWidth
          : rect.left;
      setDropdownPos({ top: rect.bottom + 6, left, width: dropdownWidth });
    };

    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen((prev) => !prev);
    setSearch("");
  };

  const handleSelect = async (personId: string) => {
    setIsOpen(false);
    await onSelect(personId);
  };

  const handleRemove = async () => {
    setIsOpen(false);
    await onRemove();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs animate-pulse opacity-70">
        <div className="size-6 rounded-full bg-muted shadow-sm" />
        <span>Updating...</span>
      </div>
    );
  }

  // Assigned state — inline display with remove button
  if (assignedPerson) {
    return (
      <div className="group/selector relative flex items-center gap-2 p-1 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="size-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800 shadow-sm shrink-0">
          <span className="text-xs font-bold">{assignedPerson.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0 flex-1 cursor-default">
          <p className="text-sm font-semibold text-foreground truncate">{assignedPerson.name}</p>
          <p className="text-[10px] text-muted-foreground font-mono truncate">{assignedPerson.phone || "No Phone"}</p>
        </div>
        <button
          onClick={handleRemove}
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background border border-border shadow-sm text-muted-foreground hover:text-destructive hover:border-destructive opacity-0 group-hover/selector:opacity-100 transition-all scale-90 group-hover/selector:scale-100"
          title={`Unassign ${role}`}
        >
          <IconX className="size-3" />
        </button>
      </div>
    );
  }

  // Unassigned state — trigger button + portaled dropdown
  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed transition-all ${
          isOpen
            ? "border-primary text-primary bg-primary/5 shadow-sm"
            : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-muted/30"
        }`}
      >
        <IconUserPlus className="size-3.5" />
        <span>Assign {role.slice(0, -1)}</span>
      </button>

      {typeof window !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: motionConfig.page.duration, ease: motionConfig.page.ease }}
                  style={{
                    position: "fixed",
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    width: dropdownPos.width,
                  }}
                  className="bg-popover rounded-xl border border-border shadow-xl z-50 flex flex-col overflow-hidden ring-1 ring-black/5"
                >
                  <div className="p-2 border-b border-border bg-muted/30">
                    <div className="relative">
                      <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <input
                        autoFocus
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={`Search ${role.toLowerCase()}...`}
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-background text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto p-1 custom-scrollbar">
                    {filtered.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted-foreground">
                        No active {role.toLowerCase()} found
                      </div>
                    ) : (
                      filtered.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelect(p.id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left group"
                        >
                          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors shrink-0">
                            <span className="text-xs font-bold">{p.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                            {p.phone && (
                              <p className="text-[10px] text-muted-foreground font-mono">{p.phone}</p>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};
