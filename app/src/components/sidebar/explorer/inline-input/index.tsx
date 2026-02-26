import { Check, X } from "lucide-react";

export interface InputState {
  visible: boolean;
  type: "file" | "folder";
  value: string;
  error: string;
}

export const RootInlineInput = ({
  input,
  onChange,
  onSubmit,
  onCancel,
}: {
  input: InputState;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) => {
  if (!input.visible) return null;
  return (
    <div className="px-2 pt-1 pb-1.5">
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-colors ${
        input.error ? "border-red-500/40 bg-red-500/5" : "border-sky-500/30 bg-sky-500/5"
      }`}>
        <input
          autoFocus
          value={input.value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
            if (e.key === "Escape") onCancel();
          }}
          placeholder={input.type === "file" ? "filename.tsx" : "folder-name"}
          className="flex-1 bg-transparent text-[11.5px] text-neutral-200 placeholder-neutral-600 outline-none min-w-0"
        />
        <button onClick={onSubmit} className="w-4 h-4 rounded flex items-center justify-center text-sky-400 hover:bg-sky-400/15 transition-colors shrink-0">
          <Check size={10} />
        </button>
        <button onClick={onCancel} className="w-4 h-4 rounded flex items-center justify-center text-neutral-600 hover:text-neutral-400 transition-colors shrink-0">
          <X size={10} />
        </button>
      </div>
      {input.error && <p className="text-[10px] text-red-400/80 mt-0.5 px-1">{input.error}</p>}
    </div>
  );
};