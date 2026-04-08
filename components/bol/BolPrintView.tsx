"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IconX, IconPrinter, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { buildBolPrintJobs } from "@/lib/bol/build-bol-print-jobs";
import { executeBolPrint } from "@/lib/bol/execute-bol-print";
import type { ReceiptData } from "@/lib/receipt/types";
import { A4_PORTRAIT } from "@/lib/receipt/types";
import { BolPrintDocument } from "./BolPrintDocument";

const CONTAINER_WIDTH_CSS = "210mm";

interface BolPrintViewProps {
  bookingId: string;
  onClose: () => void;
}

export function BolPrintView({ bookingId, onClose }: BolPrintViewProps) {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const payload = await authService.getReceiptData(bookingId);
        if (!cancelled) setData(payload);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load BOL data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const bolTemplate = data?.templates?.bol ?? null;

  const printPayload = useMemo(() => {
    if (!data?.booking || !bolTemplate) return null;
    const jobs = buildBolPrintJobs(data.booking, bolTemplate, data.settings);
    const paper = bolTemplate.template_json?.paper ?? A4_PORTRAIT;
    return { jobs, paper };
  }, [data, bolTemplate]);

  const handlePrint = useCallback(async () => {
    if (!printPayload || !data?.booking) return;
    const { jobs, paper } = printPayload;
    if (jobs.length === 0) return;

    setPrinting(true);
    try {
      await executeBolPrint({
        bookingRef: data.booking.reference_no,
        paper,
        containerWidthCss: CONTAINER_WIDTH_CSS,
        scale: 1,
        jobs,
      });
    } catch (e) {
      if ((e as Error).message !== "Pop-up blocked") {
        console.error("[BolPrintView] print failed", e);
        toast.error("Failed to prepare print", {
          description: "An unexpected error occurred. Please try again.",
        });
      }
    } finally {
      setPrinting(false);
    }
  }, [printPayload, data]);

  useEffect(() => {
    if (loading || !data?.booking) return;
    const trips = [
      ...(data.booking.trips?.departure ?? []),
      ...(data.booking.trips?.return ?? []),
    ];
    const vehicleCount = trips.reduce((n, t) => n + (t.vehicles?.length ?? 0), 0);

    if (bolTemplate && vehicleCount === 0) {
      toast.info("No rolling cargo", {
        description: "BOL prints one page per vehicle; this booking has no vehicles.",
        duration: 5000,
      });
    }
  }, [loading, data, bolTemplate]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 shadow-2xl flex flex-col items-center gap-3">
          <IconLoader2 className="size-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading BOL…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 shadow-2xl max-w-sm text-center">
          <p className="text-sm text-destructive mb-4">{error || "BOL data unavailable"}</p>
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

  if (!bolTemplate) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 shadow-2xl max-w-sm text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No published Bill of Lading template for this shipping line. Ask the tenant to publish a
            CARGO_OTC BOL template.
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

  if (!printPayload || printPayload.jobs.length === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card rounded-xl p-8 shadow-2xl max-w-sm text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No vehicles to print on the BOL for this booking.
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

  const { booking } = data;
  const jobCount = printPayload.jobs.length;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold">Bill of Lading preview</h3>
            <p className="text-xs text-muted-foreground">
              {booking.reference_no}
              {jobCount > 0 ? ` · ${jobCount} page${jobCount !== 1 ? "s" : ""}` : ""}
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

        <div className="flex-1 overflow-auto px-5 py-4 bg-muted/30">
          <div className="mx-auto bg-white shadow-sm border border-border/50 rounded overflow-auto max-h-[60vh]">
            <div style={{ transform: "scale(0.45)", transformOrigin: "top center", marginBottom: "-40%" }}>
              <BolPrintDocument
                jobs={printPayload.jobs}
                containerWidthCss={CONTAINER_WIDTH_CSS}
                scale={1}
              />
            </div>
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
