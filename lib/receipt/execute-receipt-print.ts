/**
 * Opens a blank window and mounts the receipt print tree (TMS use-print-executor parity).
 */

import { ReceiptPrintDocument } from "@/components/receipt/ReceiptPrintDocument";
import { createElement } from "react";
import ReactDOM from "react-dom/client";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import type { ReceiptPrintJob } from "./build-print-jobs";
import type { SummaryValues } from "./field-values";
import type { PaperConfig, ShippingLineSettings } from "./types";

function injectPrintStyles(doc: Document, paper: PaperConfig) {
  const style = doc.createElement("style");
  style.textContent = `
    @page {
      size: ${paper.size};
      margin: ${paper.marginMm}mm;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #000;
      background: #fff;
      width: 100%;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;
  doc.head.appendChild(style);
}

async function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  const promises = images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise<void>((res) => {
      img.onload = () => res();
      img.onerror = () => res();
    });
  });
  await Promise.race([
    Promise.all(promises).then(() => undefined),
    new Promise<void>((res) => setTimeout(res, 5000)),
  ]);
}

export async function executeReceiptPrint(options: {
  bookingRef: string;
  paper: PaperConfig;
  containerWidthCss: string;
  scale?: number;
  jobs: ReceiptPrintJob[];
  summary: SummaryValues | null;
  summaryCopies: number;
  settings: ShippingLineSettings | null;
}): Promise<void> {
  const {
    bookingRef,
    paper,
    containerWidthCss,
    scale = 1,
    jobs,
    summary,
    summaryCopies,
    settings,
  } = options;

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    toast.error("Pop-up blocked", {
      description:
        "Allow pop-ups for this site in your browser settings, then try again.",
    });
    throw new Error("Pop-up blocked");
  }

  printWindow.document.documentElement.lang = "en";
  const head = printWindow.document.head;
  const meta = printWindow.document.createElement("meta");
  meta.setAttribute("charset", "utf-8");
  head.appendChild(meta);
  const titleEl = printWindow.document.createElement("title");
  titleEl.textContent = `Receipt — ${bookingRef}`;
  head.appendChild(titleEl);

  injectPrintStyles(printWindow.document, paper);

  const container = printWindow.document.createElement("div");
  container.id = "print-root";
  printWindow.document.body.appendChild(container);

  const root = ReactDOM.createRoot(container);
  flushSync(() =>
    root.render(
      createElement(ReceiptPrintDocument, {
        jobs,
        summary,
        summaryCopies,
        containerWidthCss,
        scale,
        settings,
      }),
    ),
  );

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    clearInterval(closedPoll);
    try {
      root.unmount();
    } catch {
      /* ignore */
    }
  };

  const closedPoll = setInterval(() => {
    if (printWindow.closed) cleanup();
  }, 300);

  await waitForImages(printWindow.document);

  await new Promise<void>((resolve) => {
    if (printWindow.closed) {
      resolve();
      return;
    }
    printWindow.print();
    printWindow.addEventListener("afterprint", () => {
      cleanup();
      resolve();
    }, { once: true });
  });
}
