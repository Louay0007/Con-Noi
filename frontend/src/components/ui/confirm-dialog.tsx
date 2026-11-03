import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Single confirmation surface for irreversible actions.
 *
 * Replaces `window.confirm()`, which is unstyled, blocked in some embeds, cannot
 * show a spinner while the request is in flight, and gives screen-reader users
 * no announcement of which item is about to be deleted.
 *
 * Radix handles the focus trap, Escape key and initial focus.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Conferma",
  cancelLabel = "Annulla",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next && !loading) onCancel(); }}>
      <AlertDialogContent className="max-w-md border-[#E5E7EB]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-[#1A1A1A]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-[#4B5563]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-[#F1F3F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C81] focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${
              destructive
                ? "bg-[#B91C1C] hover:bg-[#991B1B] focus-visible:ring-[#B91C1C]"
                : "bg-[#0F4C81] hover:bg-[#0a3d6b] focus-visible:ring-[#0F4C81]"
            }`}
          >
            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
