import { useState } from 'react';
import { useAppStore } from '@/store';
import { Plus, FolderOpen, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProjectCard } from './project-card';
import { JoinWorkspace } from './workspace';

export const DashboardComponent = () => {
	const navigate = useNavigate();
	const { projects } = useAppStore();
	const [showJoin, setShowJoin] = useState(false);

	return (
		<div className="h-screen w-full bg-[#111113] flex flex-col">
			{/* Subtle grid background */}
			<div
				className="absolute inset-0 pointer-events-none opacity-[0.025]"
				style={{
					backgroundImage:
						'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
					backgroundSize: '48px 48px',
				}}
			/>

			{/* Header */}
			<div className="flex items-center justify-between px-8 py-6 border-b border-white/6">
				<div>
					<h1 className="text-xl font-semibold text-neutral-100 tracking-tight">
						Coding Editor
					</h1>
					<p className="text-xs text-neutral-600 mt-0.5">
						Your React Native projects
					</p>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					<button
						onClick={() => setShowJoin(true)}
						className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-white/4 border border-white/8 text-neutral-300 text-sm font-medium rounded-lg hover:bg-white/[0.07] hover:border-white/12 transition-all"
					>
						<Users size={14} />
						Join Workspace
					</button>
					<button
						onClick={() => navigate('/new')}
						className="flex items-center gap-2 cursor-pointer px-4 py-2 bg-amber-400 text-neutral-900 text-sm font-medium rounded-lg hover:bg-amber-300 transition-all"
					>
						<Plus size={14} />
						New Project
					</button>
				</div>
			</div>

			{/* Projects Grid */}
			<div className="flex-1 overflow-y-auto px-8 py-6">
				{projects.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full gap-4">
						<div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center">
							<FolderOpen
								size={24}
								className="text-neutral-700"
							/>
						</div>
						<div className="text-center">
							<p className="text-sm text-neutral-400">
								No projects yet
							</p>
							<p className="text-xs text-neutral-600 mt-1">
								Create your first React Native app to get
								started
							</p>
						</div>
						<div className="flex items-center gap-2 mt-2">
							<button
								onClick={() => setShowJoin(true)}
								className="flex items-center gap-2 px-4 cursor-pointer py-2 bg-white/5 border border-white/8 text-neutral-400 text-sm rounded-lg hover:bg-white/8 transition-all"
							>
								<Users size={14} />
								Join Workspace
							</button>
							<button
								onClick={() => navigate('/new')}
								className="flex items-center gap-2 px-4 cursor-pointer py-2 bg-white/5 border border-white/8 text-neutral-300 text-sm rounded-lg hover:bg-white/8 transition-all"
							>
								<Plus size={14} />
								New Project
							</button>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
						{projects.map((project) => (
							<ProjectCard key={project.id} project={project} />
						))}
					</div>
				)}
			</div>

			{/* Join modal */}
			{showJoin && <JoinWorkspace onClose={() => setShowJoin(false)} />}
		</div>
	);
};
