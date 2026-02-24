import { invoke } from "@tauri-apps/api/core";
import { Check, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface RenameInputProps {
  currentName: string;
  projectPath: string;
  oldPath: string;
  onDone: () => void;
}

export const RenameInput = ({ currentName, projectPath, oldPath, onDone }: RenameInputProps) => {
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    // Select name without extension for files
    const dotIndex = currentName.lastIndexOf(".");
    if (dotIndex > 0) {
      ref.current?.setSelectionRange(0, dotIndex);
    } else {
      ref.current?.select();
    }
  }, []);

  const submit = async () => {
    const name = value.trim();
    if (!name) { setError("Name is required"); return; }
    if (name === currentName) { onDone(); return; }
    if (/[\\:*?"<>|]/.test(name)) { setError("Invalid characters"); return; }

    // Build new path by replacing last segment
    const parts = oldPath.split("/");
    parts[parts.length - 1] = name;
    const newPath = parts.join("/");

    try {
      await invoke("rename_file", { projectPath, oldPath, newPath });
      onDone();
    } catch (err: any) {
      setError(err?.toString() ?? "Rename failed");
    }
  };

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded-md border ${
        error ? "border-red-500/40 bg-red-500/5" : "border-sky-500/30 bg-sky-500/5"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        ref={ref}
        value={value}
        onChange={(e) => { setValue(e.target.value); setError(""); }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") submit();
          if (e.key === "Escape") onDone();
        }}
        className="flex-1 bg-transparent text-[12px] text-neutral-200 outline-none min-w-0 py-0.5"
      />
      <button
        onClick={(e) => { e.stopPropagation(); submit(); }}
        className="w-4 h-4 rounded flex items-center justify-center text-sky-400 hover:bg-sky-400/15 transition-colors shrink-0"
      >
        <Check size={10} />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDone(); }}
        className="w-4 h-4 rounded flex items-center justify-center text-neutral-600 hover:text-neutral-400 transition-colors shrink-0"
      >
        <X size={10} />
      </button>
      {error && (
        <span className="text-[10px] text-red-400/80 whitespace-nowrap">{error}</span>
      )}
    </div>
  );
};