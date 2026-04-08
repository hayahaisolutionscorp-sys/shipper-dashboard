/**
 * PrintableTicketCopy — inline-style only, zero Tailwind dependency.
 * Ported from ayahay-tms/components/print/PrintableTicketCopy.tsx.
 *
 * Differences from TMS version:
 * - No useIdentityStore dependency — brand name/logo passed via props
 * - Uses QRCodeSVG directly instead of BookingQRCode wrapper
 * - agentLogo uses field values only (no identity-store cache)
 */

import { QRCodeSVG } from "qrcode.react";
import type { FieldValues } from "@/lib/receipt/field-values";
import type {
  CopyKey,
  RegionKey,
  ShippingLineSettings,
  TemplateJson,
} from "@/lib/receipt/types";

interface Props {
  copyKey: CopyKey;
  templateJson: TemplateJson;
  fieldValues: FieldValues;
  enabledRegions: RegionKey[];
  settings?: ShippingLineSettings | null;
}

// ─── Style constants (identical to TMS) ──────────────────────────────────────

const S = {
  wrap: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "10px",
    color: "#000",
    background: "#fff",
    padding: "6px 8px",
    lineHeight: "1.4",
    width: "100%",
  } as React.CSSProperties,

  headerBlock: {
    textAlign: "center" as const,
    paddingBottom: "6px",
    marginBottom: "6px",
    borderBottom: "1px solid #ccc",
    fontSize: "11px",
    fontWeight: "bold",
  } as React.CSSProperties,

  row: {
    display: "flex",
    gap: "8px",
    marginBottom: "4px",
  } as React.CSSProperties,

  detailsCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: "1px",
  } as React.CSSProperties,

  detailsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  } as React.CSSProperties,

  metaRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "4px",
    fontSize: "10px",
  } as React.CSSProperties,

  fieldRow: {
    display: "flex",
    gap: "4px",
    fontSize: "10px",
    lineHeight: "1.4",
  } as React.CSSProperties,

  label: {
    fontWeight: "bold",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  chargeSection: {
    borderTop: "1px solid #ddd",
    paddingTop: "4px",
    marginTop: "4px",
    paddingLeft: "24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1px",
  } as React.CSSProperties,

  chargeRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10px",
  } as React.CSSProperties,

  totalSection: {
    borderTop: "2px solid #555",
    paddingTop: "4px",
    marginTop: "4px",
  } as React.CSSProperties,

  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10px",
    fontWeight: "bold",
  } as React.CSSProperties,

  termsSection: {
    borderTop: "1px solid #ddd",
    paddingTop: "6px",
    marginTop: "4px",
    fontSize: "9px",
    color: "#555",
    lineHeight: "1.4",
  } as React.CSSProperties,

  brandingSection: {
    borderTop: "1px solid #ddd",
    paddingTop: "4px",
    marginTop: "4px",
    textAlign: "left" as const,
    fontSize: "9px",
    color: "#777",
  } as React.CSSProperties,
};

const QR_WRAPPER_STYLE: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: "2px",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rid(copyKey: CopyKey, regionKey: RegionKey) {
  return `${copyKey}.${regionKey}` as const;
}

function getFields(
  templateJson: TemplateJson,
  copyKey: CopyKey,
  regionKey: RegionKey,
): string[] {
  return templateJson.regions[rid(copyKey, regionKey)] ?? [];
}

