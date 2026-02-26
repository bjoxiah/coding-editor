import { AlertTriangle } from "lucide-react";

export interface DialogState {
  open: boolean;
  targetPath: string;
  targetName: string;
  targetType: "file" | "folder" | null;
}

export const ConfirmDialog = ({
  dialog,
  onConfirm,
  onCancel,
}: {
  dialog: DialogState;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!dialog.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-85 rounded-xl bg-[#1a1a1f] border border-white/10 shadow-2xl shadow-black/60 overflow-hidden">
        <div className="h-0.5 w-full bg-linear-to-r from-red-500/0 via-red-500/80 to-red-500/0" />
        <div className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle size={16} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-neutral-100">
                Delete {dialog.targetType === "folder" ? "Folder" : "File"}
              </h3>
              <p className="text-[11.5px] text-neutral-500 mt-0.5 leading-relaxed">
                {dialog.targetType === "folder"
                  ? "This will permanently delete the folder and all its contents."
                  : "This file will be permanently removed from disk."}
              </p>
            </div>
          </div>
          <div className="mb-4 px-3 py-1.5 rounded-md bg-white/4 border border-white/6">
            <span className="text-[11px] font-mono text-neutral-300 break-all">
              {dialog.targetName}
            </span>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium text-neutral-400 hover:text-neutral-200 hover:bg-white/6 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-3.5 py-1.5 rounded-lg text-[11.5px] font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};