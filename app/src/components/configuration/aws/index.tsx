import { useForm } from "react-hook-form";
import { FormValues } from "..";
import { useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Label } from "../label";
import { FieldError, inputClass } from "../util";

export const StepAWS = ({
	register,
	errors,
}: {
	register: ReturnType<typeof useForm<FormValues>>['register'];
	errors: Record<string, any>;
}) => {
	const [showSecret, setShowSecret] = useState(false);

	return (
		<div className="space-y-4">
			<div className="flex items-start gap-2.5 rounded-xl bg-violet-400/5 border border-violet-400/10 px-3.5 py-2.5">
				<ShieldCheck
					size={13}
					className="text-violet-400 mt-0.5 shrink-0"
				/>
				<p className="text-[11px] text-neutral-500 leading-relaxed">
					Credentials are encrypted and stored
					locally. They are never sent anywhere except directly to AWS
					S3. Leave all fields blank to skip.
				</p>
			</div>

			<div>
				<Label>Access Key ID</Label>
				<div className="relative">
					<KeyRound
						size={13}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
					/>
					<input
						{...register('aws_access_key_id')}
						autoCapitalize="none"
						autoCorrect="off"
						autoComplete="off"
						spellCheck={false}
						placeholder="AKIAIOSFODNN7EXAMPLE"
						className={`${inputClass(!!errors.aws_access_key_id)} pl-8 font-mono`}
					/>
				</div>
				<FieldError message={errors.aws_access_key_id?.message} />
			</div>

			<div>
				<Label>Secret Access Key</Label>
				<div className="relative">
					<KeyRound
						size={13}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
					/>
					<input
						{...register('aws_secret_access_key')}
						type={showSecret ? 'text' : 'password'}
						autoCapitalize="none"
						autoCorrect="off"
						autoComplete="off"
						spellCheck={false}
						placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCY..."
						className={`${inputClass(!!errors.aws_secret_access_key)} pl-8 pr-9 font-mono`}
					/>
					<button
						type="button"
						onClick={() => setShowSecret((s) => !s)}
						className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
					>
						{showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
					</button>
				</div>
				<FieldError message={errors.aws_secret_access_key?.message} />
			</div>

			<div className="grid grid-cols-2 gap-3">
				<div>
					<Label>Region</Label>
					<input
						{...register('aws_region')}
						placeholder="us-east-1"
						className={`${inputClass(!!errors.aws_region)} font-mono`}
					/>
					<FieldError message={errors.aws_region?.message} />
				</div>
				<div>
					<Label>Bucket Name</Label>
					<input
						{...register('aws_bucket')}
						autoCapitalize="none"
						autoCorrect="off"
						autoComplete="off"
						spellCheck={false}
						placeholder="my-app-bucket"
						className={`${inputClass(!!errors.aws_bucket)} font-mono`}
					/>
					<FieldError message={errors.aws_bucket?.message} />
				</div>
			</div>
		</div>
	);
};