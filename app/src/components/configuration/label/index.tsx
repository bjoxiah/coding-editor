export const Label = ({
	children,
	required,
}: {
	children: React.ReactNode;
	required?: boolean;
}) => (
	<label className="flex items-center gap-1 text-[10.5px] font-medium text-neutral-500 uppercase tracking-widest mb-1.5">
		{children}
		{required && (
			<span className="text-amber-400/80 normal-case tracking-normal font-normal text-[10px]">
				*
			</span>
		)}
	</label>
);
