import { Radio, Circle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { CollabStatus, useCollab } from '@/store/collab';
import { useAppStore } from '@/store';
import { useSettings } from '@/store/settings';
import { JoinRequestCard } from './request';
import { MemberRow } from './member';
import { WorkspaceCode } from './workspace';

interface CollabProps {
	workspaceCode: string;
	username: string;
	color: string;
}

const statusLabel: Record<CollabStatus, string> = {
	off: 'Collaboration off',
	connecting: 'Connecting...',
	incoming: 'Someone wants to join',
	pending: 'Waiting for owner...',
	active: 'Live — syncing',
	declined: 'Request was declined',
	not_found: 'Workspace not found',
	kicked: 'You were removed',
};

export const Collab = ({ workspaceCode, username, color }: CollabProps) => {
	const {
		status,
		requests,
		members,
		enable,
		disable,
		accept,
		decline,
		kick,
	} = useCollab();
	const { currentProject } = useAppStore();
	const { settings } = useSettings();

	const isEnabled = status !== 'off' && status !== 'kicked';
	const isLive = status === 'active';
	const isOwner = currentProject!.owner == settings!.username;
	// Disable the toggle while a connection transition is in progress
	const isConnecting = status === 'connecting' || status === 'pending';

	const handleToggle = () => {
		if (isConnecting) return;
		if (isEnabled) disable();
		else enable(workspaceCode, username, color);
	};

	const socketStatus = isLive
		? 'connected'
		: isConnecting
			? 'connecting...'
			: 'disconnected';

	return (
		<div className="w-full h-full flex flex-col bg-[#141416] border-r border-white/6 shrink-0 select-none">
			{/* ── Header ── */}
			<div className="h-9.5 flex items-center justify-between px-4 border-b border-white/4 shrink-0">
				<span className="text-[10.5px] font-semibold tracking-[0.12em] uppercase text-neutral-500">
					Collaborators
				</span>
				<div className="flex items-center gap-2.5">
					{isLive && (
						<span className="flex items-center gap-1 text-[9px] text-green-500 font-medium">
							<Wifi size={9} /> Live
						</span>
					)}
					{isConnecting && (
						<span className="flex items-center gap-1 text-[9px] text-amber-400 font-medium">
							<Loader2 size={9} className="animate-spin" />{' '}
							Connecting
						</span>
					)}
					{!isEnabled && !isConnecting && (
						<span className="flex items-center gap-1 text-[9px] text-neutral-600 font-medium">
							<WifiOff size={9} /> Offline
						</span>
					)}
					{/* Toggle — only shown for owner */}
					{isOwner && (
						<button
							onClick={handleToggle}
							disabled={isConnecting}
							className={`relative w-8 h-4 rounded-full transition-colors duration-200
								${isEnabled ? 'bg-blue-500' : 'bg-white/10'}
								${isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
							`}
						>
							<span
								className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${isEnabled ? 'left-4.5' : 'left-0.5'}`}
							/>
						</button>
					)}
				</div>
			</div>

			{/* ── Workspace code ── */}
			{isOwner && isEnabled && (
				<div className="px-4 pt-3 pb-2 border-b border-white/4">
					<p className="text-[9.5px] text-neutral-600">
						{statusLabel[status]}
					</p>
					<WorkspaceCode code={workspaceCode} />
				</div>
			)}

			{/* ── Body ── */}
			<div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
				{isLive && members.length > 0 && (
					<div className="space-y-1">
						<span className="text-[9.5px] tracking-widest uppercase text-neutral-600 font-medium flex items-center gap-1.5">
							<Circle
								size={5}
								className="fill-green-500 text-green-500"
							/>
							Online ({members.length})
						</span>
						<div className="divide-y divide-white/3">
							{members.map((m) => (
								<MemberRow
									key={m.clientId}
									member={m}
									isSelf={m.username === username}
									canKick={isOwner && m.username !== username}
									onKick={kick}
								/>
							))}
						</div>
					</div>
				)}

				{isOwner && requests.length > 0 && (
					<div className="space-y-2">
						<span className="text-[9.5px] tracking-widest uppercase text-neutral-600 font-medium flex items-center gap-1.5">
							<Radio size={9} className="text-amber-400" />
							Requests ({requests.length})
						</span>
						{requests.map((req) => (
							<JoinRequestCard
								key={req.requestId}
								requestId={req.requestId}
								username={req.username}
								onAccept={accept}
								onDecline={decline}
							/>
						))}
					</div>
				)}

				{isOwner &&
					isLive &&
					requests.length === 0 &&
					members.length <= 1 && (
						<div className="flex flex-col items-center py-6 text-center gap-1.5">
							<div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
							<p className="text-[11px] text-neutral-500">
								Session is live
							</p>
							<p className="text-[9.5px] text-neutral-600">
								Waiting for someone to knock
							</p>
						</div>
					)}

				{isOwner && status === 'off' && (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-[11px] text-neutral-500 leading-relaxed">
							Toggle the switch to share your workspace with
							others.
						</p>
					</div>
				)}

				{!isOwner &&
					(status === 'pending' || status === 'connecting') && (
						<div className="flex flex-col items-center py-6 gap-2">
							<Loader2
								size={16}
								className="text-neutral-600 animate-spin"
							/>
							<p className="text-[11px] text-neutral-500">
								{statusLabel[status]}
							</p>
						</div>
					)}
			</div>

			{/* ── Footer ── */}
			<div className="px-4 py-2 border-t border-white/4 shrink-0 flex items-center justify-between">
				<span className="text-[9px] text-neutral-700 font-mono">
					socket
				</span>
				<div className="flex items-center gap-1.5">
					<span
						className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500' : isConnecting ? 'bg-amber-400 animate-pulse' : 'bg-neutral-700'}`}
					/>
					<span className="text-[9px] text-neutral-600 font-mono">
						{socketStatus}
					</span>
				</div>
			</div>
		</div>
	);
};
