import { X } from "lucide-react";

interface UnsavedCloseModalProps {
  fileName: string;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedCloseModal({ fileName, onDiscard, onCancel }: UnsavedCloseModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-[15px] font-semibold text-[#2B2A2A]">Unsaved changes</h2>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-4 h-4 text-gray-400" strokeWidth={2} />
          </button>
        </div>
        <div className="p-4 text-[13px] text-gray-600">
          <span className="font-medium text-[#2B2A2A]">{fileName}</span> has unsaved changes. Close anyway?
        </div>
        <div className="flex gap-2 p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-[#2B2A2A] rounded-lg text-[13px] font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[13px] font-medium"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
