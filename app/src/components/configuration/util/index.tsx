import { AlertCircle } from 'lucide-react';

export const FieldError = ({ message }: { message?: string }) =>
	message ? (
		<p className="flex items-center gap-1 text-[10.5px] text-red-400/90 mt-1">
			<AlertCircle size={10} className="shrink-0" />
			{message}
		</p>
	) : null;

export const baseInput =
	'w-full bg-white/[0.04] border rounded-lg px-3 py-2 text-[12.5px] text-neutral-200 placeholder:text-neutral-700 outline-none transition-colors';

export const inputClass = (hasError?: boolean) =>
	`${baseInput} ${hasError ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/[0.07] focus:border-white/20'}`;

