import { useForm } from "react-hook-form";
import { Label } from "../label";
import { Globe } from "lucide-react";
import { FieldError, inputClass } from "../util";
import { FormValues } from "..";

export const StepCollaboration = ({
	register,
	errors,
}: {
	register: ReturnType<typeof useForm<FormValues>>['register'];
	errors: Record<string, any>;
}) => (
	<div className="space-y-5">
		<div>
			<Label>WebSocket Server URL</Label>
			<div className="relative">
				<Globe
					size={13}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
				/>
				<input
					{...register('ws_url')}
					autoCapitalize="none"
					autoCorrect="off"
					autoComplete="off"
					spellCheck={false}
					placeholder="wss://collab.yourserver.com"
					className={`${inputClass(!!errors.ws_url)} pl-8 font-mono`}
				/>
			</div>
			<FieldError message={errors.ws_url?.message} />
		</div>

		<div className="rounded-xl bg-white/2 border border-white/5 p-4 space-y-2">
			<p className="text-[11.5px] font-medium text-neutral-400">
				About real-time collaboration
			</p>
			<p className="text-[11px] text-neutral-600 leading-relaxed">
				This endpoint powers live collaborative editing via Yjs. Your
				server must run a compatible provider such as{' '}
				<span className="font-mono text-neutral-500">y-websocket</span>{' '}
				Leave blank to disable collaboration features.
			</p>
		</div>
	</div>
);