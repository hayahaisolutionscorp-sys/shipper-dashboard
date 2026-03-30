"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { IconLoader2, IconArrowLeft } from "@tabler/icons-react";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      toast.success("Verification code sent", {
        description: "Check your email for the 6-character code.",
      });
      // Pass email via query param so the verify page can pre-fill it
      router.push(
        `/forgot-password/verify?email=${encodeURIComponent(email)}`
      );
    } catch (err: any) {
      toast.error("Request failed", {
        description:
          err.message || "Unable to send reset code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            Forgot password?
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a verification code
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full"
              >
                {isLoading ? (
                  <>
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  "Send verification code"
                )}
              </button>
            </form>
          </div>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <IconArrowLeft className="size-4" />
          Back to sign in
        </Link>

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Hayahai. All rights reserved.
        </p>
      </div>
    </div>
  );
}
