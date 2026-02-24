import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/store/settings';

import {
	User,
	Globe,
	Cloud,
	ChevronRight,
	ChevronLeft,
	ShieldCheck,
	Loader2,
	Check,
	AlertCircle,
} from 'lucide-react';
import { StepIdentity } from './indentity';
import { StepCollaboration } from './collaboration';
import { StepAWS } from './aws';

const schema = z
	.object({
		// Step 1 — required
		username: z
			.string()
			.min(2, 'At least 2 characters')
			.max(32, 'Max 32 characters')
			.regex(/^[a-zA-Z0-9_-]+$/, 'Letters, numbers, _ and - only'),

		api_url: z
			.string()
			.url('Must be a valid URL')
			.min(1, 'API server URL is required'),

		// Step 2 — optional
		ws_url: z
			.string()
			.refine((v) => v === '' || z.string().url().safeParse(v).success, {
				message: 'Must be a valid URL if provided',
			})
			.optional()
			.or(z.literal('')),

		// Step 3 — optional as a group, but if any aws field is filled, all are required
		aws_access_key_id: z.string().optional().or(z.literal('')),
		aws_secret_access_key: z.string().optional().or(z.literal('')),
		aws_region: z.string().optional().or(z.literal('')),
		aws_bucket: z.string().optional().or(z.literal('')),
	})
	.superRefine((data, ctx) => {
		const awsFields = [
			data.aws_access_key_id,
			data.aws_secret_access_key,
			data.aws_region,
			data.aws_bucket,
		];
		const anyFilled = awsFields.some((f) => f && f.trim() !== '');
		const allFilled = awsFields.every((f) => f && f.trim() !== '');

		if (anyFilled && !allFilled) {
			if (!data.aws_access_key_id?.trim())
				ctx.addIssue({
					path: ['aws_access_key_id'],
					code: 'custom',
					message: 'Required if configuring AWS',
				});
			if (!data.aws_secret_access_key?.trim())
				ctx.addIssue({
					path: ['aws_secret_access_key'],
					code: 'custom',
					message: 'Required if configuring AWS',
				});
			if (!data.aws_region?.trim())
				ctx.addIssue({
					path: ['aws_region'],
					code: 'custom',
					message: 'Required if configuring AWS',
				});
			if (!data.aws_bucket?.trim())
				ctx.addIssue({
					path: ['aws_bucket'],
					code: 'custom',
					message: 'Required if configuring AWS',
				});
		}
	});

export type FormValues = z.infer<typeof schema>;

const STEPS = [
	{ id: 0, label: 'Identity', icon: User, color: '#F59E0B' },
	{ id: 1, label: 'Collaboration', icon: Globe, color: '#0EA5E9' },
	{ id: 2, label: 'AWS Storage', icon: Cloud, color: '#8B5CF6' },
];

