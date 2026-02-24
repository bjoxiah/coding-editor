import { Project, FileNode } from "@/models";
import { useAppStore } from "@/store";
import { invoke } from "@tauri-apps/api/core";
import { formatDistance } from "date-fns";
import { FolderOpen, Trash2, ChevronRight, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProjectCard = ({ project }: { project: Project }) => {
  const navigate = useNavigate();
  const { setCurrentProject, removeProject } = useAppStore();

  const handleOpen = async () => {
    try {
      const tree = await invoke<FileNode[]>("get_file_tree", {
        projectPath: project.path,
      });

      setCurrentProject({...project, tree});

      navigate("/editor");
    } catch (err) {
      console.error("Failed to open project:", err);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeProject(project.path, true);
  };

  return (
    <div
      onClick={handleOpen}
      className="group w-full text-left bg-white/3 border border-white/6 rounded-xl p-4 hover:bg-white/5 hover:border-white/1 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center shrink-0">
            <FolderOpen size={16} className="text-amber-400" />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">
              {project.name}
            </h3>
            <p className="text-[11px] text-neutral-600 mt-0.5 max-w-50 truncate">
              {project.path}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="w-7 h-7 flex items-center justify-center cursor-pointer rounded-lg text-neutral-700 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
          >
            <Trash2 size={13} />
          </button>
          <ChevronRight
            size={14}
            className="text-neutral-700 group-hover:text-neutral-400 transition-colors"
          />
        </div>
      </div>

      <p className="text-xs text-neutral-500 mt-3 line-clamp-2 leading-relaxed">
        {project.prompt}
      </p>

      <div className="flex items-center gap-1.5 mt-3">
        <Clock size={10} className="text-neutral-700" />
        <span className="text-[10px] text-neutral-700">
          {formatDistance(new Date(project.created_at), new Date(), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}