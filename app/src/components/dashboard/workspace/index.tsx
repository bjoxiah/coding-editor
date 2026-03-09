import { useCollab } from '@/store/collab';
import { useSettings } from '@/store/settings';
import { Users, X, Loader2, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PRESET_COLORS = [
	'#60a5fa',
	'#34d399',
	'#f59e0b',
	'#f472b6',
	'#a78bfa',
	'#fb923c',
];

const randomColor = () =>
	PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];

export const JoinWorkspace = ({ onClose }: { onClose: () => void }) => {
	const [code, setCode] = useState('');
	const [color, setColor] = useState(randomColor);
	const [error, setError] = useState('');
	const navigate = useNavigate();
	const { settings } = useSettings();

	const { status, knock } = useCollab();

	const isPending = status === 'connecting' || status === 'pending';

	const handleJoin = () => {
		const clean = code.replace(/-/g, '').trim().toUpperCase();
		if (clean.length < 9) {
			setError('Please enter a valid workspace code.');
			return;
		}
		setError('');
		knock(clean, settings!.username, color);
	};

	useEffect(() => {
		if (status === 'active') {
			navigate('/editor');
			onClose();
		}
	}, [status]);

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div className="w-full max-w-sm bg-[#18181b] border border-white/8 rounded-xl shadow-2xl p-6">
					{/* Header */}
					<div className="flex items-center justify-between mb-5">
						<div className="flex items-center gap-2.5">
							<div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
								<Users size={14} className="text-blue-400" />
							</div>
							<div>
								<h2 className="text-sm font-semibold text-neutral-100">
									Join Workspace
								</h2>
								<p className="text-[10px] text-neutral-600">
									Enter a workspace code to collaborate
								</p>
							</div>
						</div>
						<button
							onClick={onClose}
							className="w-6 h-6 cursor-pointer flex items-center justify-center rounded text-neutral-600 hover:text-neutral-400 hover:bg-white/6 transition-colors"
						>
							<X size={13} />
						</button>
					</div>

					<div className="space-y-4">
						{/* Workspace code */}
						<div className="space-y-2">
							<label className="text-[10px] tracking-widest uppercase text-neutral-600 font-medium">
								Workspace Code
							</label>
							<input
								autoFocus
								value={code}
								onChange={(e) => {
									setError('');
									setCode(e.target.value.toUpperCase());
								}}
								onKeyDown={(e) =>
									e.key === 'Enter' && handleJoin()
								}
								placeholder="ABC-DEF-GHI"
								maxLength={11}
								disabled={isPending}
								className="w-full px-3.5 py-2.5 rounded-lg bg-white/3 border border-white/6 focus:border-white/15 text-neutral-200 font-mono text-sm tracking-[0.18em] placeholder:text-neutral-700 outline-none transition-colors disabled:opacity-50"
							/>
						</div>

						{/* Cursor color */}
						<div className="space-y-2">
							<label className="text-[10px] tracking-widest uppercase text-neutral-600 font-medium">
								Cursor Color
							</label>
							<div className="flex items-center gap-2">
								{/* Color swatch presets */}
								{PRESET_COLORS.map((c) => (
									<button
										key={c}
										onClick={() => setColor(c)}
										disabled={isPending}
										className="w-6 h-6 cursor-pointer rounded-full border-2 transition-all hover:scale-110 disabled:opacity-50"
										style={{
											background: c,
											borderColor:
												color === c
													? 'white'
													: 'transparent',
										}}
									/>
								))}
								{/* Custom color picker */}
								<label
									className="ml-auto w-6 h-6 rounded-full border border-white/10 cursor-pointer overflow-hidden"
									style={{ background: color }}
									title="Custom color"
								>
									<input
										type="color"
										value={color}
										onChange={(e) =>
											setColor(e.target.value)
										}
										disabled={isPending}
										className="opacity-0 w-0 h-0"
									/>
								</label>
							</div>
						</div>

						{/* Status feedback */}
						{status === 'pending' && (
							<p className="text-[10px] text-blue-400 flex items-center gap-1.5">
								<Loader2 size={10} className="animate-spin" />
								Waiting for the owner to accept your request...
							</p>
						)}
						{status === 'declined' && (
							<p className="text-[10px] text-red-400">
								Request was declined by the owner.
							</p>
						)}
						{status === 'not_found' && (
							<p className="text-[10px] text-red-400">
								Workspace not found. Check the code and try
								again.
							</p>
						)}
						{error && (
							<p className="text-[10px] text-red-400">{error}</p>
						)}
					</div>

					{/* Actions */}
					<div className="flex gap-2 mt-5">
						<button
							onClick={onClose}
							className="flex-1 py-2 cursor-pointer rounded-lg text-sm text-neutral-500 hover:text-neutral-300 border border-white/6 hover:bg-white/3 transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleJoin}
							disabled={
								isPending || code.replace(/-/g, '').length < 9
							}
							className="flex-1 flex cursor-pointer items-center justify-center gap-2 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium border border-blue-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{isPending ? (
								<>
									<Loader2
										size={13}
										className="animate-spin"
									/>
									Joining...
								</>
							) : (
								<>
									<ArrowRight size={13} /> Join
								</>
							)}
						</button>
					</div>
				</div>
			</div>
		</>
	);
};
