"use client";

import { useEffect, useRef, useCallback } from "react";
import gsap from "gsap";
import { IconArrowUpRight } from "@tabler/icons-react";
import type { BookingStats } from "@/services/auth.service";

function usePrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface DashboardChartsProps {
  bookingStats: BookingStats | null;
}

/* ────────────────────────────────────────────────────────────
 * 1. BOOKING VOLUME — Area chart with gradient fill (top-left)
 * ──────────────────────────────────────────────────────────── */
function BookingVolumeChart({ data }: { data: { month: string; count: number }[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const drawChart = useCallback(() => {
    if (!svgRef.current || data.length === 0) return;
    const svg = svgRef.current;
    const width = svg.clientWidth || 600;
    const height = svg.clientHeight || 220;
    const padding = { top: 24, right: 16, bottom: 32, left: 40 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data.map((d) => d.count), 1);

    // Clear previous content
    svg.innerHTML = "";

    // Defs for gradient
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

    const gradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    gradient.setAttribute("id", "areaGrad");
    gradient.setAttribute("x1", "0");
    gradient.setAttribute("y1", "0");
    gradient.setAttribute("x2", "0");
    gradient.setAttribute("y2", "1");
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "var(--chart-1)");
    stop1.setAttribute("stop-opacity", "0.35");
    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "var(--chart-1)");
    stop2.setAttribute("stop-opacity", "0.02");
    gradient.append(stop1, stop2);
    defs.append(gradient);

    // Glow filter
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", "glow");
    const feGauss = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    feGauss.setAttribute("stdDeviation", "2");
    feGauss.setAttribute("result", "blur");
    const feMerge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
    const fmn1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    fmn1.setAttribute("in", "blur");
    const fmn2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
    fmn2.setAttribute("in", "SourceGraphic");
    feMerge.append(fmn1, fmn2);
    filter.append(feGauss, feMerge);
    defs.append(filter);

    svg.append(defs);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${padding.left},${padding.top})`);

    // Grid lines
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const y = (chartH / gridCount) * i;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", String(y));
      line.setAttribute("x2", String(chartW));
      line.setAttribute("y2", String(y));
      line.setAttribute("stroke", "var(--border)");
      line.setAttribute("stroke-dasharray", "4 4");
      line.setAttribute("stroke-opacity", "0.5");
      g.append(line);

      // Y-axis labels
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", "-8");
      label.setAttribute("y", String(y + 4));
      label.setAttribute("text-anchor", "end");
      label.setAttribute("fill", "var(--muted-foreground)");
      label.setAttribute("font-size", "10");
      label.setAttribute("font-family", "inherit");
      label.textContent = String(Math.round(maxVal - (maxVal / gridCount) * i));
      g.append(label);
    }

    // Points
    const points = data.map((d, i) => ({
      x: data.length > 1 ? (i / (data.length - 1)) * chartW : chartW / 2,
      y: chartH - (d.count / maxVal) * chartH,
    }));

    // Create smooth bezier curve path
    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = curr.x - (curr.x - prev.x) * 0.4;
      linePath += ` C ${cpx1} ${prev.y} ${cpx2} ${curr.y} ${curr.x} ${curr.y}`;
    }

    // Area path
    const areaPath = linePath + ` L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

    // Area fill
    const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
    area.setAttribute("d", areaPath);
    area.setAttribute("fill", "url(#areaGrad)");
    area.setAttribute("opacity", "0");
    g.append(area);

    // Line stroke
    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
    line.setAttribute("d", linePath);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke", "var(--chart-1)");
    line.setAttribute("stroke-width", "2.5");
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("filter", "url(#glow)");
    const totalLength = line.getTotalLength?.() ?? 1000;
    line.setAttribute("stroke-dasharray", String(totalLength));
    line.setAttribute("stroke-dashoffset", String(totalLength));
    g.append(line);

    // Dots
    const dots: SVGCircleElement[] = [];
    points.forEach((p, i) => {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("cx", String(p.x));
      dot.setAttribute("cy", String(p.y));
      dot.setAttribute("r", "4");
      dot.setAttribute("fill", "var(--chart-1)");
      dot.setAttribute("stroke", "var(--card)");
      dot.setAttribute("stroke-width", "2");
      dot.setAttribute("opacity", "0");
      dot.style.cursor = "pointer";
      dots.push(dot);
      g.append(dot);

      // X-axis labels
      const xLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
      xLabel.setAttribute("x", String(p.x));
      xLabel.setAttribute("y", String(chartH + 20));
      xLabel.setAttribute("text-anchor", "middle");
      xLabel.setAttribute("fill", "var(--muted-foreground)");
      xLabel.setAttribute("font-size", "10");
      xLabel.setAttribute("font-family", "inherit");
      xLabel.textContent = new Date(`${data[i].month}-01`).toLocaleDateString("en", { month: "short" });
      g.append(xLabel);
    });

    svg.append(g);

    // GSAP animation timeline
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    if (prefersReducedMotion) {
      gsap.set(line, { strokeDashoffset: 0 });
      gsap.set(area, { opacity: 1 });
      gsap.set(dots, { opacity: 1 });
      return;
    }

    tl.to(line, {
      strokeDashoffset: 0,
      duration: 0.8,
    });

    tl.to(area, {
      opacity: 1,
      duration: 0.35,
    }, "-=0.6");

    dots.forEach((dot, i) => {
      tl.to(dot, {
        opacity: 1,
        duration: 0.1,
      }, 0.2 + i * 0.05);
    });

  }, [data]);

  useEffect(() => {
    drawChart();
    const ro = new ResizeObserver(() => drawChart());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [drawChart]);

  return (
    <div ref={containerRef} className="h-full w-full">
      {data.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
          No booking data available
        </div>
      ) : (
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ minHeight: "220px" }}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * 2. BOOKING STATUS — Animated donut chart (top-right)
 * ──────────────────────────────────────────────────────────── */
function BookingStatusDonut({ stats }: { stats: BookingStats }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    svg.innerHTML = "";

    const total = stats.total || 1;
    const segments = [
      { label: "Confirmed", value: stats.confirmed, color: "var(--chart-2)" },
      { label: "Pending", value: stats.pending, color: "var(--chart-3)" },
      { label: "Cancelled", value: stats.cancelled, color: "var(--chart-5)" },
    ].filter(s => s.value > 0);

    // If no segments, show empty state
    if (segments.length === 0) {
      segments.push({ label: "No Data", value: 1, color: "var(--border)" });
    }

    const cx = 80;
    const cy = 80;
    const r = 56;
    const strokeW = 14;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Background ring
    const bgRing = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bgRing.setAttribute("cx", String(cx));
    bgRing.setAttribute("cy", String(cy));
    bgRing.setAttribute("r", String(r));
    bgRing.setAttribute("fill", "none");
    bgRing.setAttribute("stroke", "var(--border)");
    bgRing.setAttribute("stroke-width", "2");
    bgRing.setAttribute("stroke-opacity", "0.3");
    g.append(bgRing);

    const circumference = 2 * Math.PI * r;
    let currentOffset = -circumference * 0.25; // Start from top

    segments.forEach((seg) => {
      const segLength = (seg.value / total) * circumference;
      const arc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      arc.setAttribute("cx", String(cx));
      arc.setAttribute("cy", String(cy));
      arc.setAttribute("r", String(r));
      arc.setAttribute("fill", "none");
      arc.setAttribute("stroke", seg.color);
      arc.setAttribute("stroke-width", String(strokeW));
      arc.setAttribute("stroke-linecap", "round");
      arc.setAttribute("stroke-dasharray", `${segLength} ${circumference - segLength}`);
      arc.setAttribute("stroke-dashoffset", String(-currentOffset));
      arc.style.transition = "none";

      // For GSAP animation — start hidden
      arc.setAttribute("opacity", "0");
      g.append(arc);

      currentOffset += segLength;

      // GSAP draw-in animation
      if (prefersReducedMotion) {
        gsap.set(arc, {
          opacity: 1,
          strokeDasharray: `${segLength} ${circumference - segLength}`,
        });
      } else {
        gsap.fromTo(arc,
          { opacity: 0, strokeDasharray: `0 ${circumference}` },
          {
            opacity: 1,
            strokeDasharray: `${segLength} ${circumference - segLength}`,
            duration: 0.55,
            delay: 0.18,
            ease: "power2.out",
          }
        );
      }
    });

    // Center text
    const centerTotal = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerTotal.setAttribute("x", String(cx));
    centerTotal.setAttribute("y", String(cy - 4));
    centerTotal.setAttribute("text-anchor", "middle");
    centerTotal.setAttribute("dominant-baseline", "middle");
    centerTotal.setAttribute("fill", "var(--foreground)");
    centerTotal.setAttribute("font-size", "22");
    centerTotal.setAttribute("font-weight", "700");
    centerTotal.setAttribute("font-family", "inherit");
    centerTotal.textContent = String(stats.total);
    g.append(centerTotal);

    const centerLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    centerLabel.setAttribute("x", String(cx));
    centerLabel.setAttribute("y", String(cy + 16));
    centerLabel.setAttribute("text-anchor", "middle");
    centerLabel.setAttribute("fill", "var(--muted-foreground)");
    centerLabel.setAttribute("font-size", "10");
    centerLabel.setAttribute("font-family", "inherit");
    centerLabel.textContent = "total";
    g.append(centerLabel);

    svg.append(g);

    // Animate center number
    const obj = { val: 0 };
    if (prefersReducedMotion) {
      centerTotal.textContent = String(stats.total);
    } else {
      gsap.to(obj, {
        val: stats.total,
        duration: 0.7,
        ease: "power2.out",
        delay: 0.1,
        snap: { val: 1 },
        onUpdate: () => {
          centerTotal.textContent = String(Math.round(obj.val));
        },
      });
    }

  }, [stats, prefersReducedMotion]);

  const segments = [
    { label: "Confirmed", value: stats.confirmed, color: "bg-[var(--chart-2)]" },
    { label: "Pending", value: stats.pending, color: "bg-[var(--chart-3)]" },
    { label: "Cancelled", value: stats.cancelled, color: "bg-[var(--chart-5)]" },
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <svg ref={svgRef} viewBox="0 0 160 160" className="w-40 h-40" />
      <div className="w-full space-y-2.5">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${seg.color}`} />
              <span className="text-muted-foreground font-medium">{seg.label}</span>
            </div>
            <span className="font-semibold text-foreground tabular-nums">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * 3. SPEND BY ROUTE — Horizontal bars with GSAP stagger
 * ──────────────────────────────────────────────────────────── */
function SpendByRoute({ data }: { data: { route: string; revenue: number; count: number }[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;
    const bars = containerRef.current.querySelectorAll(".route-bar-fill");

    if (prefersReducedMotion) {
      gsap.set(bars, { scaleX: 1 });
      return;
    }

    gsap.fromTo(bars,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.45,
        stagger: 0.05,
        ease: "power2.out",
        delay: 0.08,
      }
    );
  }, [data, prefersReducedMotion]);

  const maxSpend = Math.max(...data.map((r) => r.revenue), 1);

  return (
    <div ref={containerRef} className="space-y-4">
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border min-h-[120px]">
          No route data available
        </div>
      ) : (
        data.map((r, i) => {
          const width = Math.max((r.revenue / maxSpend) * 100, 4);
          return (
            <div key={`${r.route}-${i}`} className="group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-foreground truncate max-w-[160px]" title={r.route}>
                  {r.route}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground tabular-nums">{r.count} trips</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    ₱{r.revenue.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="w-full h-2.5 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="route-bar-fill h-full rounded-full bg-gradient-to-r from-violet-600/60 to-violet-500 dark:from-violet-500/60 dark:to-violet-400 origin-left"
                  style={{ width: `${width}%`, transform: "scaleX(0)" }}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * 4. SHIPPING LINE DISTRIBUTION — Mini horizontal breakdown
 * ──────────────────────────────────────────────────────────── */
function ShippingLineBreakdown({ tenants }: { tenants: BookingStats["tenants"] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const colors = [
    "bg-blue-500", "bg-emerald-500", "bg-violet-500",
    "bg-amber-500", "bg-rose-500", "bg-teal-500",
  ];
  const barColors = [
    "from-blue-600/60 to-blue-500", "from-emerald-600/60 to-emerald-500",
    "from-violet-600/60 to-violet-500", "from-amber-600/60 to-amber-500",
    "from-rose-600/60 to-rose-500", "from-teal-600/60 to-teal-500",
  ];

  const totalBookings = tenants.reduce((sum, t) => sum + (t.booking_count ?? 0), 0) || 1;

  useEffect(() => {
    if (!containerRef.current || tenants.length === 0) return;

    // Stacked bar animation
    const stackBars = containerRef.current.querySelectorAll(".stack-segment");
    const items = containerRef.current.querySelectorAll(".tenant-item");

    if (prefersReducedMotion) {
      gsap.set(stackBars, { scaleX: 1 });
      gsap.set(items, { opacity: 1, x: 0 });
      return;
    }

    gsap.fromTo(stackBars,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 0.4,
        stagger: 0.035,
        ease: "power2.out",
        delay: 0.12,
      }
    );

    // List item fade-in
    gsap.fromTo(items,
      { opacity: 0, x: -8 },
      {
        opacity: 1,
        x: 0,
        duration: 0.22,
        stagger: 0.04,
        ease: "power2.out",
        delay: 0.2,
      }
    );
  }, [tenants, prefersReducedMotion]);

  return (
    <div ref={containerRef}>
      {tenants.length === 0 ? (
        <div className="flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border min-h-[120px]">
          No shipping line data
        </div>
      ) : (
        <>
          {/* Stacked progress bar */}
          <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden flex mb-5">
            {tenants.map((t, i) => {
              const pct = ((t.booking_count ?? 0) / totalBookings) * 100;
              return (
                <div
                  key={t.tenant_id}
                  className={`stack-segment h-full bg-gradient-to-r ${barColors[i % barColors.length]} origin-left`}
                  style={{ width: `${pct}%`, transform: "scaleX(0)" }}
                />
              );
            })}
          </div>

          {/* Breakdown list */}
          <div className="space-y-3">
            {tenants.map((t, i) => {
              const pct = Math.round(((t.booking_count ?? 0) / totalBookings) * 100);
              return (
                <div key={t.tenant_id} className="tenant-item flex items-center justify-between text-xs" style={{ opacity: 0 }}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`size-2.5 rounded-full ${colors[i % colors.length]} shrink-0`} />
                    <span className="font-medium text-foreground truncate max-w-[140px]" title={t.tenant_name}>
                      {t.tenant_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground tabular-nums">{t.booking_count}</span>
                    <span className="font-semibold text-foreground tabular-nums w-10 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * MAIN EXPORT — the charts grid layout
 * ──────────────────────────────────────────────────────────── */
export default function DashboardCharts({ bookingStats }: DashboardChartsProps) {
  const monthlyData = bookingStats?.bookings_by_month ?? [];
  const routeData = bookingStats?.revenue_by_route?.slice(0, 6) ?? [];
  const tenants = bookingStats?.tenants ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Booking Volume — Area Chart */}
      <section className="lg:col-span-7 bg-card rounded-2xl border border-border/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">Booking Volume</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly booking trends</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: "var(--chart-1)" }} /> Bookings
          </span>
        </header>
        <div className="h-56 md:h-64">
          <BookingVolumeChart data={monthlyData} />
        </div>
      </section>

      {/* 2. Booking Status — Donut Chart */}
      <section className="lg:col-span-5 bg-card rounded-2xl border border-border/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <header className="mb-4">
          <h3 className="text-base font-semibold text-foreground">Booking Status</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Distribution by status</p>
        </header>
        {bookingStats ? (
          <BookingStatusDonut stats={bookingStats} />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border min-h-[200px]">
            No data available
          </div>
        )}
      </section>

      {/* 3. Top Routes by Spend — Horizontal bars */}
      <section className="lg:col-span-7 bg-card rounded-2xl border border-border/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <header className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Top Routes by Spend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Highest cost routes</p>
          </div>
          {routeData.length > 0 && (
            <a href="/bookings" className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors">
              View all <IconArrowUpRight className="size-3" />
            </a>
          )}
        </header>
        <SpendByRoute data={routeData} />
      </section>

      {/* 4. Shipping Line Distribution */}
      <section className="lg:col-span-5 bg-card rounded-2xl border border-border/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <header className="mb-5">
          <h3 className="text-base font-semibold text-foreground">Shipping Lines</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Bookings per partner</p>
        </header>
        <ShippingLineBreakdown tenants={tenants} />
      </section>
    </div>
  );
}
