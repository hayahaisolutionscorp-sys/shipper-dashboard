/**
 * PrintableBOL — inline-style only, zero Tailwind dependency.
 *
 * Pure field-driven renderer — mirrors the PrintableTicketCopy pattern exactly.
 * No hardcoded field IDs, no hardcoded label strings.
 *
 * How it works (same as receipt):
 *   1. getFields() reads templateJson.regions['copy1.regionKey'] → ordered field ID list
 *   2. resolveValue() returns fieldValues[id] or falls back to templateJson.fields[id].label
 *   3. cfg.label drives the column header in the cargo table and label prefixes in other sections
 *   4. cfg.visible gates whether a field/column renders at all
 *
 * BOL is always a single-copy document — copyKey is always 'copy1'.
 *
 * IMPORTANT: All styling must use React inline style objects.
 * The print window has no access to the app's bundled CSS.
 */

import type { FieldValues } from "@/lib/receipt/field-values";
import type { RegionKey, TemplateJson, TicketTemplate } from "@/lib/receipt/types";

interface Props {
    template: TicketTemplate;
    fieldValues: FieldValues;
    /** If false, a page break is inserted after this BOL. */
    isLast: boolean;
}

// ─── Style constants ──────────────────────────────────────────────────────────

const S = {
    page: {
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '10px',
        color: '#111',
        background: '#fff',
        padding: '20px 24px',
        lineHeight: '1.4',
        width: '100%',
        boxSizing: 'border-box',
    } as React.CSSProperties,

    // ── Header ──────────────────────────────────────────────────────────────
    headerWrap: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'stretch',
        paddingBottom: '10px',
        marginBottom: '10px',
        borderBottom: '2px solid #222',
        gap: '12px',
    } as React.CSSProperties,

    companyBlock: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        textAlign: 'center' as const,
        gap: '2px',
    } as React.CSSProperties,

    headerFirstField: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#111',
    } as React.CSSProperties,

    headerOtherField: {
        fontSize: '9px',
        color: '#555',
    } as React.CSSProperties,

    refBlock: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'flex-end' as const,
        gap: '0px',
    } as React.CSSProperties,

    refItem: {
        fontSize: '9px',
        color: '#111',
        lineHeight: '1.2',
    } as React.CSSProperties,

    refItemBold: {
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#111',
        lineHeight: '1.4',
        marginBottom: '2px',
    } as React.CSSProperties,

    noteBlock: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'flex-end' as const,
        color: '#333',
        fontSize: '9px',
        lineHeight: '1.1',
        marginTop: '2px',
        marginBottom: '4px',
    } as React.CSSProperties,

    // ── Body label:value rows ────────────────────────────────────────────────
    section: {
        marginBottom: '10px',
        padding: '8px 10px',
        border: '1px solid #ddd',
        borderRadius: '3px',
    } as React.CSSProperties,

    grid3: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '3px 16px',
    } as React.CSSProperties,

    fieldRow: {
        display: 'flex',
        gap: '4px',
        fontSize: '10px',
    } as React.CSSProperties,

    label: {
        fontWeight: 'bold',
        whiteSpace: 'nowrap' as const,
        color: '#555',
    } as React.CSSProperties,

    value: {
        color: '#111',
    } as React.CSSProperties,

    // ── Cargo table ─────────────────────────────────────────────────────────
    tableWrap: {
        marginBottom: '10px',
        overflowX: 'auto' as const,
    } as React.CSSProperties,

    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        fontSize: '9px',
    } as React.CSSProperties,

    th: {
        border: '1px solid #bbb',
        padding: '3px 5px',
        background: '#f5f5f5',
        fontWeight: 'bold',
        textAlign: 'center' as const,
        whiteSpace: 'nowrap' as const,
    } as React.CSSProperties,

    td: {
        border: '1px solid #bbb',
        padding: '3px 5px',
        verticalAlign: 'top' as const,
    } as React.CSSProperties,

    tdEmpty: {
        border: '1px solid #bbb',
        padding: '3px 5px',
        height: '18px',
        verticalAlign: 'top' as const,
    } as React.CSSProperties,

    tableFootLabel: {
        border: '1px solid #bbb',
        padding: '3px 5px',
        fontWeight: 'bold',
        textAlign: 'right' as const,
        background: '#f9f9f9',
    } as React.CSSProperties,

    tableFootValue: {
        border: '1px solid #bbb',
        padding: '3px 5px',
        fontWeight: 'bold',
        textAlign: 'right' as const,
        background: '#f9f9f9',
        fontFamily: 'monospace',
    } as React.CSSProperties,

    // ── Signature section ───────────────────────────────────────────────────
    sigContainer: {
        display: 'flex',
        marginTop: '10px',
        gap: '20px',
        // Make sure it doesn't break across pages if possible
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
    } as React.CSSProperties,

    sigLeftCol: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
    } as React.CSSProperties,

    sigRightCol: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
    } as React.CSSProperties,

    stampBox: {
        border: '1px solid #000',
        width: '100%',
        marginTop: '20px',
        padding: '8px',
        minHeight: '120px',
        textAlign: 'center' as const,
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '10px',
    } as React.CSSProperties,

    validationBox: {
        border: '1px solid #000',
        width: '100%',
        marginTop: '20px',
        padding: '12px 8px',
        fontSize: '10px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
    } as React.CSSProperties,

    sigLine: {
        borderBottom: '1px solid #000',
        display: 'inline-block',
        height: '14px',
    } as React.CSSProperties,

    sigTextCentered: {
        textAlign: 'center' as const,
        fontSize: '10px',
        whiteSpace: 'pre-line' as const,
        lineHeight: '1.4',
    } as React.CSSProperties,

    sigTextJustified: {
        textAlign: 'justify' as const,
        fontSize: '10px',
        whiteSpace: 'pre-line' as const,
        lineHeight: '1.2',
    } as React.CSSProperties,

    // ── Marginal disclaimer (bottom, left/right) ─────────────────────────────────
    marginalWrap: {
        display: 'flex',
        justifyContent: 'space-between' as const,
        alignItems: 'flex-start',
        gap: '16px',
        marginTop: '12px',
        paddingTop: '8px',
        borderTop: '1px solid #ddd',
        fontSize: '8px',
        color: '#555',
        lineHeight: '1.3',
    } as React.CSSProperties,
    marginalLeft: { flex: 1, textAlign: 'left' as const, whiteSpace: 'pre-line' as const },
    marginalRight: { flex: 1, textAlign: 'right' as const, whiteSpace: 'pre-line' as const },
};

