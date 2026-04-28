/**
 * Full print tree for receipt window — mirrors the TMS PrintDocument.
 */

import type { ReceiptPrintJob } from "@/lib/receipt/build-print-jobs";
import type { SummaryValues } from "@/lib/receipt/field-values";
import type { ShippingLineSettings } from "@/lib/receipt/types";
import { PrintableSummary } from "./PrintableSummary";
import { PrintableTicket } from "./PrintableTicket";

interface Props {
  jobs: ReceiptPrintJob[];
  summary: SummaryValues | null;
  summaryCopies: number;
  containerWidthCss: string;
  scale?: number;
  settings: ShippingLineSettings | null;
}

export function ReceiptPrintDocument({
  jobs,
  summary,
  summaryCopies = 1,
  containerWidthCss,
  scale = 1,
  settings,
}: Props) {
  const copies = Math.max(1, summaryCopies | 0);

  return (
    <div
      style={{
        fontFamily: "Arial, Helvetica, sans-serif",
        background: "#fff",
        color: "#000",
        width: containerWidthCss,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        margin: 0,
      }}
    >
      {jobs.map((job, i) => (
        <PrintableTicket
          key={job.key}
          template={job.template}
          fieldValues={job.fieldValues}
          isLast={i === jobs.length - 1}
          settings={settings}
        />
      ))}
      {summary &&
        Array.from({ length: copies }).map((_, idx, arr) => (
          <div
            key={`summary-${idx}`}
            style={{
              pageBreakAfter: idx === arr.length - 1 ? "auto" : "always",
              breakAfter: idx === arr.length - 1 ? "auto" : "page",
            }}
          >
            <PrintableSummary summary={summary} />
          </div>
        ))}
    </div>
  );
}
