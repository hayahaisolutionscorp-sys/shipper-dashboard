/**
 * PrintableTicket — wraps a single ticket copy with page-break handling.
 * Ported from the TMS components/print/PrintableTicket.tsx.
 */

import type { FieldValues } from "@/lib/receipt/field-values";
import type { ShippingLineSettings, TicketTemplate } from "@/lib/receipt/types";
import { COPY1_REGIONS } from "@/lib/receipt/types";
import { PrintableTicketCopy } from "./PrintableTicketCopy";

interface Props {
  template: TicketTemplate;
  fieldValues: FieldValues;
  isLast: boolean;
  settings?: ShippingLineSettings | null;
}

export function PrintableTicket({
  template,
  fieldValues,
  isLast,
  settings,
}: Props) {
  const json = template.template_json;

  return (
    <div
      style={{
        background: "#fff",
        width: "100%",
        pageBreakAfter: isLast ? "auto" : "always",
        breakAfter: isLast ? "auto" : "page",
        pageBreakInside: "avoid",
        breakInside: "avoid",
      }}
    >
      <PrintableTicketCopy
        copyKey="copy1"
        templateJson={json}
        fieldValues={fieldValues}
        enabledRegions={COPY1_REGIONS}
        settings={settings}
      />
    </div>
  );
}
