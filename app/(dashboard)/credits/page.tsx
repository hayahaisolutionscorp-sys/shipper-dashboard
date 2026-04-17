"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

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
  IconCheck,
} from "@tabler/icons-react";
import {
  authService,
  type CreateSplitDepositPayload,
  type DepositMethodConfig,
  type ShipperTopUpRequest,
} from "@/services/auth.service";
import { useGsapPresence, useGsapStagger } from "@/lib/gsap-animations";
import { CreditsTransactionsSkeleton } from "@/components/ui/skeletons";
import { OverlayPortal } from "@/components/ui/overlay-portal";

const PAGE_SIZE = 20;
const SPLIT_STORAGE_KEY = "shipper_last_split_tx";

type ModalStep =
  | "method"
  | "amount"
  | "review"
  | "split_proposal"
  | "split_builder"
  | "split_review"
  | "processing"
  | "success";

type SplitFormLeg = {
  id: string;
  amount: string;
  methodCode: DepositMethodConfig["code"];
  legType: "instant" | "manual";
  userReferenceNumber?: string;
  proofFile?: File | null;
  proofUrl?: string;
};

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

const PAYMENT_METHOD_VISUALS: Partial<
  Record<
    DepositMethodConfig["code"],
    {
      src: string;
      alt: string;
      width: number;
      height: number;
    }
  >
> = {
  gcash: {
    src: "/GCash_logo.svg",
    alt: "GCash",
    width: 120,
    height: 34,
  },
  paymaya: {
    src: "/Maya_logo.svg",
    alt: "Maya",
    width: 112,
    height: 32,
  },
  grabpay: {
    src: "/grab-pay-logo-png_seeklogo-371015.png",
    alt: "GrabPay",
    width: 104,
    height: 32,
  },
  qrph: {
    src: "/QR_Ph_Logo.svg",
    alt: "QR Ph",
    width: 106,
    height: 30,
  },
  cards: {
    src: "/atm-card.png",
    alt: "Card Payment",
    width: 44,
    height: 44,
  },
  bank_transfer: {
    src: "/transference.png",
    alt: "Bank Transfer",
    width: 40,
    height: 40,
  },
};

const DEFAULT_PAYMENT_VISUAL = {
  src: "/atm-card.png",
  alt: "Payment Method",
  width: 40,
  height: 40,
};

