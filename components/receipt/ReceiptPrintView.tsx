"use client";

/**
 * ReceiptPrintView — fetches tenant-scoped receipt data (v2 fan-out → client-api),
 * builds TMS-equivalent print jobs (PAX + CARGO templates, optional summary),
 * and prints via a dedicated window (not a screenshot of this overlay).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconX, IconPrinter, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { buildReceiptPrintJobs } from "@/lib/receipt/build-print-jobs";
import { executeReceiptPrint } from "@/lib/receipt/execute-receipt-print";
import { resolveReceiptTemplates } from "@/lib/receipt/normalize-receipt-data";
import type { ReceiptData } from "@/lib/receipt/types";
import { THERMAL_80MM } from "@/lib/receipt/types";
import { ReceiptPrintDocument } from "./ReceiptPrintDocument";

const CONTAINER_WIDTH_CSS = "80mm";

interface ReceiptPrintViewProps {
  bookingId: string;
  onClose: () => void;
}

export function ReceiptPrintView({ bookingId, onClose }: ReceiptPrintViewProps) {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchReceipt() {
      try {
        setLoading(true);
        setError(null);
        const data = await authService.getReceiptData(bookingId);
        if (!cancelled) {
          setReceiptData(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load receipt data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchReceipt();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const { pax: paxTemplate, cargo: cargoTemplate } = useMemo(() => {
    if (!receiptData) {
      return { pax: null, cargo: null };
    }
    return resolveReceiptTemplates(receiptData);
  }, [receiptData]);

  const printPayload = useMemo(() => {
    if (!receiptData?.booking) return null;
    const { booking, settings } = receiptData;
    const built = buildReceiptPrintJobs(
      booking,
      paxTemplate,
      cargoTemplate,
      settings,
    );
    const paper = built.paperFromTemplate?.template_json.paper ?? THERMAL_80MM;
    return { ...built, paper, settings };
  }, [receiptData, paxTemplate, cargoTemplate]);

  useEffect(() => {
    if (loading || !receiptData?.booking) return;

    const trips = [
      ...(receiptData.booking.trips?.departure ?? []),
      ...(receiptData.booking.trips?.return ?? []),
    ];
    const hasPax = trips.some((t) => (t.passengers ?? []).length > 0);
    const hasCargo = trips.some((t) => {
      const loose =
        t.cargo && t.cargo.length > 0
          ? t.cargo
          : t.cargos && t.cargos.length > 0
            ? t.cargos
            : [];
      return (t.vehicles ?? []).length > 0 || loose.length > 0;
    });

    const built = buildReceiptPrintJobs(
      receiptData.booking,
      paxTemplate,
      cargoTemplate,
      receiptData.settings,
    );

    if (hasPax && !paxTemplate) {
      toast.warning("No passenger receipt template published", {
        description: "Passenger tickets may be missing from the printout.",
        duration: 6000,
      });
    }
    if (hasCargo && !cargoTemplate) {
      toast.warning("No cargo receipt template published", {
        description: "Vehicle/cargo tickets may be missing from the printout.",
        duration: 6000,
      });
    }

    if (
      built.jobs.length === 0 &&
      !built.summary &&
      (paxTemplate || cargoTemplate)
    ) {
      toast.info("No items to print", {
        description: "This booking has no passengers, vehicles, or cargo rows.",
        duration: 5000,
      });
    } else if (built.jobs.length === 0 && built.summary) {
      toast.info("Printing transaction summary only", {
        description: "No per-item tickets matched the available templates.",
        duration: 5000,
      });
    }
  }, [loading, bookingId, receiptData, paxTemplate, cargoTemplate]);

  const handlePrint = useCallback(async () => {
    if (!printPayload || !receiptData?.booking) return;
    const { jobs, summary, summaryCopies, paper, settings } = printPayload;
    if (jobs.length === 0 && !summary) return;

    setPrinting(true);
    try {
      await executeReceiptPrint({
        bookingRef: receiptData.booking.reference_no,
        paper,
        containerWidthCss: CONTAINER_WIDTH_CSS,
        scale: 1,
        jobs,
        summary,
        summaryCopies,
        settings,
      });
    } catch (e) {
      if ((e as Error).message !== "Pop-up blocked") {
        console.error("[ReceiptPrintView] print failed", e);
        toast.error("Failed to prepare print", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setPrinting(false);
    }
  }, [printPayload, receiptData]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 shadow-2xl flex flex-col items-center gap-3">
          <IconLoader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !receiptData) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 shadow-2xl max-w-sm text-center">
          <p className="text-sm text-destructive mb-4">
            {error || "Receipt data unavailable"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const { booking, settings } = receiptData;

  if (!paxTemplate && !cargoTemplate) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 shadow-2xl max-w-sm text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No published receipt template found for this shipping line.
            Please contact the shipping line to set up their receipt templates.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!printPayload || (printPayload.jobs.length === 0 && !printPayload.summary)) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 shadow-2xl max-w-sm text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No printable items found in this booking.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const ticketCount = printPayload.jobs.length;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold">Receipt Preview</h3>
            <p className="text-xs text-muted-foreground">
              {booking.reference_no}
              {ticketCount > 0
                ? ` · ${ticketCount} ticket${ticketCount !== 1 ? "s" : ""}`
                : ""}
              {printPayload.summary ? " · summary" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <IconX className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 bg-muted/30">
          <div
            className="mx-auto bg-white shadow-sm border border-border/50 rounded overflow-hidden"
            style={{ width: "302px" }}
          >
            <ReceiptPrintDocument
              jobs={printPayload.jobs}
              summary={printPayload.summary}
              summaryCopies={printPayload.summaryCopies}
              containerWidthCss="100%"
              scale={1}
              settings={settings}
            />
          </div>
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-border flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={printing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            <IconPrinter className="size-4" />
            {printing ? "Printing…" : "Print"}
          </button>
        </div>
      </div>
    </div>
  );
}
