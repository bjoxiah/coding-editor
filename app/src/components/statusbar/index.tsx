import {
  GitBranch,
} from "lucide-react";

interface StatusBarProps {
  activeFile?: string;
  language?: string;
}

export const StatusBar = ({ activeFile, language }: StatusBarProps) => {

  return (
    <div className="h-6 flex items-center justify-between px-3 bg-[#111113] border-t border-white/6 text-[10.5px] text-neutral-600 shrink-0">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <GitBranch size={11} />
          main
        </span>
        {language && <span>{language}</span>}
      </div>

      <div className="flex items-center gap-3">
        {activeFile && <span>UTF-8</span>}
      </div>
    </div>
  );
};