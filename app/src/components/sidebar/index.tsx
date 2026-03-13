import { useSettings } from "@/store/settings";
import { Collab } from "./collab";
import { Explorer } from "./explorer";
import { useAppStore } from "@/store";

type SidebarProps = {
  activityTabItem?: string;
};

export const Sidebar = ({ activityTabItem }: SidebarProps) => {
  const {settings} = useSettings();
  const {currentProject} = useAppStore();
  return (
    <div className="w-full h-full flex flex-col bg-[#141416] border-r border-white/6 shrink-0">
      {activityTabItem === "explorer" && <Explorer />}
      {activityTabItem === "collab" && <Collab 
        workspaceCode={currentProject!.id.toUpperCase()}
        username={settings!.username}
        color="#909045"
      /> }
    </div>
  );
};