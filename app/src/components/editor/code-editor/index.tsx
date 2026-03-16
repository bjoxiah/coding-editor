import Editor, { type OnMount } from '@monaco-editor/react';
import { useRef, useEffect } from 'react';
import type * as MonacoType from 'monaco-editor';
import { AutoTypings, LocalStorageCache } from 'monaco-editor-auto-typings';
import { MonacoBinding } from 'y-monaco';
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';
import { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
  getWorker(_: unknown, label: string) {
    if (label === 'json') return new jsonWorker()
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
    if (label === 'typescript' || label === 'javascript') return new tsWorker()
    return new editorWorker()
  }
}

loader.config({ monaco })

interface CodeEditorProps {
	language?: string;
	value?: string;
	onChange?: (value: string | undefined) => void;
	filePath?: string;
	ydoc?: Y.Doc;
	awareness?: Awareness;
}

export const inferLanguage = (path?: string): string => {
	if (!path) return 'typescript';
	const ext = path.split('.').pop()?.toLowerCase();
	switch (ext) {
		case 'ts':
		case 'tsx':
			return 'typescript';
		case 'js':
		case 'jsx':
			return 'javascript';
		case 'json':
			return 'json';
		case 'css':
			return 'css';
		case 'html':
			return 'html';
		case 'yaml':
		case 'yml':
			return 'yaml';
		case 'md':
			return 'markdown';
		default:
			return 'plaintext';
	}
};

// Cursor styles

