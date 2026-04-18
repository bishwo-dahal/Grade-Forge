import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

interface TimedSuccessModalProps {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  durationMs?: number;
}

export function TimedSuccessModal({
  open,
  title,
  description,
  onClose,
  durationMs = 1000,
}: TimedSuccessModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-4">
      <div className="w-full max-w-[360px] rounded-[18px] bg-white shadow-[0_30px_80px_rgba(17,24,39,0.22)]">
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#EAF8EE] text-[#1E7A3F]">
            <CheckCircle2 className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-semibold text-[#2B2A2A]">{title}</h3>
            <p className="mt-1 text-[13px] text-[#6B7280]">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close confirmation"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  tone?: "default" | "danger";
}

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy = false,
  tone = "default",
}: ConfirmationModalProps) {
  if (!open) {
    return null;
  }

  const confirmClassName =
    tone === "danger"
      ? "rounded-xl bg-red-600 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      : "rounded-xl bg-[#2B2A2A] px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-[#3a3939] disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-xl p-5">
        <h3 className="text-[16px] font-semibold text-[#2B2A2A]">{title}</h3>
        <p className="mt-2 text-[14px] text-gray-600">{description}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-medium text-[#2B2A2A] hover:bg-gray-50 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
