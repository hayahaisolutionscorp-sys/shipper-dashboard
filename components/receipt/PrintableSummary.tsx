/**
 * Transaction summary page — inline styles only (TMS parity).
 * Ported from the TMS components/print/PrintableSummary.tsx; uses QRCodeSVG.
 */

import { QRCodeSVG } from "qrcode.react";
import type { SummaryValues } from "@/lib/receipt/field-values";

interface Props {
  summary: SummaryValues;
}

const S = {
  wrap: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "10px",
    color: "#000",
    background: "#fff",
    padding: "8px 10px",
    width: "100%",
  } as React.CSSProperties,

  heading: {
    borderBottom: "2px solid #333",
    paddingBottom: "10px",
    marginBottom: "12px",
    textAlign: "center" as const,
  } as React.CSSProperties,

  h1: {
    fontSize: "14px",
    fontWeight: "bold",
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
    margin: 0,
    textAlign: "center" as const,
  } as React.CSSProperties,

  subtitle: {
    fontSize: "10px",
    color: "#666",
    margin: "2px 0 0",
    textAlign: "center" as const,
  } as React.CSSProperties,

  metaGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "3px",
    fontSize: "10px",
    flex: 1,
  } as React.CSSProperties,

  metaRow: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap" as const,
  } as React.CSSProperties,

  metaLabel: {
    fontWeight: "bold",
    flexShrink: 0,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: "10px",
    fontWeight: "bold",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    background: "#f0f0f0",
    padding: "3px 6px",
    border: "1px solid #ccc",
    marginBottom: 0,
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "10px",
    marginBottom: "12px",
  } as React.CSSProperties,

  th: {
    textAlign: "left" as const,
    padding: "3px 6px",
    borderBottom: "1px solid #ccc",
    background: "#f8f8f8",
    fontWeight: "bold",
    fontSize: "9px",
  } as React.CSSProperties,

  td: {
    padding: "3px 4px",
    borderBottom: "1px solid #eee",
    wordBreak: "break-word" as const,
  } as React.CSSProperties,

  tdRight: {
    padding: "3px 4px",
    borderBottom: "1px solid #eee",
    textAlign: "right" as const,
    fontFamily: "monospace",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  subtotalRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    fontSize: "10px",
    fontWeight: "bold",
    borderTop: "1px solid #ccc",
    paddingTop: "3px",
    marginBottom: "12px",
  } as React.CSSProperties,

  grandTotalBlock: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "baseline",
    gap: "16px",
    borderTop: "2px solid #000",
    paddingTop: "8px",
    marginTop: "4px",
  } as React.CSSProperties,

  grandTotalLabel: {
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase" as const,
  } as React.CSSProperties,

  grandTotalValue: {
    fontSize: "14px",
    fontWeight: "bold",
    fontFamily: "monospace",
  } as React.CSSProperties,

  footer: {
    marginTop: "20px",
    paddingTop: "10px",
    borderTop: "1px solid #ddd",
    textAlign: "center" as const,
    fontSize: "9px",
    color: "#888",
  } as React.CSSProperties,
};

