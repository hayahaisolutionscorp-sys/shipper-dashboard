"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { IconLoader2, IconArrowLeft } from "@tabler/icons-react";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { Suspense } from "react";

const CODE_LENGTH = 6;

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, [email, router]);

  const handleChange = (index: number, value: string) => {
    // Allow only alphanumeric
    const char = value.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    const next = [...code];
    next[index] = char;
    setCode(next);

    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, CODE_LENGTH);

    const next = [...code];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setCode(next);

    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length < CODE_LENGTH) {
      toast.error("Please enter the full 6-character code.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyResetCode(email, fullCode);
      toast.success("Code verified", {
        description: "You can now set a new password.",
      });
      router.push(
        `/forgot-password/reset?email=${encodeURIComponent(email)}`
      );
    } catch (err: any) {
      toast.error("Verification failed", {
        description: err.message || "Invalid or expired code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authService.forgotPassword(email);
      toast.success("New code sent", {
        description: "Check your email for a fresh verification code.",
      });
      setCode(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error("Resend failed", {
        description: err.message || "Unable to resend code. Please try again.",
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-[400px] flex flex-col gap-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Image
              alt="Ayahay"
              src="/hayahai-v2.png"
              width={44}
              height={44}
              className="shrink-0 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Enter verification code
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a 6-character code to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* OTP Input Grid */}
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {code.map((char, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="text"
                    maxLength={1}
                    value={char}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={isLoading}
                    className="h-12 w-10 rounded-md border border-input bg-background text-center text-lg font-semibold uppercase ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || code.join("").length < CODE_LENGTH}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full"
              >
                {isLoading ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify code"
                )}
              </button>
            </form>
          </div>

          <div className="bg-muted/50 p-6 text-center text-xs text-muted-foreground border-t border-border">
            Didn&apos;t receive a code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="font-medium text-primary hover:underline underline-offset-4 disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend code"}
            </button>
          </div>
        </div>

        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <IconArrowLeft className="size-4" />
          Use a different email
        </Link>

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Hayahai. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><IconLoader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
      <VerifyCodeContent />
    </Suspense>
  );
}
