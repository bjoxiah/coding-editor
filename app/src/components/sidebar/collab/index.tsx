import { Plus } from "lucide-react";


export const Collab = () => {
  
  // TODO:: Collaboration implementation

  return (
  <div className="w-full h-full flex flex-col bg-[#141416] border-r border-white/6 shrink-0">
    <div className="h-9.5 flex items-center justify-between px-4 border-b border-white/4">
      <span className="text-[10.5px] font-semibold tracking-[0.12em] uppercase text-neutral-500">
        Collaborators
      </span>
      <button className="w-5 h-5 cursor-pointer flex items-center justify-center rounded text-neutral-600 hover:text-neutral-400 hover:bg-white/6 transition-colors">
       <Plus size={12} />
      </button>
    </div>

    <div className="px-4 py-3 border-t border-white/4">
      <div className="flex items-center gap-2">
        
        <div>
          
        </div>
      </div>
    </div>
  </div>
);
}