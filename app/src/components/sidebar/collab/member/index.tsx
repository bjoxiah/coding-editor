import { AwarenessMember } from '@/store/collab';
import { FilePen, UserMinus } from 'lucide-react';
type Props = {
	member: AwarenessMember;
	isSelf: boolean;
	canKick: boolean;
	onKick: (clientId: number) => void;
};

export const MemberRow = ({ member, isSelf, canKick, onKick }: Props) => {
	return (
		<div className="flex items-center gap-2.5 py-1.5 group">
			<div
				className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
				style={{
					backgroundColor: member.color + '22',
					border: `1.5px solid ${member.color}55`,
					color: member.color,
				}}
			>
				{member.username[0]?.toUpperCase()}
			</div>
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-1.5">
					<span className="text-[11px] text-neutral-300 font-medium truncate">
						{member.username}
					</span>
					{isSelf && (
						<span className="text-[8px] text-neutral-600 border border-white/10 rounded px-1 py-px shrink-0">
							you
						</span>
					)}
				</div>
				{member.activeFile && (
					<div className="flex items-center gap-1 mt-0.5">
						<FilePen
							size={8}
							className="text-neutral-700 shrink-0"
						/>
						<span className="text-[9px] text-neutral-600 font-mono truncate">
							{member.activeFile.split('/').pop()}
						</span>
					</div>
				)}
			</div>
			<span
				className="w-1.5 h-1.5 rounded-full shrink-0"
				style={{ backgroundColor: member.color }}
			/>
			{canKick && (
				<button
					onClick={() => onKick(member.clientId)}
					title="Remove from workspace"
					className="opacity-0 cursor-pointer group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-neutral-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
				>
					<UserMinus size={10} />
				</button>
			)}
		</div>
	);
};
