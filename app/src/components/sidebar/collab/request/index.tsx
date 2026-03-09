import { UserCheck, UserX } from 'lucide-react';

type Props = {
    username: string;
    requestId: string;
    onAccept: (requestId: string) => void;
    onDecline: (requestId: string) => void;
};

export const JoinRequestCard = ({
	username,
	requestId,
	onAccept,
	onDecline,
}: Props) => (
	<div className="rounded-md bg-blue-500/6 border border-blue-500/20 p-2.5 space-y-2">
		<div className="flex items-center gap-2">
			<div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-semibold text-blue-400">
				{username[0].toUpperCase()}
			</div>
			<div>
				<p className="text-[11px] text-neutral-200 font-medium">
					{username}
				</p>
				<p className="text-[9.5px] text-neutral-500">wants to join</p>
			</div>
		</div>
		<div className="flex gap-1.5">
			<button
				onClick={() => onAccept(requestId)}
				className="flex-1 flex items-center cursor-pointer justify-center gap-1.5 py-1.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-[10px] font-medium transition-colors border border-blue-500/20"
			>
				<UserCheck size={10} /> Accept
			</button>
			<button
				onClick={() => onDecline(requestId)}
				className="flex-1 flex items-center cursor-pointer justify-center gap-1.5 py-1.5 rounded bg-white/3 hover:bg-white/6 text-neutral-500 hover:text-neutral-400 text-[10px] font-medium transition-colors border border-white/6"
			>
				<UserX size={10} /> Decline
			</button>
		</div>
	</div>
);
