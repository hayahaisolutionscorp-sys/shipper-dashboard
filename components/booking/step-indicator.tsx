"use client";

import { cn } from "@/lib/utils";
import { IconCheck } from "@tabler/icons-react";
import { BOOKING_STEPS, type BookingStep } from "@/types/booking";

interface StepIndicatorProps {
  currentStep: BookingStep;
  onStepClick?: (step: BookingStep) => void;
}

export function StepIndicator({ currentStep, onStepClick }: StepIndicatorProps) {
  const currentIndex = BOOKING_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-2">
      {BOOKING_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isClickable = isCompleted && !!onStepClick;

        return (
          <div key={step.key} className="flex items-center gap-2">
            {/* Step circle + label */}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.key)}
              className={cn(
                "flex items-center gap-2",
                isClickable && "cursor-pointer group",
                !isClickable && "cursor-default",
              )}
            >
              <div
                className={cn(
                  "size-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors border",
                  isCompleted
                    ? "bg-primary text-primary-foreground border-primary"
                    : isCurrent
                    ? "bg-foreground text-background border-foreground"
                    : "bg-muted text-muted-foreground border-border",
                  isClickable && "group-hover:ring-2 group-hover:ring-primary/30",
                )}
              >
                {isCompleted ? (
                  <IconCheck className="size-3.5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:inline",
                  isCurrent
                    ? "text-foreground"
                    : isCompleted
                    ? "text-primary"
                    : "text-muted-foreground",
                  isClickable && "group-hover:underline",
                )}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {index < BOOKING_STEPS.length - 1 && (
              <div
                className={cn(
                  "w-6 sm:w-10 h-px",
                  index < currentIndex
                    ? "bg-primary"
                    : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