function SectionTable({
  title,
  headers,
  rows,
  subtotal,
}: {
  title: string;
  headers: string[];
  rows: string[][];
  subtotal: string;
}) {
  if (rows.length === 0) return null;
  return (
    <>
      <div style={S.sectionTitle}>{title}</div>
      <table style={S.table}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={S.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              style={{ background: i % 2 === 1 ? "#fafafa" : "#fff" }}
            >
              {row.map((cell, j) => (
                <td key={j} style={j === row.length - 1 ? S.tdRight : S.td}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={S.subtotalRow}>
        <span>Subtotal</span>
        <span style={{ fontFamily: "monospace" }}>{subtotal}</span>
      </div>
    </>
  );
}

export function PrintableSummary({ summary }: Props) {
  const paxRows = summary.passengers.map((p) => [
    p.name,
    p.age,
    p.sex,
    p.discountType,
    p.accommodation,
    p.route,
    p.fare,
  ]);
  const vehRows = summary.vehicles.map((v) => [
    v.plateNumber,
    v.model,
    v.type,
    v.route,
    v.fare,
  ]);
  const cargoRows = summary.cargo.map((c) => [
    c.description,
    c.quantity,
    c.weight,
    c.route,
    c.fare,
  ]);

  const hasCharges = (summary.charges ?? []).length > 0;
  const hasTaxes = (summary.taxes ?? []).length > 0;
  const hasBreakdown = hasCharges || hasTaxes;

  return (
    <div className="print-summary" style={S.wrap}>
      <div
        style={{
          ...S.heading,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <p style={S.h1}>Transaction Summary</p>
        <p style={S.subtitle}>Official Booking Receipt</p>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "14px",
        }}
      >
        <div style={S.metaGrid}>
          {(
            [
              ["Reference No.", summary.referenceNo],
              ["Booking Date", summary.bookingDate],
              ["Issued By", summary.issuedBy],
              ["Payment Method", summary.paymentMethod],
              ["Payment Status", summary.paymentStatus],
              ["Printed At", summary.printedAt],
            ] as [string, string][]
          ).map(([label, val]) => (
            <div key={label} style={S.metaRow}>
              <span style={S.metaLabel}>{label}:</span>
              <span
                style={{
                  wordBreak: "break-word",
                  flex: 1,
                  ...(label === "Reference No."
                    ? { fontFamily: "monospace", fontWeight: "bold" }
                    : {}),
                }}
              >
                {val}
              </span>
            </div>
          ))}
        </div>
        <div style={{ flexShrink: 0, marginLeft: "16px" }}>
          {summary.qrValue ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "4px 0",
              }}
            >
              <QRCodeSVG value={summary.qrValue} size={72} />
            </div>
          ) : null}
        </div>
      </div>

      <SectionTable
        title="Passengers"
        headers={["Name", "Age", "Sex", "Type", "Accommodation", "Route", "Fare"]}
        rows={paxRows}
        subtotal={summary.subtotalPassengers}
      />
      <SectionTable
        title="Vehicles"
        headers={["Plate No.", "Model", "Type", "Route", "Fare"]}
        rows={vehRows}
        subtotal={summary.subtotalVehicles}
      />
      <SectionTable
        title="Cargo"
        headers={["Description", "Qty", "Weight", "Route", "Fare"]}
        rows={cargoRows}
        subtotal={summary.subtotalCargo}
      />

      {hasBreakdown && (
        <div style={{ marginBottom: "8px" }}>
          <div style={S.sectionTitle}>Charges &amp; Taxes</div>
          <table style={{ ...S.table, marginBottom: "4px" }}>
            <tbody>
              {(summary.charges ?? []).map((c, i) => (
                <tr
                  key={`charge-${i}`}
                  style={{ background: i % 2 === 1 ? "#fafafa" : "#fff" }}
                >
                  <td style={S.td}>{c.description}</td>
                  <td style={S.tdRight}>{c.amount}</td>
                </tr>
              ))}
              {(summary.taxes ?? []).map((t, i) => (
                <tr key={`tax-${i}`} style={{ background: "#f5f9ff" }}>
                  <td
                    style={{ ...S.td, color: "#555", fontStyle: "italic" }}
                  >
                    {t.description}
                  </td>
                  <td
                    style={{
                      ...S.tdRight,
                      color: "#555",
                      fontStyle: "italic",
                    }}
                  >
                    {t.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasCharges && (
            <div style={{ ...S.subtotalRow, marginBottom: "4px" }}>
              <span>Charges Subtotal</span>
              <span style={{ fontFamily: "monospace" }}>
                {summary.chargesTotal}
              </span>
            </div>
          )}
          {hasTaxes && (
            <div
              style={{
                ...S.subtotalRow,
                marginBottom: "8px",
                fontWeight: "normal",
                color: "#555",
              }}
            >
              <span>Taxes Subtotal</span>
              <span style={{ fontFamily: "monospace" }}>
                {summary.taxesTotal}
              </span>
            </div>
          )}
        </div>
      )}

      <div style={S.grandTotalBlock}>
        <span style={S.grandTotalLabel}>Grand Total</span>
        <span style={S.grandTotalValue}>{summary.grandTotal}</span>
      </div>

      <div style={S.footer}>
        This document serves as your official booking confirmation and receipt.
      </div>
    </div>
  );
}
