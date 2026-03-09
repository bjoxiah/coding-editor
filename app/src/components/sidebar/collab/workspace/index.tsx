import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export const WorkspaceCode = ({ code }: { code: string }) => {
	const [copied, setCopied] = useState(false);
	const copy = () => {
		navigator.clipboard.writeText(formatted);
		setCopied(true);
		setTimeout(() => setCopied(false), 1800);
	};
	const formatted = code.match(/.{1,3}/g)?.join('-') ?? code;
	return (
		<div className="mt-3">
			<span className="text-[9.5px] tracking-widest uppercase text-neutral-600 font-medium">
				Workspace Code
			</span>
			<div
				onClick={copy}
				className="mt-1.5 flex items-center justify-between px-3 py-2 rounded-md bg-white/3 border border-white/6 hover:border-white/10 cursor-pointer group transition-all"
			>
				<span className="font-mono text-[11px] tracking-[0.18em] text-neutral-300">
					{formatted}
				</span>
				<span className="text-neutral-600 group-hover:text-neutral-400 transition-colors">
					{copied ? <Check size={11} /> : <Copy size={11} />}
				</span>
			</div>
			<p className="mt-1.5 text-[9px] text-neutral-600 leading-relaxed">
				Share this code so others can request access.
			</p>
		</div>
	);
};
