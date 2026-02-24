import { useState, useRef, useEffect } from "react";
import {
  X, Send, Square, 
  Loader2, Smartphone, 
  MessageCircleMore,
} from "lucide-react";
import { useAppStore } from "@/store";
import { groupLogs, LogGroupBlock } from "./group-log";
import { runAgent } from "@/service";

interface AgentPanelProps {
  onClose: () => void;
}

export const AgentPanel = ({ onClose }: AgentPanelProps) => {
  const [input, setInput] = useState("");
  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLInputElement>(null);

  const { currentProject, agentRunning } = useAppStore();
  const logs   = currentProject?.logs ?? [];
  const groups = groupLogs(logs);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, agentRunning]);

  const handleSend = () => {
    if (!input.trim() || agentRunning || !currentProject) return;
    const prompt = input.trim();
    setInput("");
    // TODO:: Editor Implementation
  };

  const handleRetry = async (operationType: 'scaffold' | 'preview' | 'edit') => {
    if (!currentProject) return;

    if (agentRunning) {
      return;
    }
    switch (operationType) {
      case 'scaffold':
        // retry scaffolding operation
        await runAgent({
          project_path: currentProject.path,
          prompt:      currentProject.prompt,
          app_name:    currentProject.name,
          brand_color: currentProject.brand_color ?? "",
          image_urls:  currentProject.inspiration_images ?? [],
        });
        break;
      case 'preview':
        // retry preview operation
        
        break;
      case 'edit':
        // retry edit operation
        // TODO:: edit implementation
        break;    
      default:
        break;
    }
  };

  const filesWritten = logs.filter((l) => l.type === "file_write").length;

  return (
    <div className="w-full h-full flex flex-col bg-[#141416] border-l border-white/6 shrink-0">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between h-9.5 px-4 border-b border-white/4 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${agentRunning ? "bg-neutral-400" : "bg-neutral-600"}`}
            style={agentRunning ? { animation: "pulse-dot 1.5s ease-in-out infinite" } : {}}
          />
          <span className="text-[10.5px] font-semibold tracking-[0.12em] uppercase text-neutral-500">Agent</span>
          {agentRunning && (
            <span className="text-[9px] text-neutral-600 font-mono animate-pulse">working…</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-700 px-1.5 py-0.5 rounded bg-white/3 border border-white/5">
            gemini-3.0-preview
          </span>
          <button onClick={onClose} className="w-5 h-5 cursor-pointer flex items-center justify-center rounded text-neutral-600 hover:text-neutral-400 hover:bg-white/6 transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Progress */}
      {agentRunning && (
        <div className="h-px bg-white/6 overflow-hidden">
          <div className="h-full bg-white/20 w-[40%]" style={{ animation: "shimmer 2s ease-in-out infinite" }} />
        </div>
      )}

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-3 pt-5 pb-2">
        {groups.length === 0 && !agentRunning && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-9 h-9 rounded-xl bg-white/4 flex items-center justify-center">
              <MessageCircleMore size={15} className="text-neutral-600" />
            </div>
            <div>
              <p className="text-[12px] text-neutral-500">Agent is ready</p>
              <p className="text-[11px] text-neutral-700 mt-0.5">Describe your app and the agent will build it</p>
            </div>
          </div>
        )}

        {groups.map((group, gi) => (
          <LogGroupBlock
            key={gi}
            group={group}
            isLast={gi === groups.length - 1}
            agentRunning={agentRunning}
            onRetry={() => handleRetry(group.action)}
          />
        ))}

        {agentRunning && (
          <div className="flex items-center gap-1.5 pl-8 pb-2" style={{ animation: "slideUp 0.2s ease-out both" }}>
            <Loader2 size={9} className="text-neutral-600 animate-spin" />
            <span className="text-[10px] text-neutral-700 font-mono">
              {filesWritten > 0 ? `${filesWritten} file${filesWritten !== 1 ? "s" : ""} written` : "thinking…"}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* QR */}
      {currentProject?.expoUrl && (
        <div className="px-3 py-3 border-t border-white/4">
          <div className="flex items-center gap-2.5 bg-white/3 rounded-xl p-3 border border-white/6">
            <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center shrink-0 p-1">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentProject.expoUrl)}`} alt="Expo QR" className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Smartphone size={11} className="text-neutral-500" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Preview Ready</span>
              </div>
              <p className="text-[10px] text-neutral-600 leading-relaxed">Scan with Expo Go</p>
              <p className="text-[9px] text-neutral-700 font-mono mt-1.5 truncate">{currentProject.expoUrl}</p>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 pb-3 pt-1">
        <div className="flex items-center gap-2 bg-white/4 border border-white/[0.07] rounded-xl px-3 py-2 focus-within:border-white/15 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask the agent to make changes..."
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent text-[12.5px] text-neutral-200 placeholder:text-neutral-700 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || agentRunning}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
              input.trim() && !agentRunning
                ? "bg-white/10 text-neutral-200 hover:bg-white/15"
                : "bg-white/3 text-neutral-700"
            }`}
          >
            {agentRunning ? <Square size={10} /> : <Send size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
};