function resolveValue(
  fieldId: string,
  templateJson: TemplateJson,
  fieldValues: FieldValues,
): string {
  const raw = fieldValues[fieldId];
  if (raw !== undefined && raw !== "") return raw;
  return templateJson.fields[fieldId]?.label ?? fieldId;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PrintableTicketCopy({
  copyKey,
  templateJson,
  fieldValues,
  enabledRegions,
  settings,
}: Props) {
  const fields = templateJson.fields;
  const has = (r: RegionKey) => enabledRegions.includes(r);

  const headerFields = has("companyHeader")
    ? getFields(templateJson, copyKey, "companyHeader")
    : [];
  const qrFields = has("qrRegion")
    ? getFields(templateJson, copyKey, "qrRegion")
    : [];
  const metaFields = has("metaRegion")
    ? getFields(templateJson, copyKey, "metaRegion")
    : [];
  const detailFields = has("detailsRegion")
    ? getFields(templateJson, copyKey, "detailsRegion")
    : [];
  const chargeFields = has("chargesRegion")
    ? getFields(templateJson, copyKey, "chargesRegion")
    : [];
  const totalFields = has("grandTotalRegion")
    ? getFields(templateJson, copyKey, "grandTotalRegion")
    : [];
  const termsFields = has("termsRegion")
    ? getFields(templateJson, copyKey, "termsRegion")
    : [];
  const brandingFields = has("brandingRegion")
    ? getFields(templateJson, copyKey, "brandingRegion")
    : [];

  const qrValue = fieldValues.qrCode ?? "";
  const showQr =
    has("qrRegion") &&
    qrFields.includes("qrCode") &&
    fields["qrCode"]?.visible &&
    !!qrValue;

  return (
    <div style={S.wrap}>
      {/* Company Header */}
      {has("companyHeader") && headerFields.length > 0 && (
        <div
          style={{
            ...S.headerBlock,
            position: "relative",
            minHeight: "50px",
          }}
        >
          {headerFields.map((fid) => {
            const cfg = fields[fid];
            if (!cfg?.visible) return null;

            const rawVal = fieldValues[fid] || "";

            if (fid === "shippingLineLogo") {
              const logoSrc = rawVal || settings?.logoUrl || "";
              return (
                <div
                  key={fid}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "56px",
                    height: "56px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt="Logo"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "1px dashed #ccc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "8px",
                          color: "#999",
                          padding: "2px",
                          textAlign: "center",
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            if (fid === "agentLogo") {
              return (
                <div
                  key={fid}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: "56px",
                    height: "56px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {rawVal ? (
                    <img
                      src={rawVal}
                      alt="Agent"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        border: "1px dashed #ccc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "8px",
                          color: "#999",
                          padding: "2px",
                          textAlign: "center",
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            }

            let val = resolveValue(fid, templateJson, fieldValues);
            if (
              fid === "shippingLineName" &&
              !fieldValues[fid] &&
              settings?.companyName
            ) {
              val = settings.companyName;
            }

            return (
              <div key={fid} style={{ padding: "0 52px" }}>
                {val}
              </div>
            );
          })}
        </div>
      )}

      {/* QR + Meta + Details */}
      <div style={S.row}>
        {showQr && (
          <div style={QR_WRAPPER_STYLE}>
            <QRCodeSVG value={qrValue} size={56} />
          </div>
        )}

        <div style={S.detailsCol}>
          {/* Meta row */}
          {has("metaRegion") && metaFields.length > 0 && (
            <div style={S.metaRow}>
              {metaFields.map((fid) => {
                const cfg = fields[fid];
                if (!cfg?.visible) return null;
                return (
                  <span key={fid}>
                    <span style={S.label}>{cfg.label}: </span>
                    {resolveValue(fid, templateJson, fieldValues)}
                  </span>
                );
              })}
            </div>
          )}

          {/* Detail fields */}
          {has("detailsRegion") && detailFields.length > 0 && (
            <div style={S.detailsList}>
              {detailFields.map((fid, idx) => {
                const cfg = fields[fid];
                if (!cfg?.visible) return null;
                if (fid === "eta") return null;

                const etaCfg = fields["eta"];
                const etaVisible =
                  etaCfg?.visible && detailFields.includes("eta");

                if (fid === "tripDateEtd" && etaVisible) {
                  return (
                    <div key={fid} style={{ ...S.fieldRow, gap: "16px" }}>
                      <span>
                        <span style={S.label}>{cfg.label}: </span>
                        {resolveValue(fid, templateJson, fieldValues)}
                      </span>
                      <span>
                        <span style={S.label}>{etaCfg.label}: </span>
                        {resolveValue("eta", templateJson, fieldValues)}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={`${fid}-${idx}`} style={S.fieldRow}>
                    <span style={S.label}>{cfg.label}:</span>
                    <span>
                      {resolveValue(fid, templateJson, fieldValues)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Charges */}
      {has("chargesRegion") && chargeFields.length > 0 && (
        <div style={S.chargeSection}>
          {chargeFields.map((fid) => {
            const cfg = fields[fid];
            if (!cfg?.visible) return null;
            return (
              <div key={fid} style={S.chargeRow}>
                <span>{cfg.label}</span>
                <span
                  style={{
                    fontFamily: "monospace",
                    whiteSpace: "pre-line",
                    textAlign: "right",
                  }}
                >
                  {resolveValue(fid, templateJson, fieldValues)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Grand Total */}
      {has("grandTotalRegion") && totalFields.length > 0 && (
        <div style={S.totalSection}>
          {totalFields.map((fid) => {
            const cfg = fields[fid];
            if (!cfg?.visible) return null;
            return (
              <div key={fid} style={S.totalRow}>
                <span>{cfg.label}</span>
                <span style={{ fontFamily: "monospace" }}>
                  {resolveValue(fid, templateJson, fieldValues)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Terms */}
      {has("termsRegion") && termsFields.length > 0 && (
        <div style={S.termsSection}>
          {termsFields.map((fid) => {
            const cfg = fields[fid];
            if (!cfg?.visible) return null;
            return (
              <div key={fid}>
                {resolveValue(fid, templateJson, fieldValues)}
              </div>
            );
          })}
        </div>
      )}

      {/* Branding */}
      {has("brandingRegion") && brandingFields.length > 0 && (
        <div style={S.brandingSection}>
          {brandingFields.map((fid) => {
            const cfg = fields[fid];
            if (!cfg?.visible) return null;
            return (
              <div key={fid}>
                {resolveValue(fid, templateJson, fieldValues)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
