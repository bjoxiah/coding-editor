import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useAppStore } from '@/store';
import { ActivityBar } from '../activitybar';
import { AgentPanel } from '../agentpanel';
import { StatusBar } from '../statusbar';
import { TabBar } from '../tabbar';
import { TitleBar } from '../titlebar';
import { CodeEditor, inferLanguage } from './code-editor';
import { Sidebar } from '../sidebar';
import { useShallow } from 'zustand/react/shallow';
import { useCollab } from '@/store/collab';
import { getYdoc } from '@/store/collab/helpers/session';
import { observeFile } from '@/store/collab/helpers/observe';

export const EditorComponent = () => {
	const navigate = useNavigate();
	const [agentOpen, setAgentOpen] = useState(true);
	const [activityTabItem, setActivityTabItem] = useState('explorer');

	// Collab — primitives only
	const status = useCollab((s) => s.status);
	const provider = useCollab((s) => s.provider);
	const setActiveFile = useCollab((s) => s.setActiveFile);

	// App store — NO object selectors, only primitives
	const hasProject = useAppStore((s) => !!s.currentProject);
	const activeFilePath = useAppStore((s) => s.activeFile?.path);
	const activeFileContent = useAppStore((s) => s.activeFile?.content);
	const activeFileLanguage = useAppStore((s) =>
		s.activeFile ? inferLanguage(s.activeFile.path) : undefined,
	);
	const openTabs = useAppStore(useShallow((s) => s.openTabs));

	// Actions — stable references, safe to select directly
	const openFile = useAppStore((s) => s.openFile);
	const closeTab = useAppStore((s) => s.closeTab);
	const updateFileContent = useAppStore((s) => s.updateFileContent);
	const loadFileTree = useAppStore((s) => s.loadFileTree);

	const isCollabActive = status === 'active';
	const collabYdoc = isCollabActive ? getYdoc() : undefined;
	const collabAwareness = isCollabActive ? provider?.awareness : undefined;

	// Redirect if no project
	useEffect(() => {
		if (!hasProject) navigate('/');
	}, [hasProject]);

	// Load file tree when project is set
	useEffect(() => {
		if (hasProject) {
			loadFileTree();
		}
	}, [hasProject]);

	// Keep awareness in sync when active file changes during collab
	useEffect(() => {
		if (!isCollabActive) return;
		setActiveFile(activeFilePath ?? '');
		observeFile(activeFilePath ?? '');
	}, [activeFilePath, isCollabActive]);

	if (!hasProject) return null;

	return (
		<div
			className="w-full h-screen flex flex-col text-neutral-200 overflow-hidden"
			style={{
				fontFamily:
					"'DM Sans', 'SF Pro Display', -apple-system, sans-serif",
				background: '#111113',
			}}
		>
			<TitleBar />

			<div className="flex flex-1 overflow-hidden">
				<ActivityBar
					agentOpen={agentOpen}
					onToggleAgent={() => setAgentOpen((o) => !o)}
					activityTabItem={activityTabItem}
					setActivityTabItem={setActivityTabItem}
				/>

				<ResizablePanelGroup orientation="horizontal">
					<ResizablePanel defaultSize={'15%'}>
						<Sidebar activityTabItem={activityTabItem} />
					</ResizablePanel>

					<ResizablePanel defaultSize={agentOpen ? '60%' : '85%'}>
						<div className="flex-1 w-full h-full flex flex-col overflow-hidden">
							<TabBar
								tabs={openTabs}
								activeTab={activeFilePath || ''}
								onSelectTab={(path) => openFile(path)}
								onCloseTab={closeTab}
							/>

							{activeFilePath ? (
								<CodeEditor
									language={activeFileLanguage}
									value={
										isCollabActive
											? undefined
											: activeFileContent
									}
									filePath={activeFilePath}
									onChange={(v) =>
										updateFileContent(
											activeFilePath,
											v ?? '',
										)
									}
									ydoc={collabYdoc!}
									awareness={collabAwareness}
								/>
							) : (
								<div className="flex-1 flex items-center justify-center bg-[#19191d]">
									<p className="text-neutral-600 text-sm">
										Select a file to start editing
									</p>
								</div>
							)}
						</div>
					</ResizablePanel>

					{agentOpen && (
						<ResizablePanel defaultSize={'25%'}>
							<AgentPanel onClose={() => setAgentOpen(false)} />
						</ResizablePanel>
					)}
				</ResizablePanelGroup>
			</div>

			<StatusBar
				activeFile={activeFilePath}
				language={activeFileLanguage}
			/>
		</div>
	);
};