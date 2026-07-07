"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import { cn } from "@edss/utils/cn";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

const sheetVariants = cva(
  "fixed z-[var(--z-panel)] bg-[var(--color-paper)] shadow-[var(--shadow-lg)] transition-transform border-[var(--color-line)]",
  {
    variants: {
      side: {
        left: "inset-y-0 left-0 h-full w-80 border-r",
        right: "inset-y-0 right-0 h-full w-96 border-l",
      },
    },
    defaultVariants: { side: "right" },
  },
);

interface SheetContentProps
  extends
    ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

export const SheetContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side, className, children, ...props }, ref) => (
  <SheetPortal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/40" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), "p-6", className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 hover:opacity-100">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";
