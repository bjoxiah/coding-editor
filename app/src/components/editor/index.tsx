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


export const EditorComponent = () => {
	const navigate = useNavigate();
	const [agentOpen, setAgentOpen] = useState(true);
	const [activityTabItem, setActivityTabItem] = useState('explorer');

	const {
		currentProject,
		activeFile,
		openTabs,
		openFile,
		closeTab,
		updateFileContent,
		saveActiveFile,
		loadFileTree,
	} = useAppStore();

	// redirect if no project
	useEffect(() => {
		if (!currentProject) {
			navigate('/');
			return;
		}
		loadFileTree();
	}, []);

	// keyboard shortcut: Cmd+S to save
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 's') {
				e.preventDefault();
				saveActiveFile();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [saveActiveFile]);

	if (!currentProject) return null;

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
						{/* Editor area */}
						<div className="flex-1 w-full h-full flex flex-col overflow-hidden">
							<TabBar
								tabs={openTabs}
								activeTab={activeFile?.path || ''}
								onSelectTab={(path) => openFile(path)}
								onCloseTab={closeTab}
							/>

							{activeFile ? (
								<CodeEditor
									language={inferLanguage(activeFile.path)}
									value={activeFile.content}
									filePath={activeFile.path}
									onChange={(v) =>
										updateFileContent(
											activeFile.path,
											v ?? '',
										)
									}
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
				activeFile={activeFile?.path}
				language={activeFile ? inferLanguage(activeFile.path) : undefined}
			/>
		</div>
	);
};