// ─── Helpers (exact receipt pattern) ─────────────────────────────────────────

const COPY_KEY = 'copy1' as const;

function getFields(templateJson: TemplateJson, regionKey: RegionKey): string[] {
    return templateJson.regions[`${COPY_KEY}.${regionKey}`] ?? [];
}

function resolveValue(fieldId: string, templateJson: TemplateJson, fieldValues: FieldValues): string {
    const raw = fieldValues[fieldId];
    if (raw !== undefined && raw !== '') return raw;
    return templateJson.fields[fieldId]?.label ?? fieldId;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PrintableBOL({ template, fieldValues: fv, isLast }: Props) {
    const json = template.template_json as TemplateJson;
    const fields = json.fields;

    const headerFields = getFields(json, 'bolHeaderRegion');
    const shipmentFields = getFields(json, 'bolShipmentRegion');
    const cargoFields = getFields(json, 'bolCargoTableRegion');

    // Bottom Half
    const stripeFields = getFields(json, 'bolTotalsStripeRegion');
    const consigneeFields = getFields(json, 'bolConsigneeRegion');
    const carrierFields = getFields(json, 'bolCarrierRegion');
    const marginalFields = getFields(json, 'bolMarginalRegion');

    // Split header fields into two layout columns.
    // These IDs designate layout position (right ref-block), not field type.
    // TODO Phase 5: replace with separate bolCompanyRegion / bolRefRegion sub-regions.
    const HEADER_REF_LAYOUT_IDS = new Set(['bolNumber', 'surrenderNote', 'frrNumber']);
    const refFields = headerFields.filter(fid => HEADER_REF_LAYOUT_IDS.has(fid));
    const companyFields = headerFields.filter(fid => !HEADER_REF_LAYOUT_IDS.has(fid));

    // Visible cargo columns
    const visibleCargoFields = cargoFields.filter((fid) => fields[fid]?.visible !== false);

    // Visible stripe fields (field-driven)
    const visibleStripeFields = stripeFields.filter((fid) => fields[fid]?.visible !== false);

    // Visible marginal fields (left/right disclaimer)
    const visibleMarginalFields = marginalFields.filter((fid) => fields[fid]?.visible !== false);

    return (
        <div style={{
            background: '#fff',
            width: '100%',
            pageBreakAfter: isLast ? 'auto' : 'always',
            breakAfter: isLast ? 'auto' : 'page',
            pageBreakInside: 'avoid',
            breakInside: 'avoid',
        }}>
            <div style={S.page}>

                {/* ── 1. Header & Shipment Details ──────────────────────────────────── */}
                <div style={S.headerWrap}>
                    {/* Top: Centered Company Info */}
                    {/* Left — Shipping line logo & name column */}
                    {companyFields.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '50px' }}>
                            {/* Logo rendering */}
                            {companyFields.map((fid) => {
                                const cfg = fields[fid];
                                if (fid !== 'shippingLineLogo' || cfg?.visible === false) return null;
                                const rawVal = fv[fid] || '';

                                // Prefer synchronous Base64 cache for printing
                                const logoSrc = rawVal;

                                return (
                                    <div key={fid} style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {logoSrc ? (
                                            <img src={logoSrc} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                                <span style={{ fontSize: '8px', color: '#999', padding: '2px', textAlign: 'center' }}>{cfg.label}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Text fields column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                {companyFields.map((fid, i) => {
                                    const cfg = fields[fid];
                                    if (fid === 'shippingLineLogo' || fid === 'agentLogo' || cfg?.visible === false) return null;
                                    const val = resolveValue(fid, json, fv);
                                    return (
                                        <div
                                            key={fid}
                                            style={{
                                                fontSize: i === 0 || i === 1 ? '18px' : '11px',
                                                fontWeight: 'bold',
                                                opacity: 1,
                                                letterSpacing: '0.02em',
                                                lineHeight: '1.2'
                                            }}
                                        >
                                            {val}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Agent Logo on the right of the company info block */}
                            {companyFields.map((fid) => {
                                const cfg = fields[fid];
                                if (fid !== 'agentLogo' || cfg?.visible === false) return null;
                                const rawVal = fv[fid] || '';
                                return (
                                    <div key={fid} style={{ marginLeft: 'auto', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        {rawVal ? (
                                            <img src={rawVal} alt="Agent" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                                <span style={{ fontSize: '8px', color: '#999', padding: '2px', textAlign: 'center' }}>{cfg.label}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Bottom: Split Flex Container (Shipment Left, Ref Right) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px' }}>

                        {/* 1. Shipment Details (Left Side) */}
                        <div style={{ flex: 1, paddingRight: '20px' }}>
                            {shipmentFields.length > 0 && (
                                <div style={{ ...S.section, marginBottom: 0, minHeight: '100%', border: 'none', padding: 0 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {shipmentFields.map((fid) => {
                                            const cfg = fields[fid];
                                            if (cfg?.visible === false) return null;
                                            return (
                                                <div key={fid} style={{ ...S.fieldRow, justifyContent: 'flex-start', gap: '8px' }}>
                                                    <span style={S.label}>{cfg?.label ?? fid}:</span>
                                                    <span style={S.value}>{resolveValue(fid, json, fv)}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Reference Block (Right Side) */}
                        <div style={{ ...S.refBlock, width: '220px', flexShrink: 0 }}>
                            {/* 1. BOL# (Bold) */}
                            {refFields.includes('bolNumber') && fields['bolNumber']?.visible !== false && (
                                <div style={S.refItemBold}>
                                    <span style={S.label}>{fields['bolNumber'].label}:</span>
                                    <span style={S.value}> {resolveValue('bolNumber', json, fv)}</span>
                                </div>
                            )}

                            {/* 2. Merged Note Block (Copy Type + Surrender Note as one field) */}
                            {refFields.includes('surrenderNote') && fields['surrenderNote']?.visible !== false && (
                                <div style={{
                                    ...S.noteBlock,
                                    whiteSpace: 'pre-line',
                                    textAlign: 'right'
                                }}>
                                    {resolveValue('surrenderNote', json, fv)}
                                </div>
                            )}

                            {/* 3. FRR# (Bold) */}
                            {refFields.includes('frrNumber') && fields['frrNumber']?.visible !== false && (
                                <div style={S.refItemBold}>
                                    <span style={S.label}>{fields['frrNumber'].label}:</span>
                                    <span style={S.value}> {resolveValue('frrNumber', json, fv)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── 3. Cargo Table (includes Totals Stripe as footer rows) ───────────── */}
                {(visibleCargoFields.length > 0 || visibleStripeFields.length > 0) && (
                    <div style={S.tableWrap}>
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    {visibleCargoFields.map((fid) => (
                                        <th key={fid} style={S.th}>
                                            {fields[fid]?.label ?? fid}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Cargo data row */}
                                {visibleCargoFields.length > 0 && (
                                    <tr>
                                        {visibleCargoFields.map((fid) => (
                                            <td key={fid} style={S.td}>
                                                {resolveValue(fid, json, fv)}
                                            </td>
                                        ))}
                                    </tr>
                                )}
                                {/* Spacer rows for writing space */}
                                {visibleCargoFields.length > 0 && [1, 2, 3].map((i) => (
                                    <tr key={i}>
                                        {visibleCargoFields.map((_, j) => (
                                            <td key={j} style={S.tdEmpty} />
                                        ))}
                                    </tr>
                                ))}
                                {/* Totals Stripe: header row (labels) + data row (values) — same structure as cargo table */}
                                {visibleStripeFields.length > 0 && (() => {
                                    const colCount = Math.max(visibleCargoFields.length, visibleStripeFields.length);
                                    const span = Math.max(1, Math.floor(colCount / visibleStripeFields.length));
                                    return (
                                        <>
                                            <tr>
                                                {visibleStripeFields.map((fid) => (
                                                    <th key={fid} colSpan={span} style={S.th}>
                                                        {fid === 'totalValueLabel' ? 'TOTAL VALUE' : (fields[fid]?.label ?? fid)}
                                                    </th>
                                                ))}
                                            </tr>
                                            <tr>
                                                {visibleStripeFields.map((fid) => (
                                                    <td key={fid} colSpan={span} style={S.td}>
                                                        {resolveValue(fid, json, fv)}
                                                    </td>
                                                ))}
                                            </tr>
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── 5. Signatures (Two Columns) ────────────────────────────────────── */}
                <div style={S.sigContainer}>

                    {/* LEFT COLUMN (Consignee) */}
                    <div style={S.sigLeftCol}>
                        {consigneeFields.includes('receiverStatement') && (
                            <div style={{ ...S.sigTextCentered, marginBottom: '40px' }}>
                                {resolveValue('receiverStatement', json, fv)}
                            </div>
                        )}

                        {/* Consignee label — above the date, for signature area */}
                        <div style={{ ...S.sigTextCentered, marginBottom: '8px', fontWeight: 'bold', fontSize: '11px' }}>
                            {fields['consigneeName']?.label ?? 'Consignee'}
                        </div>

                        <div style={{ width: '80%', borderBottom: '2px solid #000', marginBottom: '4px' }}></div>

                        <div style={S.sigTextCentered}>
                            (CONSIGNEE)<br />
                            {consigneeFields.includes('consigneeDate') ? resolveValue('consigneeDate', json, fv) : ''}
                        </div>

                        {/* Hardcoded doc stamp box — always shown */}
                        <div style={S.stampBox}>
                            <div style={{ textAlign: 'left', width: '100%' }}>
                                The above described merchandise, if properly packed and marked as hereby accepted for shipment.
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                                (Space for Stamp & Signature)
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (Carrier) */}
                    <div style={S.sigRightCol}>
                        {carrierFields.includes('legalTerms') && (
                            <div style={S.sigTextJustified}>
                                {resolveValue('legalTerms', json, fv)}
                            </div>
                        )}

                        {carrierFields.includes('carrierDate') && (
                            <div style={{ ...S.sigTextCentered, alignSelf: 'flex-end', marginTop: '10px' }}>
                                {resolveValue('carrierDate', json, fv)}
                            </div>
                        )}

                        {carrierFields.includes('quartermasterInitial') && (
                            <div style={S.validationBox}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                    <span>{fields['quartermasterInitial']?.label}</span>
                                    <span style={{ ...S.sigLine, width: '100px' }}></span>
                                    <span>, 20</span>
                                    <span style={{ ...S.sigLine, width: '40px' }}></span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '80%', alignSelf: 'flex-start', marginTop: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                        <span>{fields['verifiedBy']?.label}</span>
                                        <span style={{ ...S.sigLine, flex: 1 }}></span>
                                    </div>
                                    <span style={{ fontSize: '9px', marginTop: '2px' }}>{resolveValue('officerOnWatchLabel', json, fv) || 'Officer on Watch'}</span>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* ── 6. Marginal Disclaimer (bottom left/right) ───────────────────────────── */}
                {visibleMarginalFields.length > 0 && visibleMarginalFields.some((fid) => resolveValue(fid, json, fv).trim()) && (
                    <div style={S.marginalWrap}>
                        {visibleMarginalFields.map((fid) => {
                            const align = fid === 'marginalDisclaimerRight' ? S.marginalRight : S.marginalLeft;
                            const text = resolveValue(fid, json, fv);
                            if (!text.trim()) return null;
                            return (
                                <div key={fid} style={align}>
                                    {text}
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </div >
    );
}
