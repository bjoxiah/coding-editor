import { X } from "lucide-react";

interface TabBarProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onCloseTab: (tab: string) => void;
}

const getFileName = (path: string) => {
  return path.split("/").pop() || path;
}

export const TabBar = ({
  tabs,
  activeTab,
  onSelectTab,
  onCloseTab,
}: TabBarProps) => (
  <div className="h-9.5 flex items-end bg-[#111113] border-b border-white/6 pl-1 shrink-0 overflow-x-auto">
    {tabs.map((tab) => {
      const isActive = tab === activeTab;

      return (
        <div
          key={tab}
          className={`group relative flex items-center gap-1.5 h-8.5 px-3 text-[12px] tracking-wide cursor-pointer transition-colors rounded-t-lg shrink-0
            ${
              isActive
                ? "bg-[#19191d] text-neutral-200 border-t-[1.5px] border-amber-400/70"
                : "text-neutral-600 hover:text-neutral-400"
            }`}
        >
          <span onClick={() => onSelectTab(tab)} className="truncate max-w-35">
            {getFileName(tab)}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(tab);
            }}
            className={`w-5 h-5 flex items-center justify-center rounded-md transition-all cursor-pointer
              ${
                isActive
                  ? "text-neutral-500 hover:text-neutral-200 hover:bg-white/8"
                  : "text-neutral-700 opacity-0 group-hover:opacity-100 hover:text-neutral-400 hover:bg-white/8"
              }`}
          >
            <X size={12} />
          </button>

          {isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-px bg-[#19191d]" />
          )}
        </div>
      );
    })}
  </div>
);