export const ConfigurationComponent = () => {
	const navigate = useNavigate();
	const [step, setStep] = useState(0);
	const [saving, setSaving] = useState(false);
	const [saveErr, setSaveErr] = useState('');
	const { save } = useSettings();

	const {
		register,
		handleSubmit,
		trigger,
		formState: { errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		mode: 'onTouched',
		defaultValues: {
			username: '',
			api_url: '',
			ws_url: '',
			aws_access_key_id: '',
			aws_secret_access_key: '',
			aws_region: '',
			aws_bucket: '',
		},
	});

	// Fields to validate per step before advancing
	const stepFields: (keyof FormValues)[][] = [
		['username', 'api_url'],
		['ws_url'],
		[
			'aws_access_key_id',
			'aws_secret_access_key',
			'aws_region',
			'aws_bucket',
		],
	];

	const handleNext = async () => {
		const valid = await trigger(stepFields[step]);
		if (valid) setStep((s) => s + 1);
	};

	const onSubmit = async (values: FormValues) => {
		try {
			setSaving(true);
			setSaveErr('');
			// Write to config.json
			await save({
				username: values.username,
				api_url: values.api_url,
				ws_url: values.ws_url ?? '',
				aws_access_key_id: values.aws_access_key_id ?? '',
				aws_secret_access_key: values.aws_secret_access_key ?? '',
				aws_region: values.aws_region ?? '',
				aws_bucket: values.aws_bucket ?? '',
			});

			navigate('/');
		} catch (err: any) {
			setSaveErr(err?.toString() ?? 'Failed to save settings');
			setSaving(false);
		}
	};

	const isLastStep = step === STEPS.length - 1;

	const handleSave = handleSubmit(onSubmit);

	return (
		<div className="w-full h-screen flex items-center justify-center bg-[#111113] overflow-hidden">
			{/* Subtle grid background */}
			<div
				className="absolute inset-0 pointer-events-none opacity-[0.025]"
				style={{
					backgroundImage:
						'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
					backgroundSize: '48px 48px',
				}}
			/>

			{/* Card */}
			<div className="relative w-full max-w-md mx-auto px-6">
				{/* Header */}
				<div className="mb-8 text-center">
					<div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 mb-4">
						<ShieldCheck size={18} className="text-amber-400" />
					</div>
					<h1 className="text-[22px] font-semibold text-neutral-100 tracking-tight">
						Configure your workspace
					</h1>
					<p className="text-[12.5px] text-neutral-600 mt-1.5">
						Set up once — credentials are encrypted on-device
					</p>
				</div>

				{/* Step indicator */}
				<div className="flex items-center gap-0 mb-8">
					{STEPS.map((s, i) => {
						const Icon = s.icon;
						const isDone = i < step;
						const isActive = i === step;

						return (
							<div
								key={s.id}
								className="flex items-center flex-1"
							>
								<div className="flex flex-col items-center gap-1.5 flex-1">
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
											isDone
												? 'bg-emerald-500/15 border-emerald-500/30'
												: isActive
													? 'bg-white/6 border-white/15'
													: 'bg-white/2 border-white/6'
										}`}
									>
										{isDone ? (
											<Check
												size={13}
												className="text-emerald-400"
											/>
										) : (
											<Icon
												size={13}
												style={{
													color: isActive
														? s.color
														: '#404040',
												}}
											/>
										)}
									</div>
									<span
										className={`text-[9.5px] font-medium tracking-wide transition-colors ${
											isActive
												? 'text-neutral-400'
												: isDone
													? 'text-emerald-500/70'
													: 'text-neutral-700'
										}`}
									>
										{s.label}
									</span>
								</div>

								{/* Connector */}
								{i < STEPS.length - 1 && (
									<div
										className={`h-px flex-1 mb-5 mx-1 transition-colors duration-500 ${
											i < step
												? 'bg-emerald-500/30'
												: 'bg-white/5'
										}`}
									/>
								)}
							</div>
						);
					})}
				</div>

				{/* Form  */}
				<form onSubmit={(e) => e.preventDefault()}>
					<div className="bg-white/2 border border-white/[0.07] rounded-2xl p-6 min-h-70 flex flex-col">
						{/* Step label */}
						<div className="flex items-center gap-2 mb-5">
							{(() => {
								const Icon = STEPS[step].icon;
								return (
									<Icon
										size={14}
										style={{ color: STEPS[step].color }}
									/>
								);
							})()}
							<h2 className="text-[13px] font-semibold text-neutral-300">
								{STEPS[step].label}
							</h2>
							{step === 0 && (
								<span className="ml-auto text-[10px] text-amber-400/60 bg-amber-400/8 border border-amber-400/15 px-2 py-0.5 rounded-full">
									Required
								</span>
							)}
							{step > 0 && (
								<span className="ml-auto text-[10px] text-neutral-700 border border-white/5 px-2 py-0.5 rounded-full">
									Optional
								</span>
							)}
						</div>

						{/* Step content */}
						<div className="flex-1">
							{step === 0 && (
								<StepIdentity
									register={register}
									errors={errors}
								/>
							)}
							{step === 1 && (
								<StepCollaboration
									register={register}
									errors={errors}
								/>
							)}
							{step === 2 && (
								<StepAWS register={register} errors={errors} />
							)}
						</div>
					</div>

					{/* Error */}
					{saveErr && (
						<p className="flex items-center gap-1.5 text-[11px] text-red-400 mt-3 px-1">
							<AlertCircle size={11} />
							{saveErr}
						</p>
					)}

					{/* Navigation */}
					<div className="flex items-center justify-between mt-5">
						{step > 0 ? (
							<button
								type="button"
								onClick={() => setStep((s) => s - 1)}
								className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all"
							>
								<ChevronLeft size={13} />
								Back
							</button>
						) : (
							<div />
						)}

						{isLastStep ? (
							<button
								type="button"
								onClick={handleSave}
								disabled={saving}
								className="flex items-center gap-2 px-5 py-2 rounded-lg text-[12.5px] font-medium bg-amber-400 text-neutral-900 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
							>
								{saving ? (
									<Loader2
										size={13}
										className="animate-spin"
									/>
								) : (
									<ShieldCheck size={13} />
								)}
								{saving ? 'Saving…' : 'Save & Continue'}
							</button>
						) : (
							<button
								type="button"
								onClick={handleNext}
								className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12.5px] font-medium bg-white/6 text-neutral-200 hover:bg-white/9 border border-white/8 transition-all"
							>
								Next
								<ChevronRight size={13} />
							</button>
						)}
					</div>

					{/* Skip hint on optional steps */}
					{step > 0 && !isLastStep && (
						<p className="text-center text-[10.5px] text-neutral-700 mt-3">
							You can skip optional steps and configure them later
							in Settings.
						</p>
					)}
				</form>
			</div>
		</div>
	);
};
