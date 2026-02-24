import {
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenu,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { RenameInput } from '../rename-input';
import { FileTreeItemProps, getFileIcon } from '..';

export const FileItem = ({
	item,
	depth,
	activeFile,
	projectPath,
	onSelect,
	onDelete,
	onRefresh,
}: FileTreeItemProps & { depth: number }) => {
	const isActive = activeFile === item.path;
	const { icon: FileIcn, color } = getFileIcon(item.name, item.lang);
	const [renaming, setRenaming] = useState(false);

	const handleRenameDone = () => {
		setRenaming(false);
		onRefresh();
	};

	if (renaming) {
		return (
			<div
				className="flex items-center gap-2 py-0.75 px-2"
				style={{ paddingLeft: `${depth * 14 + 22}px` }}
			>
				<FileIcn size={14} className="shrink-0" style={{ color }} />
				<RenameInput
					currentName={item.name}
					projectPath={projectPath}
					oldPath={item.path}
					onDone={handleRenameDone}
				/>
			</div>
		);
	}

	return (
		<div
			role="button"
			onClick={() => onSelect(item.path)}
			className={`w-full cursor-pointer flex items-center gap-2 py-0.75 px-2 rounded-md transition-all duration-100 group
        ${isActive ? 'bg-white/[0.07] text-neutral-100' : 'text-neutral-500 hover:text-neutral-300 hover:bg-white/3'}`}
			style={{ paddingLeft: `${depth * 14 + 22}px` }}
		>
			<FileIcn size={14} className="shrink-0" style={{ color }} />
			<span className="flex-1 text-[12.5px] tracking-wide truncate">
				{item.name}
			</span>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						onClick={(e) => e.stopPropagation()}
						className="opacity-0 group-hover:opacity-100 focus:opacity-100 w-4 h-4 flex items-center justify-center rounded text-neutral-600 hover:text-neutral-400 hover:bg-white/10 transition-all shrink-0"
					>
						<MoreHorizontal size={11} />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-36 bg-[#1e1e24] border-white/10 text-neutral-300 shadow-xl shadow-black/40"
					onClick={(e) => e.stopPropagation()}
				>
					<DropdownMenuItem
						onClick={(e) => {
							e.stopPropagation();
							setRenaming(true);
						}}
						className="text-[11.5px] gap-2 cursor-pointer focus:bg-white/6 focus:text-neutral-100"
					>
						<Pencil size={11} className="text-neutral-500" />
						Rename
					</DropdownMenuItem>
					<DropdownMenuSeparator className="bg-white/6" />
					<DropdownMenuItem
						onClick={(e) => {
							e.stopPropagation();
							onDelete?.(item.path, 'file', item.name);
						}}
						className="text-[11.5px] gap-2 cursor-pointer text-red-400/80 focus:bg-red-500/10 focus:text-red-400"
					>
						<Trash2 size={11} className="text-red-500/60" />
						Delete File
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};
