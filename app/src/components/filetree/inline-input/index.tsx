import { invoke } from "@tauri-apps/api/core";
import { Check, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface InlineInputProps {
  type: "file" | "folder";
  depth: number;
  projectPath: string;
  parentPath: string;
  onDone: () => void;
}

export const InlineInput = ({ type, depth, projectPath, parentPath, onDone }: InlineInputProps) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const submit = async () => {
    const name = value.trim();
    if (!name) { setError("Name is required"); return; }
    if (/[\\:*?"<>|]/.test(name)) { setError("Invalid characters"); return; }

    const relativePath = `${parentPath}/${name}`;
    try {
      if (type === "file") {
        await invoke("write_file", { projectPath, filePath: relativePath, content: "" });
      } else {
        await invoke("create_directory", { projectPath, dirPath: relativePath });
      }
      onDone();
    } catch (err: any) {
      setError(err?.toString() ?? "Failed");
    }
  };

  return (
    <div style={{ paddingLeft: `${depth * 14 + 22}px` }} className="pr-2 py-0.5">
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${
        error ? "border-red-500/40 bg-red-500/5" : "border-sky-500/30 bg-sky-500/5"
      }`}>
        <input
          ref={ref}
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onDone();
          }}
          placeholder={type === "file" ? "filename.tsx" : "folder-name"}
          className="flex-1 bg-transparent text-[11.5px] text-neutral-200 placeholder-neutral-600 outline-none min-w-0"
        />
        <button onClick={submit} className="w-4 h-4 rounded flex items-center justify-center text-sky-400 hover:bg-sky-400/15 transition-colors shrink-0">
          <Check size={10} />
        </button>
        <button onClick={onDone} className="w-4 h-4 rounded flex items-center justify-center text-neutral-600 hover:text-neutral-400 transition-colors shrink-0">
          <X size={10} />
        </button>
      </div>
      {error && <p className="text-[10px] text-red-400/80 mt-0.5 px-1">{error}</p>}
    </div>
  );
};