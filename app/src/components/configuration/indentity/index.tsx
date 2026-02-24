import { Server, User } from "lucide-react";
import { Label } from "../label";
import { useForm } from "react-hook-form";
import { FormValues } from "..";
import { FieldError, inputClass} from "../util";

export const StepIdentity = ({
	register,
	errors,
}: {
	register: ReturnType<typeof useForm<FormValues>>['register'];
	errors: Record<string, any>;
}) => (
	<div className="space-y-5">
		<div>
			<Label required>Username</Label>
			<div className="relative">
				<User
					size={13}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
				/>
				<input
					{...register('username')}
					placeholder="your-username"
					autoCapitalize="none"
					autoCorrect="off"
					autoComplete="off"
					spellCheck={false}
					className={`${inputClass(!!errors.username)} pl-8`}
				/>
			</div>
			<FieldError message={errors.username?.message} />
			<p className="text-[10.5px] text-neutral-700 mt-1.5 px-0.5">
				Shown in collaborative editing sessions. Letters, numbers, _ and
				- only.
			</p>
		</div>

		<div>
			<Label required>API Server URL</Label>
			<div className="relative">
				<Server
					size={13}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
				/>
				<input
					{...register('api_url')}
					autoCapitalize="none"
					autoCorrect="off"
					autoComplete="off"
					spellCheck={false}
					placeholder="https://api.yourserver.com"
					className={`${inputClass(!!errors.api_url)} pl-8 font-mono`}
				/>
			</div>
			<FieldError message={errors.api_url?.message} />
		</div>
	</div>
);