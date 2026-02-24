import { Collab } from "./collab";
import { Explorer } from "./explorer";

type SidebarProps = {
  activityTabItem?: string;
};

export const Sidebar = ({ activityTabItem }: SidebarProps) => {
  return (
    <div className="w-full h-full flex flex-col bg-[#141416] border-r border-white/6 shrink-0">
      {activityTabItem === "explorer" && <Explorer />}
      {activityTabItem === "collab" && <Collab /> }
    </div>
  );
};