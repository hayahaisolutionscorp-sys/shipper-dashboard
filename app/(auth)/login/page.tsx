"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  IconLoader2,
  IconEye,
  IconEyeOff,
  IconTruck,
  IconRoute,
  IconReceipt,
  IconWallet,
  IconArrowRight,
} from "@tabler/icons-react";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

const FEATURES = [
  { icon: IconTruck, label: "Multi-vehicle booking across routes" },
  { icon: IconRoute, label: "Multi-route booking across shipping lines" },
  { icon: IconReceipt, label: "Real-time booking tracking & history" },
  { icon: IconWallet, label: "Credits & flexible payment options" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    authService.verifySession().then((valid) => {
      if (valid) router.push("/");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.login({ email, password });
      toast.success("Welcome back!", {
        description: "You have successfully logged in.",
      });
      router.push("/");
    } catch (err: any) {
      console.error("Login failed", err);
      toast.error("Login failed", {
        description: err.message || "Please check your email and password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex selection:bg-primary/20">
      {/* ── Left brand panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col overflow-hidden shrink-0">
        {/* Photo background */}
        <Image
          src="/cebu-port.jpg"
          alt="Ferry boats docked at Cebu Port, Philippines"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlay — dark at top and bottom, lighter in middle */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image alt="Hayahai" src="/hayahai-v2.png" width={44} height={44} className="brightness-0 invert object-contain drop-shadow-md" />
            <div className="flex flex-col leading-none">
              <span className="text-white font-bold text-base tracking-tight">Shipper Portal</span>
              <span className="text-white/60 text-[11px] font-medium mt-0.5">by Hayahai</span>
            </div>
          </div>

          {/* Hero text */}
          <div className="mt-auto mb-10">
            <h2 className="text-4xl xl:text-[2.75rem] font-bold text-white leading-[1.18] tracking-tight">
              Manage your logistics<br />with confidence.
            </h2>
            <p className="text-white/75 text-base mt-4 leading-relaxed max-w-sm">
              Book vehicles, manage your team, and track shipments across all your assigned shipping lines.
            </p>

            {/* Feature list */}
            <div className="mt-8 space-y-3.5">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-white/15 border border-white/15 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-white" />
                  </div>
                  <span className="text-white/85 text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-end justify-between">
            <p className="text-white/40 text-xs">
              © {new Date().getFullYear()} Hayahai. All rights reserved.
            </p>
            <a
              href="https://www.pexels.com/photo/ferry-boats-docked-at-cebu-port-in-philippines-35994436/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white/70 text-[10px] transition-colors"
            >
              Photo by Arthur Uzoagba
            </a>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-10 sm:px-12">
        {/* Mobile logo (hidden on lg+) */}
        <div className="flex lg:hidden items-center gap-3 mb-10 self-start w-full max-w-sm mx-auto">
          <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/15">
            <Image alt="Ayahay" src="/hayahai-v2.png" width={36} height={36} className="object-contain" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-sm tracking-tight text-foreground">Shipper Portal</span>
            <span className="text-muted-foreground text-[11px] mt-0.5">by Hayahai</span>
          </div>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {/* Form header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              Enter your credentials to access your portal
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <IconEyeOff className="size-4" /> : <IconEye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 h-10 w-full rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:pointer-events-none disabled:opacity-50 shadow-sm"
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <IconArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground space-y-1">
            <p>
              Don&apos;t have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Registration is currently invite-only.");
                }}
                className="font-medium text-foreground hover:text-primary transition-colors"
              >
                Contact support
              </a>
            </p>
            <p className="lg:hidden">© {new Date().getFullYear()} Hayahai. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
