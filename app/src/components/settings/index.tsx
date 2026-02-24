import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	User,
	Server,
	Globe,
	Cloud,
	KeyRound,
	Eye,
	EyeOff,
	ShieldCheck,
	Loader2,
	Check,
	AlertCircle,
	Settings,
} from 'lucide-react';
import { useSettings } from '@/store/settings';

const schema = z
	.object({
		username: z
			.string()
			.min(2, 'At least 2 characters')
			.max(32)
			.regex(/^[a-zA-Z0-9_-]+$/, 'Letters, numbers, _ and - only'),
		api_url: z.string().url('Must be a valid URL'),
		ws_url: z
			.string()
			.refine((v) => v === '' || z.string().url().safeParse(v).success, {
				message: 'Must be a valid URL if provided',
			})
			.optional()
			.or(z.literal('')),
		aws_access_key_id: z.string().optional().or(z.literal('')),
		aws_secret_access_key: z.string().optional().or(z.literal('')),
		aws_region: z.string().optional().or(z.literal('')),
		aws_bucket: z.string().optional().or(z.literal('')),
	})
	.superRefine((data, ctx) => {
		const aws = [
			data.aws_access_key_id,
			data.aws_secret_access_key,
			data.aws_region,
			data.aws_bucket,
		];
		const anyFilled = aws.some((f) => f?.trim());
		const allFilled = aws.every((f) => f?.trim());
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

type FormValues = z.infer<typeof schema>;

const FieldError = ({ message }: { message?: string }) =>
	message ? (
		<p className="flex items-center gap-1 text-[10.5px] text-red-400/90 mt-1.5">
			<AlertCircle size={10} className="shrink-0" /> {message}
		</p>
	) : null;

const Label = ({ children }: { children: React.ReactNode }) => (
	<label className="text-[10.5px] font-medium text-neutral-500 uppercase tracking-widest mb-1.5 block">
		{children}
	</label>
);

const baseInput =
	'w-full bg-white/[0.04] border rounded-lg px-3 py-2 text-[12.5px] text-neutral-200 placeholder:text-neutral-700 outline-none transition-colors';
const inputCls = (err?: boolean) =>
	`${baseInput} ${err ? 'border-red-500/40 focus:border-red-500/60' : 'border-white/[0.07] focus:border-white/20'}`;

const SecretInput = ({
	value,
	onChange,
	placeholder,
	hasError,
}: {
	value: string;
	onChange: (v: string) => void;
	placeholder?: string;
	hasError?: boolean;
}) => {
	const [show, setShow] = useState(false);
	return (
		<div className="relative">
			<input
				type={show ? 'text' : 'password'}
				value={value}
				autoCapitalize="none"
				autoCorrect="off"
				autoComplete="off"
				spellCheck={false}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={`${inputCls(hasError)} pr-9 font-mono`}
			/>
			<button
				type="button"
				onClick={() => setShow((s) => !s)}
				className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
			>
				{show ? <EyeOff size={13} /> : <Eye size={13} />}
			</button>
		</div>
	);
};

// Section tabs 

type Tab = 'profile' | 'server' | 'aws';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
	{ id: 'profile', label: 'Profile', icon: User },
	{ id: 'server', label: 'Servers', icon: Server },
	{ id: 'aws', label: 'AWS', icon: Cloud },
];

interface SettingsModalProps {
	open: boolean;
	onOpenChange: (v: boolean) => void;
	initialTab?: Tab;
}

export const SettingsModal = ({
	open,
	onOpenChange,
	initialTab = 'profile',
}: SettingsModalProps) => {
	const { settings, save, saving, load, loading } = useSettings();
	const [tab, setTab] = useState<Tab>(initialTab);
	const [saved, setSaved] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
		setValue,
		watch,
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
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

	// Load current settings into the form when modal opens
	useEffect(() => {
		if (open) {
			setTab(initialTab);
			load().then(() => {
				if (settings)
					reset({
						username: settings.username,
						api_url: settings.api_url,
						ws_url: settings.ws_url,
						aws_access_key_id: settings.aws_access_key_id,
						aws_secret_access_key: settings.aws_secret_access_key,
						aws_region: settings.aws_region,
						aws_bucket: settings.aws_bucket,
					});
			});
		}
	}, [open]);

	const onSubmit = async (values: FormValues) => {
		await save({
			username: values.username,
			api_url: values.api_url,
			ws_url: values.ws_url ?? '',
			aws_access_key_id: values.aws_access_key_id ?? '',
			aws_secret_access_key: values.aws_secret_access_key ?? '',
			aws_region: values.aws_region ?? '',
			aws_bucket: values.aws_bucket ?? '',
		});
		setSaved(true);
		setTimeout(() => {
			setSaved(false);
			onOpenChange(false);
		}, 1200);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="bg-[#141416] border-white/10 p-0 gap-0 max-w-lg overflow-hidden shadow-2xl shadow-black/60">
				{/* Header */}
				<DialogHeader className="px-5 pt-5 pb-4 border-b border-white/6">
					<DialogTitle className="flex items-center gap-2 text-[13.5px] font-semibold text-neutral-200">
						<Settings size={14} className="text-amber-400" />
						Settings
					</DialogTitle>
				</DialogHeader>

				{/* Tab bar */}
				<div className="flex border-b border-white/6 px-5">
					{TABS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type="button"
							onClick={() => setTab(id)}
							className={`flex items-center cursor-pointer gap-1.5 px-3 py-2.5 text-[11.5px] font-medium border-b-2 -mb-px transition-colors ${
								tab === id
									? 'border-amber-400 text-amber-400'
									: 'border-transparent text-neutral-600 hover:text-neutral-400'
							}`}
						>
							<Icon size={12} />
							{label}
						</button>
					))}
				</div>

				{/* Form */}
				<form onSubmit={(e) => e.preventDefault()}>
					<div className="px-5 py-5 space-y-4 min-h-65">
						{/* ── Profile ── */}
						{tab === 'profile' && (
							<>
								<div>
									<Label>
										Username{' '}
										<span className="text-amber-400/70 normal-case tracking-normal">
											*
										</span>
									</Label>
									<div className="relative">
										<User
											size={13}
											className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none"
										/>
										<input
											{...register('username')}
											autoCapitalize="none"
											autoCorrect="off"
											autoComplete="off"
											spellCheck={false}
											placeholder="your-username"
											className={`${inputCls(!!errors.username)} pl-8`}
										/>
									</div>
									<FieldError
										message={errors.username?.message}
									/>
								</div>
							</>
						)}

						{/* ── Servers ── */}
						{tab === 'server' && (
							<>
								<div>
									<Label>
										API Server URL{' '}
										<span className="text-amber-400/70 normal-case tracking-normal">
											*
										</span>
									</Label>
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
											className={`${inputCls(!!errors.api_url)} pl-8 font-mono`}
										/>
									</div>
									<FieldError
										message={errors.api_url?.message}
									/>
								</div>
								<div>
									<Label>
										WebSocket URL{' '}
										<span className="text-neutral-700 normal-case tracking-normal font-normal">
											optional
										</span>
									</Label>
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
											className={`${inputCls(!!errors.ws_url)} pl-8 font-mono`}
										/>
									</div>
									<FieldError
										message={errors.ws_url?.message}
									/>
								</div>
							</>
						)}

						{/* ── AWS ── */}
						{tab === 'aws' && (
							<>
								<div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-violet-400/5 border border-violet-400/10">
									<ShieldCheck
										size={12}
										className="text-violet-400 mt-0.5 shrink-0"
									/>
									<p className="text-[10.5px] text-neutral-500 leading-relaxed">
										Credentials are AES-256 encrypted before
										being stored. They are only decrypted
										when needed for S3 uploads.
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
											className={`${inputCls(!!errors.aws_access_key_id)} pl-8 font-mono`}
										/>
									</div>
									<FieldError
										message={
											errors.aws_access_key_id?.message
										}
									/>
								</div>

								<div>
									<Label>Secret Access Key</Label>
									<SecretInput
										value={
											watch('aws_secret_access_key') ?? ''
										}
										onChange={(v) =>
											setValue('aws_secret_access_key', v)
										}
										placeholder="wJalrXUtnFEMI/K7MDENG..."
										hasError={
											!!errors.aws_secret_access_key
										}
									/>
									<FieldError
										message={
											errors.aws_secret_access_key
												?.message
										}
									/>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div>
										<Label>Region</Label>
										<input
											{...register('aws_region')}
											autoCapitalize="none"
											autoCorrect="off"
											autoComplete="off"
											spellCheck={false}
											placeholder="us-east-1"
											className={`${inputCls(!!errors.aws_region)} font-mono`}
										/>
										<FieldError
											message={errors.aws_region?.message}
										/>
									</div>
									<div>
										<Label>Bucket</Label>
										<input
											{...register('aws_bucket')}
											autoCapitalize="none"
											autoCorrect="off"
											autoComplete="off"
											spellCheck={false}
											placeholder="my-bucket"
											className={`${inputCls(!!errors.aws_bucket)} font-mono`}
										/>
										<FieldError
											message={errors.aws_bucket?.message}
										/>
									</div>
								</div>
							</>
						)}
					</div>

					{/* Footer */}
					<div className="px-5 pb-5 flex items-center justify-end gap-3">
						<button
							type="button"
							onClick={() => onOpenChange(false)}
							className="px-4 py-1.5 cursor-pointer rounded-lg text-[12px] text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-colors"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleSubmit(onSubmit)}
							disabled={saving || loading}
							className="flex cursor-pointer items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-medium bg-amber-400 text-neutral-900 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
						>
							{saving ? (
								<Loader2 size={12} className="animate-spin" />
							) : saved ? (
								<Check size={12} />
							) : (
								<ShieldCheck size={12} />
							)}
							{saved
								? 'Saved!'
								: saving
									? 'Saving…'
									: 'Save Settings'}
						</button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};
