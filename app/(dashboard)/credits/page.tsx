"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IconWallet,
  IconPlus,
  IconLoader2,
  IconX,
  IconArrowUpRight,
  IconArrowDownRight,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { authService } from "@/services/auth.service";
import { listVariants, itemVariants } from "@/components/motion/page-transition";
import { CreditsTransactionsSkeleton } from "@/components/ui/skeletons";

const PAGE_SIZE = 20;

const TYPE_CONFIG: Record<string, { label: string; color: string; dot: string; icon: typeof IconArrowUpRight; positive: boolean }> = {
  top_up:           { label: "Top Up",          color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400", dot: "bg-emerald-500", icon: IconArrowUpRight,   positive: true  },
  refund:           { label: "Refund",           color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400",                 dot: "bg-blue-500",    icon: IconArrowUpRight,   positive: true  },
  adjustment:       { label: "Adjustment",       color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400",           dot: "bg-amber-500",   icon: IconRefresh,        positive: true  },
  deduction:        { label: "Deduction",        color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",                       dot: "bg-red-500",     icon: IconArrowDownRight, positive: false },
  booking_deduction:{ label: "Booking",          color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400",                       dot: "bg-red-500",     icon: IconArrowDownRight, positive: false },
};

const FALLBACK_CONFIG = {
  label: "", color: "text-muted-foreground bg-muted border-border", dot: "bg-muted-foreground", icon: IconRefresh, positive: false,
};

export default function CreditsPage() {
  const queryClient = useQueryClient();
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>("");

  const {
    data: balance,
    isPending: balanceLoading,
  } = useQuery({
    queryKey: ["credits-balance"],
    queryFn: () => authService.getCreditBalance(),
  });

  const {
    data: transactions,
    isPending: txLoading,
  } = useQuery({
    queryKey: ["credits-transactions", page, typeFilter],
    queryFn: () =>
      authService.getCreditTransactions({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        type: typeFilter || undefined,
      }),
  });

  async function handleTopUp(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.topUpCredits(amount);
      toast.success("Credits added successfully");
      setShowTopUpModal(false);
      setTopUpAmount("");
      setPage(0);
      await queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
      await queryClient.invalidateQueries({ queryKey: ["credits-transactions"] });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      toast.error("Failed to top up credits", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalPages = transactions ? Math.ceil(transactions.total / PAGE_SIZE) : 0;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Credits</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your company credit balance</p>
        </div>
        <button
          onClick={() => setShowTopUpModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <IconPlus className="size-4" />
          Top Up
        </button>
      </div>

      {/* Low Balance Warning */}
      {!balanceLoading && balance !== undefined && balance.balance < 5000 && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
          <IconAlertTriangle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Low credit balance</p>
            <p className="text-xs mt-0.5 opacity-80">
              Your balance is below ₱5,000. Top up to avoid disruptions to your bookings.
            </p>
          </div>
          <button
            onClick={() => setShowTopUpModal(true)}
            className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            Top Up
          </button>
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-6 bg-gradient-to-t from-primary/5 to-transparent">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-2">
          Available Balance
        </p>
        {balanceLoading ? (
          <div className="h-10 w-56 rounded-lg bg-muted animate-pulse" />
        ) : (
          <p className="text-4xl font-extrabold tabular-nums text-foreground tracking-tight">
            ₱{(balance?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      {/* Transaction History */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div>
            <h3 className="font-semibold leading-none tracking-tight text-foreground">Transaction History</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {transactions?.total != null ? `${transactions.total} total transaction${transactions.total !== 1 ? "s" : ""}` : ""}
            </p>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            className="text-xs px-3 py-1.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
          >
            <option value="">All Types</option>
            <option value="top_up">Top Up</option>
            <option value="booking_deduction">Booking</option>
            <option value="deduction">Deduction</option>
            <option value="refund">Refund</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        {txLoading ? (
          <CreditsTransactionsSkeleton />
        ) :!transactions?.data?.length ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="size-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <IconWallet className="size-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No transactions yet</h3>
            <p className="text-sm text-muted-foreground">
              Your credit transactions will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/30">
              <div>Type</div>
              <div>Description</div>
              <div>Date</div>
              <div className="text-right">Amount</div>
            </div>

            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="divide-y divide-border/50"
            >
              {transactions.data.map((tx) => {
                const config = TYPE_CONFIG[tx.type] ?? { ...FALLBACK_CONFIG, label: tx.type };
                const TxIcon = config.icon;

                return (
                  <motion.div
                    key={tx.id}
                    variants={itemVariants}
                    className="flex flex-col md:grid md:grid-cols-[2fr_2fr_1fr_1fr] gap-4 px-6 py-4 items-start md:items-center hover:bg-muted/30 transition-colors group"
                  >
                    {/* Type badge */}
                    <div className="flex items-center gap-3">
                      <div className={`shrink-0 size-9 rounded-xl border flex items-center justify-center ${config.color}`}>
                        <TxIcon className="size-4" />
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${config.color}`}>
                        <span className={`size-1.5 rounded-full ${config.dot}`} />
                        {config.label}
                      </span>
                    </div>

                    {/* Description */}
                    <span className="text-sm text-muted-foreground truncate pl-12 md:pl-0">
                      {tx.description || "—"}
                    </span>

                    {/* Date */}
                    <span className="text-xs text-muted-foreground pl-12 md:pl-0">
                      {new Date(tx.created_at).toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>

                    {/* Amount + balance */}
                    <div className="text-right pl-12 md:pl-0 shrink-0">
                      <p className={`text-sm font-bold tabular-nums ${config.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {config.positive ? "+" : "−"}₱{Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                        Bal: ₱{tx.balance_after.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-card">
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted disabled:opacity-30 transition-colors flex items-center gap-1"
                  >
                    <IconChevronLeft className="size-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-muted disabled:opacity-30 transition-colors flex items-center gap-1"
                  >
                    Next
                    <IconChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Top Up Modal */}
      <AnimatePresence>
        {showTopUpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isSubmitting && setShowTopUpModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-card rounded-2xl border border-border w-full max-w-sm p-6 shadow-lg z-10"
            >
              <button
                onClick={() => !isSubmitting && setShowTopUpModal(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
              >
                <IconX className="size-4" />
              </button>
              <h2 className="text-xl font-semibold mb-1 tracking-tight">Top Up Credits</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Add credits to your company balance.
              </p>
              <form onSubmit={handleTopUp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Amount (₱)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1000, 5000, 10000, 50000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTopUpAmount(String(preset))}
                      disabled={isSubmitting}
                      className="px-2 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    >
                      ₱{preset.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => !isSubmitting && setShowTopUpModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !topUpAmount || parseFloat(topUpAmount) <= 0}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isSubmitting && <IconLoader2 className="size-4 animate-spin" />}
                    {isSubmitting ? "Processing..." : "Add Credits"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
