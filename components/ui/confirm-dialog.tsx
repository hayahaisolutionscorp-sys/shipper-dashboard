"use client";

import { IconAlertTriangle, IconX } from "@tabler/icons-react";
import { useGsapPresence } from "@/lib/gsap-animations";
import { OverlayPortal } from "@/components/ui/overlay-portal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { mounted, overlayRef, panelRef } = useGsapPresence(open);

  if (!mounted) return null;

  return (
    <OverlayPortal>
      <div className="fixed inset-0 z-50 h-dvh">
        <div
          ref={overlayRef}
          className="absolute inset-0 h-dvh bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        />
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            ref={panelRef}
            className="relative bg-card rounded-2xl border border-border w-full max-w-sm p-6 shadow-xl z-10"
          >
            <button
              onClick={onCancel}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
            >
              <IconX className="size-4" />
            </button>

        <div className="flex items-start gap-4">
          <div className="shrink-0 size-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
            <IconAlertTriangle className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground leading-snug">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </button>
        </div>
          </div>
        </div>
    </div>
      </OverlayPortal>
  );
}
