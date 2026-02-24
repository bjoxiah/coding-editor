import { Pipette } from "lucide-react";
import { useState, useRef } from "react";

const COLOR_PRESETS = [
  { label: "Amber",    value: "#F59E0B" },
  { label: "Sky",      value: "#0EA5E9" },
  { label: "Violet",   value: "#8B5CF6" },
  { label: "Rose",     value: "#F43F5E" },
  { label: "Emerald",  value: "#10B981" },
  { label: "Orange",   value: "#F97316" },
  { label: "Cyan",     value: "#06B6D4" },
  { label: "Pink",     value: "#EC4899" },
  { label: "Lime",     value: "#84CC16" },
  { label: "Slate",    value: "#64748B" },
];

export const ColorPicker = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) => {
  const [hexInput, setHexInput] = useState(value);
  const nativeRef = useRef<HTMLInputElement>(null);

  const commitHex = (raw: string) => {
    const cleaned = raw.startsWith("#") ? raw : `#${raw}`;
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) {
      onChange(cleaned);
      setHexInput(cleaned);
    }
  };

  return (
    <div className="space-y-3">
      {/* Swatches */}
      <div className="flex flex-wrap gap-2">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c.value}
            title={c.label}
            onClick={() => { onChange(c.value); setHexInput(c.value); }}
            className="relative w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none cursor-pointer"
            style={{ backgroundColor: c.value }}
          >
            {value === c.value && (
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white/80 shadow-sm" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Hex + native picker */}
      <div className="flex items-center gap-2">
        {/* Color swatch preview — opens native picker */}
        <button
          onClick={() => nativeRef.current?.click()}
          className="w-8 h-8 rounded-lg border border-white/10 shrink-0 transition-transform hover:scale-105 cursor-pointer"
          style={{ backgroundColor: value }}
          title="Custom color"
        >
          <input
            ref={nativeRef}
            type="color"
            value={value}
            onChange={(e) => { onChange(e.target.value); setHexInput(e.target.value); }}
            className="sr-only"
          />
        </button>

        <Pipette size={12} className="text-neutral-600 shrink-0" />

        <input
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commitHex(hexInput); }}
          maxLength={7}
          placeholder="#F59E0B"
          className="flex-1 bg-white/4 border border-white/[0.07] rounded-lg px-3 py-1.5 text-[12px] font-mono text-neutral-300 placeholder:text-neutral-600 outline-none focus:border-white/20 transition-colors"
        />

        {/* Live preview pill */}
        <div
          className="h-7 px-2.5 rounded-lg flex items-center text-[11px] font-semibold shrink-0"
          style={{ backgroundColor: `${value}20`, color: value, border: `1px solid ${value}40` }}
        >
          Brand
        </div>
      </div>
    </div>
  );
};