const createLegId = () => `leg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const formatCurrency = (value: number) =>
  `₱${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const topUpStatusClass = (status: ShipperTopUpRequest["status"]) => {
  if (status === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
};

export default function CreditsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [step, setStep] = useState<ModalStep>("method");
  const [amount, setAmount] = useState("");
  const [selectedMethodCode, setSelectedMethodCode] = useState<DepositMethodConfig["code"] | null>(null);
  const [manualReference, setManualReference] = useState("");
  const [manualProofFile, setManualProofFile] = useState<File | null>(null);
  const [manualProofUrl, setManualProofUrl] = useState("");
  const [splitLegs, setSplitLegs] = useState<SplitFormLeg[]>([]);
  const [processingMessage, setProcessingMessage] = useState("");
  const [processingCountdown, setProcessingCountdown] = useState(3);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isTopUpBusy, setIsTopUpBusy] = useState(false);
  const [trackedSplitTransactionId, setTrackedSplitTransactionId] = useState<string | null>(null);
  const [topUpRequestStatusFilter, setTopUpRequestStatusFilter] = useState<"all" | "for_verification" | "success" | "rejected">("all");
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

  const { data: enabledProviders, refetch: refetchProviders } = useQuery({
    queryKey: ["credits-payment-providers"],
    queryFn: () => authService.getEnabledPaymentProviders(),
    staleTime: 60_000,
  });

  const { data: depositMethods, refetch: refetchDepositMethods } = useQuery({
    queryKey: ["credits-deposit-methods"],
    queryFn: () => authService.getDepositMethods(),
    staleTime: 60_000,
  });

  const splitIdFromUrl = searchParams.get("splitTransactionId");

  useEffect(() => {
    const returnStatus = searchParams.get("paymentStatus");
    if (!returnStatus) return;

    if (returnStatus === "success") {
      toast.success("Payment completed", {
        description: "We are now verifying and applying your top-up.",
      });
    } else if (returnStatus === "cancelled") {
      toast.info("Payment was cancelled", {
        description: "You can retry the instant payment anytime.",
      });
    } else if (returnStatus === "failed") {
      toast.error("Payment failed", {
        description: "Please try again or choose a different method.",
      });
    }

    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.delete("paymentStatus");
    const nextQuery = nextUrl.searchParams.toString();
    window.history.replaceState({}, "", `${nextUrl.pathname}${nextQuery ? `?${nextQuery}` : ""}`);
  }, [searchParams]);

  useEffect(() => {
    if (splitIdFromUrl) {
      setTrackedSplitTransactionId(splitIdFromUrl);
      localStorage.setItem(SPLIT_STORAGE_KEY, splitIdFromUrl);
      return;
    }

    const fromStorage = localStorage.getItem(SPLIT_STORAGE_KEY);
    if (fromStorage) {
      setTrackedSplitTransactionId(fromStorage);
    }
  }, [splitIdFromUrl]);

  const { data: trackedSplitStatus } = useQuery({
    queryKey: ["credits-split-status", trackedSplitTransactionId],
    queryFn: () => authService.getShipperSplitDepositStatus(trackedSplitTransactionId as string),
    enabled: !!trackedSplitTransactionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return 5000;
      return ["fully_paid", "failed", "cancelled"].includes(status) ? false : 5000;
    },
  });

  const {
    data: topUpRequests,
    isPending: topUpRequestsLoading,
  } = useQuery({
    queryKey: ["credits-top-up-requests", topUpRequestStatusFilter],
    queryFn: () =>
      authService.getTopUpRequests(
        topUpRequestStatusFilter === "all" ? undefined : topUpRequestStatusFilter,
      ),
  });

  useEffect(() => {
    if (!trackedSplitStatus) return;
    if (trackedSplitStatus.status === "fully_paid") {
      queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
      queryClient.invalidateQueries({ queryKey: ["credits-transactions"] });
    }
  }, [trackedSplitStatus, queryClient]);

  useEffect(() => {
    if (step !== "processing" || !redirectUrl) return;
    if (processingCountdown <= 0) {
      window.location.href = redirectUrl;
      return;
    }

    const timer = window.setTimeout(() => {
      setProcessingCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [step, redirectUrl, processingCountdown]);

  const availableMethods = useMemo(
    () => (depositMethods ?? []).filter((method) => method.is_enabled),
    [depositMethods],
  );

  const methodMap = useMemo(() => {
    const map = new Map<DepositMethodConfig["code"], DepositMethodConfig>();
    for (const method of availableMethods) {
      map.set(method.code, method);
    }
    return map;
  }, [availableMethods]);

  const selectedMethod = selectedMethodCode ? methodMap.get(selectedMethodCode) : undefined;

  const paymongoEnabled = enabledProviders?.some((provider) => provider.code === "paymongo");
  const mayaEnabled = enabledProviders?.some((provider) => provider.code === "maya");

  const getLegTypeFromMethod = (methodCode: DepositMethodConfig["code"]): "instant" | "manual" => {
    const method = methodMap.get(methodCode);
    return method?.kind === "manual" ? "manual" : "instant";
  };

  const resetTopUpModal = () => {
    setStep("method");
    setAmount("");
    setSelectedMethodCode(null);
    setManualReference("");
    setManualProofFile(null);
    setManualProofUrl("");
    setSplitLegs([]);
    setProcessingMessage("");
    setProcessingCountdown(3);
    setRedirectUrl(null);
    setIsTopUpBusy(false);
  };

  const openTopUpModal = async () => {
    resetTopUpModal();
    setShowTopUpModal(true);
    await Promise.all([refetchProviders(), refetchDepositMethods()]);
  };

  const closeTopUpModal = () => {
    if (isTopUpBusy) return;
    setShowTopUpModal(false);
    resetTopUpModal();
  };

  const buildSplitProposal = (
    totalAmount: number,
    preferredMethodCode: DepositMethodConfig["code"],
    splitLimit: number,
  ): SplitFormLeg[] => {
    if (!Number.isFinite(splitLimit) || splitLimit <= 0) {
      throw new Error("Split limit is not configured for this payment method.");
    }

    const proposal: SplitFormLeg[] = [];
    const preferredMethod = methodMap.get(preferredMethodCode);
    const preferredIsManual = preferredMethod?.kind === "manual";
    const manualMethod = availableMethods.find((method) => method.kind === "manual");

    let remaining = Number(totalAmount.toFixed(2));
    let hasInstantLeg = false;

    while (remaining > 0.004 && proposal.length < 5) {
      if (!preferredIsManual && !hasInstantLeg) {
        const instantAmount = Math.min(remaining, splitLimit);
        proposal.push({
          id: createLegId(),
          amount: instantAmount.toFixed(2),
          methodCode: preferredMethodCode,
          legType: "instant",
        });
        remaining = Number((remaining - instantAmount).toFixed(2));
        hasInstantLeg = true;

        if (remaining <= 0.004) break;
      }

      if (!manualMethod) {
        break;
      }

      const manualAmount = Math.min(remaining, splitLimit);
      proposal.push({
        id: createLegId(),
        amount: manualAmount.toFixed(2),
        methodCode: manualMethod.code,
        legType: "manual",
        userReferenceNumber: "",
        proofFile: null,
        proofUrl: "",
      });
      remaining = Number((remaining - manualAmount).toFixed(2));
    }

    if (remaining > 0.004) {
      throw new Error("Amount is too large for current split settings. Please reduce the amount.");
    }

    return proposal;
  };

  const splitTotalAmount = splitLegs.reduce((sum, leg) => sum + Number(leg.amount || 0), 0);
  const splitRemainingAmount = Number((Number(amount || 0) - splitTotalAmount).toFixed(2));
  const splitRemainingIsBalanced = Math.abs(splitRemainingAmount) < 0.005;

  const validateSplitLegs = (): string | null => {
    const instantLegCount = splitLegs.filter((leg) => leg.legType === "instant").length;
    if (instantLegCount > 1) return "Only one instant leg is allowed per split transaction.";
    if (splitLegs.some((leg) => Number(leg.amount || 0) <= 0)) {
      return "All split legs must have an amount greater than zero.";
    }
    if (!splitRemainingIsBalanced) {
      return splitRemainingAmount < 0
        ? "Remaining amount cannot be negative. Adjust split amounts."
        : "Split amounts must match the total top-up amount exactly.";
    }

    for (const leg of splitLegs) {
      if (leg.legType !== "manual") continue;
      if (!leg.userReferenceNumber?.trim()) {
        return "Each manual split leg requires a reference number.";
      }
      if (!leg.proofFile && !leg.proofUrl) {
        return "Each manual split leg requires proof of payment.";
      }
    }

    return null;
  };

  const updateSplitLeg = (legId: string, updates: Partial<SplitFormLeg>) => {
    setSplitLegs((prev) => prev.map((leg) => (leg.id === legId ? { ...leg, ...updates } : leg)));
  };

  const removeSplitLeg = (legId: string) => {
    if (splitLegs.length <= 1) return;
    setSplitLegs((prev) => prev.filter((leg) => leg.id !== legId));
  };

  const addSplitLeg = () => {
    if (splitLegs.length >= 5) return;
    const manualMethod = availableMethods.find((method) => method.kind === "manual")?.code ?? "bank_transfer";
    setSplitLegs((prev) => [
      ...prev,
      {
        id: createLegId(),
        amount: "0.00",
        methodCode: manualMethod,
        legType: "manual",
        userReferenceNumber: "",
        proofFile: null,
        proofUrl: "",
      },
    ]);
  };

  const updateSplitLegMethod = (legId: string, methodCode: DepositMethodConfig["code"]) => {
    const targetType = getLegTypeFromMethod(methodCode);
    if (targetType === "instant") {
      const hasOtherInstant = splitLegs.some((leg) => leg.id !== legId && leg.legType === "instant");
      if (hasOtherInstant) {
        toast.error("Only one instant leg is allowed in split payment.");
        return;
      }
    }

    updateSplitLeg(legId, {
      methodCode,
      legType: targetType,
    });
  };

  const resolveInstantProvider = (method: DepositMethodConfig): "paymongo" | "maya" => {
    if (!paymongoEnabled && !mayaEnabled) {
      throw new Error("No instant payment provider is currently enabled.");
    }
    if (method.code === "cards" && mayaEnabled) return "maya";
    if (method.provider_code === "maya" && mayaEnabled) return "maya";
    if (method.provider_code === "paymongo" && paymongoEnabled) return "paymongo";
    if (paymongoEnabled) return "paymongo";
    if (mayaEnabled) return "maya";
    return "paymongo";
  };

  const buildReturnUrl = (status: "success" | "cancelled" | "failed") => {
    return `${window.location.origin}${window.location.pathname}?paymentStatus=${status}`;
  };

  const submitSingleMethodTopUp = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method.");
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    setIsTopUpBusy(true);
    try {
      if (selectedMethod.kind === "manual") {
        if (!manualReference.trim()) {
          toast.error("Reference number is required for manual deposits.");
          return;
        }

        let proofUrl = manualProofUrl.trim();
        if (!proofUrl) {
          if (!manualProofFile) {
            toast.error("Proof of payment is required for manual deposits.");
            return;
          }
          const upload = await authService.uploadProofOfPayment(manualProofFile);
          proofUrl = upload.url;
        }

        await authService.requestManualCreditDeposit({
          amount: numAmount,
          payment_method: selectedMethod.code,
          user_reference_number: manualReference.trim(),
          proof_url: proofUrl,
        });

        setProcessingMessage("Manual top-up submitted for verification.");
        setStep("success");
      } else {
        const provider = resolveInstantProvider(selectedMethod);
        const payload: CreateSplitDepositPayload = {
          totalAmount: numAmount,
          legs: [
            {
              amount: numAmount,
              legType: "instant",
              paymentMethod: selectedMethod.gateway_method ?? selectedMethod.code,
              paymentProvider: provider,
            },
          ],
          successUrl: buildReturnUrl("success"),
          cancelUrl: buildReturnUrl("cancelled"),
        };

        const response = provider === "maya"
          ? await authService.createMayaShipperSplitDeposit(payload)
          : await authService.createPaymongoShipperSplitDeposit(payload);

        if (!response.splitTransactionId) {
          throw new Error("Payment provider response is missing split transaction id.");
        }

        localStorage.setItem(SPLIT_STORAGE_KEY, response.splitTransactionId);
        setTrackedSplitTransactionId(response.splitTransactionId);

        if (!response.checkoutUrl) {
          throw new Error("Payment provider did not return a checkout URL for instant payment.");
        }

        window.location.href = response.checkoutUrl;
        return;
      }

      setPage(0);
      await queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
      await queryClient.invalidateQueries({ queryKey: ["credits-transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["credits-top-up-requests"] });
    } catch (error: unknown) {
      toast.error("Failed to submit top-up", {
        description: getErrorMessage(error, "Please try again."),
      });
    } finally {
      setIsTopUpBusy(false);
    }
  };

  const submitSplitTopUp = async () => {
    const validationError = validateSplitLegs();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsTopUpBusy(true);
    try {
      const preparedLegs = await Promise.all(
        splitLegs.map(async (leg) => {
          const method = methodMap.get(leg.methodCode);
          if (!method) {
            throw new Error("Invalid split leg payment method.");
          }

          if (leg.legType === "manual") {
            let proofUrl = leg.proofUrl?.trim() ?? "";
            if (!proofUrl) {
              if (!leg.proofFile) throw new Error("Manual split leg proof is required.");
              const upload = await authService.uploadProofOfPayment(leg.proofFile);
              proofUrl = upload.url;
            }

            return {
              amount: Number(leg.amount),
              legType: "manual" as const,
              paymentMethod: method.code,
              paymentProvider: undefined,
              userReferenceNumber: leg.userReferenceNumber?.trim(),
              proofUrl,
            };
          }

          return {
            amount: Number(leg.amount),
            legType: "instant" as const,
            paymentMethod: method.gateway_method ?? method.code,
            paymentProvider: resolveInstantProvider(method),
          };
        }),
      );

      const instantLeg = preparedLegs.find((leg) => leg.legType === "instant");
      const hasManualLeg = preparedLegs.some((leg) => leg.legType === "manual");

      const payload: CreateSplitDepositPayload = {
        totalAmount: Number(amount),
        legs: preparedLegs,
        successUrl: instantLeg ? buildReturnUrl("success") : undefined,
        cancelUrl: instantLeg ? buildReturnUrl("cancelled") : undefined,
      };

      const splitResponse = instantLeg?.paymentProvider === "maya"
        ? await authService.createMayaShipperSplitDeposit(payload)
        : await authService.createPaymongoShipperSplitDeposit(payload);

      if (!splitResponse.splitTransactionId) {
        throw new Error("Split payment response is missing transaction id.");
      }

      localStorage.setItem(SPLIT_STORAGE_KEY, splitResponse.splitTransactionId);
      setTrackedSplitTransactionId(splitResponse.splitTransactionId);

      await queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
      await queryClient.invalidateQueries({ queryKey: ["credits-transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["credits-top-up-requests"] });

      if (instantLeg && !splitResponse.checkoutUrl) {
        throw new Error("Instant split payment did not return a checkout URL.");
      }

      if (splitResponse.checkoutUrl && hasManualLeg) {
        setRedirectUrl(splitResponse.checkoutUrl);
        setProcessingCountdown(3);
        setProcessingMessage("Manual split legs submitted. Redirecting to instant payment...");
        setStep("processing");
        return;
      }

      if (splitResponse.checkoutUrl) {
        window.location.href = splitResponse.checkoutUrl;
        return;
      }

      setProcessingMessage("Split top-up submitted successfully.");
      setStep("success");
    } catch (error: unknown) {
      toast.error("Failed to create split top-up", {
        description: getErrorMessage(error, "Please review split details and try again."),
      });
    } finally {
      setIsTopUpBusy(false);
    }
  };

  const handleAmountContinue = () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method first.");
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }

    if (numAmount < selectedMethod.min_amount) {
      toast.error(`Minimum amount for ${selectedMethod.name} is ${formatCurrency(selectedMethod.min_amount)}.`);
      return;
    }

    if (numAmount > selectedMethod.max_amount) {
      toast.error(`Maximum amount for ${selectedMethod.name} is ${formatCurrency(selectedMethod.max_amount)}.`);
      return;
    }

    if (numAmount > selectedMethod.split_limit) {
      try {
        const proposal = buildSplitProposal(numAmount, selectedMethod.code, selectedMethod.split_limit);
        setSplitLegs(proposal);
        setStep("split_proposal");
      } catch (error) {
        toast.error(getErrorMessage(error, "Unable to generate split proposal."));
      }
      return;
    }

    setStep("review");
  };

  const totalPages = transactions ? Math.ceil(transactions.total / PAGE_SIZE) : 0;

  const { mounted: isTopUpModalMounted, overlayRef: topUpOverlayRef, panelRef: topUpPanelRef } = useGsapPresence(showTopUpModal);
  const txListRef = useGsapStagger<HTMLDivElement>([transactions?.data]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Credits</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your company credit balance</p>
        </div>
        <button
          onClick={openTopUpModal}
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
            onClick={openTopUpModal}
            className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            Top Up
          </button>
        </div>
      )}

      {trackedSplitStatus && (
        <div className="rounded-2xl border border-border/60 bg-card p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Latest Split Top-up</p>
              <p className="text-sm font-semibold mt-1">
                {trackedSplitStatus.reference_code} · {trackedSplitStatus.status.replaceAll("_", " ")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Paid {formatCurrency(Number(trackedSplitStatus.paid_amount))} of {formatCurrency(Number(trackedSplitStatus.total_amount))}
              </p>
            </div>
            <button
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
              onClick={() => {
                localStorage.removeItem(SPLIT_STORAGE_KEY);
                setTrackedSplitTransactionId(null);
              }}
            >
              Clear
            </button>
          </div>
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

      {/* Top Up Requests */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div>
            <h3 className="font-semibold leading-none tracking-tight text-foreground">Top Up Requests</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Track your submitted manual top-up requests and review status updates.
            </p>
          </div>
          <select
            value={topUpRequestStatusFilter}
            onChange={(event) => setTopUpRequestStatusFilter(event.target.value as typeof topUpRequestStatusFilter)}
            className="text-xs px-3 py-1.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
          >
            <option value="all">All Status</option>
            <option value="for_verification">For Verification</option>
            <option value="success">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {topUpRequestsLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading top-up requests...</div>
        ) : !topUpRequests?.length ? (
          <div className="flex flex-col items-center py-16 text-center px-6">
            <div className="size-14 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <IconWallet className="size-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No top-up requests yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your manual top-up submissions will appear here once created.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border/50">
                <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="text-left px-6 py-3 font-semibold">Reference</th>
                  <th className="text-left px-4 py-3 font-semibold">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold">Method</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Submitted</th>
                  <th className="text-right px-6 py-3 font-semibold">Proof</th>
                </tr>
              </thead>
              <tbody>
                {topUpRequests.map((request) => (
                  <tr key={request.id} className="border-b border-border/40 hover:bg-muted/20">
                    <td className="px-6 py-3 align-top">
                      <p className="font-semibold text-foreground">{request.deposit_reference}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ref #: {request.user_reference_number}
                      </p>
                      {request.split_reference_code && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Split: {request.split_reference_code}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-semibold tabular-nums text-foreground">
                      {formatCurrency(Number(request.amount))}
                    </td>
                    <td className="px-4 py-3 align-top text-muted-foreground">
                      {request.payment_method}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${topUpStatusClass(request.status)}`}>
                        {request.status.replaceAll("_", " ")}
                      </span>
                      {request.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1 max-w-[220px] break-words">
                          {request.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-6 py-3 align-top text-right">
                      {request.proof_url ? (
                        <button
                          type="button"
                          className="text-xs font-medium underline underline-offset-2 hover:opacity-70"
                          onClick={() => window.open(request.proof_url!, "_blank", "noopener,noreferrer")}
                        >
                          View proof
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

            <div
              ref={txListRef}
              className="divide-y divide-border/50"
            >
              {transactions.data.map((tx) => {
                const config = TYPE_CONFIG[tx.type] ?? { ...FALLBACK_CONFIG, label: tx.type };
                const TxIcon = config.icon;

                return (
                  <div
                    key={tx.id}
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
                        Bal: ₱{Number(tx.balance_after ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

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
      {isTopUpModalMounted && (
        <OverlayPortal>
        <div className="fixed inset-0 z-50 h-dvh">
          <div
            ref={topUpOverlayRef}
            className="absolute inset-0 h-dvh bg-black/60 backdrop-blur-sm"
            onClick={closeTopUpModal}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              ref={topUpPanelRef}
              className="relative bg-card rounded-2xl border border-border w-full max-w-2xl p-6 shadow-lg z-10 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={closeTopUpModal}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
              >
                <IconX className="size-4" />
              </button>

              <h2 className="text-xl font-semibold mb-1 tracking-tight">
                {step === "method" ? "Select payment method" : "Top Up Credits"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {step === "method" && "Choose your preferred payment rail for this credits top-up."}
                {step === "amount" && "Enter amount and review method limits."}
                {step === "review" && "Review your top-up details before confirming."}
                {step === "split_proposal" && "Amount exceeded split limit. Review the generated split proposal."}
                {step === "split_builder" && "Adjust split legs and provide manual references/proof details."}
                {step === "split_review" && "Confirm all split legs before submitting."}
                {step === "processing" && "Preparing your payment flow..."}
                {step === "success" && "Your top-up request has been submitted."}
              </p>

              {step === "method" && (
                <div className="mx-auto max-w-xl space-y-4">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(130deg,#f7fbff_0%,#eef4ff_45%,#f4fffd_100%)] p-4 shadow-[0_10px_40px_-20px_rgba(10,80,140,0.35)]">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-300/25 blur-2xl" />
                    <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-28 rounded-full bg-sky-300/20 blur-2xl" />
                    <p className="text-[0.67rem] uppercase tracking-[0.2em] text-slate-500">Secure Checkout</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">Select how you want to pay</p>
                    <p className="mt-1 text-xs text-slate-600">Instant methods redirect to gateway checkout. Manual methods are queued for verification.</p>
                  </div>

                  {availableMethods.map((method, index) => {
                    const isSelected = selectedMethodCode === method.code;
                    const visual = PAYMENT_METHOD_VISUALS[method.code] ?? DEFAULT_PAYMENT_VISUAL;
                    const isInstant = method.kind === "instant";

                    return (
                      <button
                        key={method.code}
                        type="button"
                        onClick={() => setSelectedMethodCode(method.code)}
                        className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-200 ${isSelected
                          ? "border-sky-500 bg-[linear-gradient(160deg,#ffffff_0%,#f4f9ff_65%,#edfffc_100%)] shadow-[0_12px_28px_-22px_rgba(0,105,200,0.9)]"
                          : "border-slate-200/90 bg-white hover:border-sky-300 hover:bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3.5">
                            <div className="h-11 w-16 rounded-lg border border-slate-200 bg-white/95 shadow-[inset_0_-8px_14px_rgba(10,40,80,0.04)] flex items-center justify-center px-2 shrink-0">
                              <Image
                                src={visual.src}
                                alt={visual.alt}
                                width={visual.width}
                                height={visual.height}
                                className="h-7 w-auto object-contain"
                              />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-[1.01rem] font-semibold text-slate-900">
                                Pay with {method.name}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.13em] ${isInstant
                                    ? "bg-cyan-100 text-cyan-800"
                                    : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {isInstant ? "Instant" : "Manual"}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                  Split up to {formatCurrency(method.split_limit)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div
                            className={`h-6 w-6 rounded-md border flex items-center justify-center shrink-0 transition-colors ${isSelected
                              ? "border-sky-500 bg-sky-500"
                              : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <IconCheck className="size-4 text-white" />}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                          <span>Min {formatCurrency(method.min_amount)}</span>
                          <span>Max {formatCurrency(method.max_amount)}</span>
                        </div>
                      </button>
                    );
                  })}

                  {!availableMethods.length && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-800 px-4 py-3 text-sm">
                      No deposit methods are currently enabled. Please contact support.
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={!selectedMethodCode}
                      onClick={() => setStep("amount")}
                      className="w-full rounded-xl bg-[linear-gradient(120deg,#005fde_0%,#00a8a8_100%)] px-4 py-2.5 text-base font-semibold text-white shadow-[0_16px_26px_-20px_rgba(0,95,222,0.9)] transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      onClick={closeTopUpModal}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              )}

              {step === "amount" && selectedMethod && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                    <p>Method: <span className="font-semibold text-foreground">{selectedMethod.name}</span></p>
                    <p className="mt-1">Split limit: <span className="font-semibold text-foreground">{formatCurrency(selectedMethod.split_limit)}</span></p>
                    <p className="mt-1">Minimum: <span className="font-semibold text-foreground">{formatCurrency(selectedMethod.min_amount)}</span> · Maximum: <span className="font-semibold text-foreground">{formatCurrency(selectedMethod.max_amount)}</span></p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Amount (₱)</label>
                    <input
                      type="number"
                      min={selectedMethod.min_amount}
                      max={selectedMethod.max_amount}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      autoFocus
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm tabular-nums placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                      disabled={isTopUpBusy}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[1000, 5000, 10000, 50000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(String(preset))}
                        disabled={isTopUpBusy}
                        className="px-2 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                      >
                        ₱{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("method")}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleAmountContinue}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {step === "review" && selectedMethod && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1">
                    <p className="text-sm"><span className="text-muted-foreground">Method:</span> <span className="font-semibold">{selectedMethod.name}</span></p>
                    <p className="text-sm"><span className="text-muted-foreground">Amount:</span> <span className="font-semibold">{formatCurrency(Number(amount || 0))}</span></p>
                    <p className="text-sm"><span className="text-muted-foreground">Type:</span> <span className="font-semibold">{selectedMethod.kind === "instant" ? "Instant" : "Manual verification"}</span></p>
                  </div>

                  {selectedMethod.kind === "manual" && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Reference Number</label>
                        <input
                          value={manualReference}
                          onChange={(event) => setManualReference(event.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                          placeholder="Enter bank/reference number"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Proof of Payment</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => setManualProofFile(event.target.files?.[0] ?? null)}
                          className="w-full text-sm"
                        />
                        <input
                          value={manualProofUrl}
                          onChange={(event) => setManualProofUrl(event.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                          placeholder="Or paste proof image URL"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("amount")}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                      disabled={isTopUpBusy}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={isTopUpBusy}
                      onClick={submitSingleMethodTopUp}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isTopUpBusy && <IconLoader2 className="size-4 animate-spin" />}
                      Submit Top-up
                    </button>
                  </div>
                </div>
              )}

              {step === "split_proposal" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                    <p className="font-semibold">Split Proposal Generated</p>
                    <p className="mt-1">
                      Amount exceeds split limit. We generated {splitLegs.length} leg{splitLegs.length > 1 ? "s" : ""}.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {splitLegs.map((leg, index) => (
                      <div key={leg.id} className="rounded-lg border border-border p-3 text-sm flex items-center justify-between">
                        <div>
                          <p className="font-medium">Leg {index + 1}</p>
                          <p className="text-xs text-muted-foreground">{leg.legType === "instant" ? "Instant" : "Manual"} · {(methodMap.get(leg.methodCode)?.name ?? leg.methodCode)}</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(Number(leg.amount || 0))}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("amount")}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep("split_builder")}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Accept and Adjust
                    </button>
                  </div>
                </div>
              )}

              {step === "split_builder" && (
                <div className="space-y-4">
                  {splitLegs.map((leg, index) => {
                    return (
                      <div key={leg.id} className="rounded-lg border border-border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm">Split Leg {index + 1}</p>
                          <button
                            type="button"
                            onClick={() => removeSplitLeg(leg.id)}
                            disabled={splitLegs.length <= 1}
                            className="text-xs px-2 py-1 rounded border border-border hover:bg-muted disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Amount</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={leg.amount}
                              onChange={(event) => updateSplitLeg(leg.id, { amount: event.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Method</label>
                            <select
                              value={leg.methodCode}
                              onChange={(event) =>
                                updateSplitLegMethod(leg.id, event.target.value as DepositMethodConfig["code"])
                              }
                              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                            >
                              {availableMethods.map((method) => (
                                <option key={method.code} value={method.code}>{method.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {leg.legType === "manual" && (
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Reference Number</label>
                              <input
                                value={leg.userReferenceNumber ?? ""}
                                onChange={(event) => updateSplitLeg(leg.id, { userReferenceNumber: event.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                placeholder="Enter reference number"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Proof</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => updateSplitLeg(leg.id, { proofFile: event.target.files?.[0] ?? null })}
                                className="w-full text-sm"
                              />
                              <input
                                value={leg.proofUrl ?? ""}
                                onChange={(event) => updateSplitLeg(leg.id, { proofUrl: event.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                placeholder="Or paste proof URL"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between text-sm rounded-lg border border-border p-3">
                    <span>Total split amount</span>
                    <span className="font-semibold">{formatCurrency(splitTotalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm rounded-lg border border-border p-3">
                    <span>Remaining</span>
                    <span className={`font-semibold ${splitRemainingAmount < 0 ? "text-red-600" : splitRemainingAmount === 0 ? "text-emerald-600" : "text-amber-600"}`}>
                      {formatCurrency(splitRemainingAmount)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={addSplitLeg}
                    disabled={splitLegs.length >= 5}
                    className="w-full px-3 py-2 rounded-lg border border-dashed border-border text-sm hover:bg-muted disabled:opacity-50"
                  >
                    Add Split Leg
                  </button>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("split_proposal")}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const validationError = validateSplitLegs();
                        if (validationError) {
                          toast.error(validationError);
                          return;
                        }
                        setStep("split_review");
                      }}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Review All Legs
                    </button>
                  </div>
                </div>
              )}

              {step === "split_review" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm">
                    <p>Total top-up: <span className="font-semibold">{formatCurrency(Number(amount || 0))}</span></p>
                    <p className="mt-1">Split legs: <span className="font-semibold">{splitLegs.length}</span></p>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-auto pr-1">
                    {splitLegs.map((leg, index) => (
                      <div key={leg.id} className="rounded-lg border border-border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">Leg {index + 1}</p>
                          <p className="font-semibold">{formatCurrency(Number(leg.amount || 0))}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(methodMap.get(leg.methodCode)?.name ?? leg.methodCode)} · {leg.legType === "instant" ? "Instant" : "Manual"}
                        </p>
                        {leg.legType === "manual" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Ref: {leg.userReferenceNumber || "(missing)"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("split_builder")}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors"
                      disabled={isTopUpBusy}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={submitSplitTopUp}
                      disabled={isTopUpBusy}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isTopUpBusy && <IconLoader2 className="size-4 animate-spin" />}
                      Submit Split Top-up
                    </button>
                  </div>
                </div>
              )}

              {step === "processing" && (
                <div className="text-center py-10 space-y-3">
                  <IconLoader2 className="size-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">{processingMessage}</p>
                  <p className="text-xs text-muted-foreground">Redirecting in {processingCountdown}s...</p>
                </div>
              )}

              {step === "success" && (
                <div className="text-center py-10 space-y-3">
                  <div className="size-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <IconCheck className="size-6" />
                  </div>
                  <p className="text-sm text-foreground">{processingMessage || "Top-up request submitted successfully."}</p>
                  <button
                    type="button"
                    className="mt-3 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted"
                    onClick={() => {
                      setShowTopUpModal(false);
                      resetTopUpModal();
                    }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        </OverlayPortal>
      )}
    </div>
  );
}
