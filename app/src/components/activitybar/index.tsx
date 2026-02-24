import { ArrowRightSquareIcon, BubblesIcon, File, Settings } from "lucide-react";
import { SettingsModal } from "../settings";
import { useState } from "react";

interface ActivityBarProps {
  onToggleAgent: () => void;
  agentOpen: boolean;
  activityTabItem?: string;
  setActivityTabItem?: (name: string) => void;
}

const navItems = [
  { icon: <File size={18} />, label: "Explorer", name: "explorer" },
  { icon: <BubblesIcon size={18} />, label: "Collab", name: "collab" },
];

export const ActivityBar = ({ onToggleAgent, agentOpen, setActivityTabItem, activityTabItem }: ActivityBarProps) => {
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  return (
    <div className="w-11.5 h-full flex flex-col items-center pt-2 pb-3 bg-[#111113] border-r border-white/6">
      {navItems.map((item, i) => (
        <button
          key={i}
          onClick={() => setActivityTabItem && setActivityTabItem(item.name)}
          title={item.label}
          className={`w-9 h-9 flex items-center justify-center rounded-lg mb-0.5 transition-all duration-150 cursor-pointer 
            ${
              activityTabItem === item.name
                ? "text-amber-400 bg-amber-400/8"
                : "text-neutral-600 hover:text-neutral-400 hover:bg-white/4"
            }`}
        >
         {item.icon}
        </button>
      ))}

      <div className="flex-1" />

      <button
        onClick={onToggleAgent}
        title="AI Agent"
        className={`w-9 h-9 flex items-center justify-center rounded-lg mb-0.5 transition-all duration-150 cursor-pointer
          ${
            agentOpen
              ? "text-amber-400 bg-amber-400/8"
              : "text-neutral-600 hover:text-neutral-400 hover:bg-white/4"
          }`}
      >
        <ArrowRightSquareIcon size={18} />
      </button>
          
      <button onClick={() => { setSettingsOpen(!settingsOpen)}} className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-600 hover:text-neutral-400 hover:bg-white/4 transition-all cursor-pointer">
        <Settings size={18} />
      </button>

      {/* Settings modal — opens to profile tab */}
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialTab="profile"
      />
    </div>
  );
};