const applyCursorStyles = (awareness: Awareness) => {
	let css = '';
	awareness.getStates().forEach((state, clientId) => {
		const user = state?.user;
		if (!user) return;
		const color = user.color ?? '#60a5fa';
		const light = color + '33';
		const name = String(user.name ?? user.username ?? '?')
			.replace(/\\/g, '\\\\')
			.replace(/'/g, "\\'");
		css += `
      .yRemoteSelection-${clientId}{background:${light};border-radius:2px}
      .yRemoteSelectionHead-${clientId}{position:absolute;border-left:2px solid ${color};height:100%;box-sizing:border-box}
      .yRemoteSelectionHead-${clientId}::after{position:absolute;content:'${name}';top:-1.5em;left:-2px;background:${color};color:#fffccc;font-size:10px;font-family:'JetBrains Mono',monospace;font-weight:700;padding:1px 6px;border-radius:3px 3px 3px 0;white-space:nowrap;pointer-events:none;z-index:9999;line-height:1.6}
    `;
	});
	let el = document.getElementById(
		'yjs-cursor-styles',
	) as HTMLStyleElement | null;
	if (!el) {
		el = document.createElement('style');
		el.id = 'yjs-cursor-styles';
		document.head.appendChild(el);
	}
	el.textContent = css;
};

export const CodeEditor = ({
	language,
	value = '',
	onChange,
	filePath,
	ydoc,
	awareness,
}: CodeEditorProps) => {
	const editorRef = useRef<MonacoType.editor.IStandaloneCodeEditor | null>(
		null,
	);
	const monacoRef = useRef<typeof MonacoType | null>(null);
	const models = useRef<Record<string, MonacoType.editor.ITextModel>>({});
	const viewStates = useRef<
		Record<string, MonacoType.editor.ICodeEditorViewState | null>
	>({});
	const prevPathRef = useRef<string | undefined>(undefined);
	const bindingRef = useRef<MonacoBinding | null>(null);

	const ydocRef = useRef(ydoc);
	ydocRef.current = ydoc;
	const awarenessRef = useRef(awareness);
	awarenessRef.current = awareness;
	const filePathRef = useRef(filePath);
	filePathRef.current = filePath;
	const valueRef = useRef(value);
	valueRef.current = value;

	// cursor styles
	useEffect(() => {
		if (!awareness) {
			document.getElementById('yjs-cursor-styles')?.remove();
			return;
		}
		const listener = () => applyCursorStyles(awareness);
		applyCursorStyles(awareness);
		awareness.on('change', listener);
		return () => {
			awareness.off('change', listener);
		};
	}, [awareness]);

	const attachBinding = (
		editor: MonacoType.editor.IStandaloneCodeEditor,
		model: MonacoType.editor.ITextModel,
		path: string,
		doc: Y.Doc,
		aw: Awareness,
	) => {
		bindingRef.current?.destroy();
		bindingRef.current = null;

		const yText = doc.getText(`file:${path}`);

		if (model.getValueLength() > 0) {
			model.pushEditOperations(
				[],
				[{ range: model.getFullModelRange(), text: '' }],
				() => null,
			);
		}

		bindingRef.current = new MonacoBinding(
			yText,
			model,
			new Set([editor]),
			aw,
		);
	};

	// File switch + collab activation
	useEffect(() => {
		const editor = editorRef.current;
		const monaco = monacoRef.current;
		if (!editor || !monaco || !filePath) return;

		const prevPath = prevPathRef.current;
		const lang = language ?? inferLanguage(filePath);

		if (prevPath && prevPath !== filePath) {
			viewStates.current[prevPath] = editor.saveViewState();
		}

		// Destroy old binding whenever file or collab state changes
		bindingRef.current?.destroy();
		bindingRef.current = null;

		// Get or create model.
		const uri = monaco.Uri.parse(`file:///${filePath}`);
		let model =
			models.current[filePath] ?? monaco.editor.getModel(uri) ?? null;

		if (!model) {
			model = monaco.editor.createModel(
				ydoc ? '' : (value ?? ''),
				lang,
				uri,
			);
		} else {
			if (model.getLanguageId() !== lang)
				monaco.editor.setModelLanguage(model, lang);

			if (ydoc) {
				// Collab mode: clear the model so MonacoBinding is the sole
				// writer. Use applyEdits to avoid triggering an onChange event
				// that could race with the binding.
				const fullRange = model.getFullModelRange();
				if (model.getValueLength() > 0) {
					model.applyEdits([{ range: fullRange, text: '' }]);
				}
			} else {
				// Local mode: keep model in sync with prop value
				if (model.getValue() !== value) model.setValue(value ?? '');
			}
		}

		models.current[filePath] = model;
		editor.setModel(model);

		const saved = viewStates.current[filePath];
		if (saved) editor.restoreViewState(saved);
		else editor.setScrollTop(0);

		editor.focus();
		prevPathRef.current = filePath;

		if (ydoc && awareness)
			attachBinding(editor, model, filePath, ydoc, awareness);
	}, [filePath, language, ydoc, awareness]);

	// Local value sync
	useEffect(() => {
		if (!filePath || ydoc) return;
		const model = models.current[filePath];
		if (model && model.getValue() !== value) model.setValue(value ?? '');
	}, [value, filePath, ydoc]);

	// Cleanup
	useEffect(() => {
		return () => {
			bindingRef.current?.destroy();
			document.getElementById('yjs-cursor-styles')?.remove();
		};
	}, []);

	const handleMount: OnMount = (editor, monaco) => {
		editorRef.current = editor;
		monacoRef.current = monaco;
		prevPathRef.current = filePathRef.current;

		monaco.editor.defineTheme('nexus-dark', {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{ token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
				{ token: 'keyword', foreground: 'c586c0' },
				{ token: 'string', foreground: 'ce9178' },
				{ token: 'number', foreground: 'b5cea8' },
				{ token: 'type', foreground: '4ec9b0' },
				{ token: 'function', foreground: 'dcdcaa' },
				{ token: 'variable', foreground: '9cdcfe' },
			],
			colors: {
				'editor.background': '#19191d',
				'editor.foreground': '#d4d4d4',
				'editor.lineHighlightBackground': '#ffffff06',
				'editor.selectionBackground': '#f59e0b33',
				'editorCursor.foreground': '#f59e0b',
				'editorLineNumber.foreground': '#555555',
				'editorLineNumber.activeForeground': '#888888',
				'editor.selectionHighlightBackground': '#f59e0b1a',
				'editorIndentGuide.background': '#ffffff08',
				'editorIndentGuide.activeBackground': '#ffffff15',
			},
		});
		monaco.editor.setTheme('nexus-dark');

		const path = filePathRef.current;
		if (path) {
			const lang = language ?? inferLanguage(path);
			const uri = monaco.Uri.parse(`file:///${path}`);
			let model =
				models.current[path] ?? monaco.editor.getModel(uri) ?? null;

			const doc = ydocRef.current;
			const aw = awarenessRef.current;

			if (!model) {
				// In collab mode create empty — MonacoBinding populates from yText.
				// In local mode seed with the current file content.
				model = monaco.editor.createModel(
					doc && aw ? '' : (valueRef.current ?? ''),
					lang,
					uri,
				);
			}

			models.current[path] = model;
			editor.setModel(model);

			if (doc && aw) attachBinding(editor, model, path, doc, aw);
		}

		editor.setScrollTop(0);
		editor.focus();

		AutoTypings.create(editor, {
			monaco,
			sourceCache: new LocalStorageCache(),
			shareCache: true,
			preloadPackages: true,
			onlySpecifiedPackages: true,
		});
	};

	return (
		<div className="flex-1 overflow-hidden">
			<Editor
				height="100%"
				onChange={(val) => onChange?.(val)}
				onMount={handleMount}
				theme="nexus-dark"
				options={{
					fontSize: 13,
					lineHeight: 22,
					fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
					fontLigatures: true,
					minimap: { enabled: false },
					scrollBeyondLastLine: false,
					padding: { top: 12 },
					renderLineHighlight: 'gutter',
					smoothScrolling: true,
					cursorBlinking: 'smooth',
					cursorSmoothCaretAnimation: 'on',
					bracketPairColorization: { enabled: true },
					guides: { indentation: true, bracketPairs: true },
					overviewRulerLanes: 0,
					hideCursorInOverviewRuler: true,
					wordWrap: 'on',
					scrollbar: { vertical: 'hidden', horizontal: 'hidden' },
				}}
			/>
		</div>
	);
};
