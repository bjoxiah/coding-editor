import { ProjectLogs } from '@/models';
import { formatDistanceToNow } from 'date-fns';
import {
  Terminal, Pencil, Eye, AlertCircle, RotateCcw, FileCode2,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface LogGroup {
  action: 'scaffold' | 'edit' | 'preview';
  logs: ProjectLogs[];
}

export const groupLogs = (logs: ProjectLogs[]): LogGroup[] => {
  return logs.reduce<LogGroup[]>((acc, log) => {
    const last = acc[acc.length - 1];
    if (last && last.action === log.action) {
      last.logs.push(log);
    } else {
      acc.push({ action: log.action, logs: [log] });
    }
    return acc;
  }, []);
};

// Only used for scaffold/edit — reorders so file writes come before done
const sortScaffoldLogs = (logs: ProjectLogs[]): ProjectLogs[] => {
  const status     = logs.filter((l) => l.type === 'status');
  const fileWrites = logs.filter((l) => l.type === 'file_write');
  const errors     = logs.filter((l) => l.type === 'error');
  const done       = logs.filter((l) => l.type === 'done');
  return [...status, ...fileWrites, ...errors, ...done];
};

const ACTION_STYLE = {
  scaffold: { label: 'scaffold', Icon: Terminal, iconText: 'text-neutral-400', iconBg: 'bg-white/5', bar: 'bg-white/8', badge: 'text-neutral-600' },
  edit:     { label: 'edit',     Icon: Pencil,   iconText: 'text-neutral-400', iconBg: 'bg-white/5', bar: 'bg-white/8', badge: 'text-neutral-600' },
  preview:  { label: 'preview',  Icon: Eye,      iconText: 'text-neutral-400', iconBg: 'bg-white/5', bar: 'bg-white/8', badge: 'text-neutral-600' },
} as const;

type LogGroupProps = {
  group: LogGroup;
  isLast: boolean;
  agentRunning: boolean;
  onRetry: () => void;
};

const LogEntry = ({ log, agentRunning, onRetry }: { log: ProjectLogs; agentRunning: boolean; onRetry: () => void }) => {
  if (log.type === 'status') return (
    <p className="text-[11px] text-neutral-500 leading-relaxed">{log.message}</p>
  );

  if (log.type === 'file_write') return (
    <div className="flex items-center gap-1.5">
      <FileCode2 size={9} className="text-neutral-600 shrink-0" />
      <span className="text-[10px] font-mono text-neutral-400 truncate">{log.message}</span>
    </div>
  );

  if (log.type === 'done') return (
    <div className="text-[11px] text-neutral-400 leading-relaxed">
      <ReactMarkdown
        components={{
          p:      ({ children }) => <p className="text-[11px] text-neutral-400 leading-relaxed mb-1 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="text-neutral-300 font-semibold">{children}</strong>,
          h3:     ({ children }) => <p className="text-[11px] text-neutral-300 font-semibold mt-2 mb-0.5">{children}</p>,
          h2:     ({ children }) => <p className="text-[11px] text-neutral-300 font-semibold mt-2 mb-0.5">{children}</p>,
          ul:     ({ children }) => <ul className="space-y-0.5 mt-1">{children}</ul>,
          li:     ({ children }) => (
            <li className="flex items-start gap-1.5 text-[11px] text-neutral-500">
              <span className="text-neutral-700 mt-0.5 shrink-0">–</span>
              <span>{children}</span>
            </li>
          ),
          code: ({ children }) => <code className="text-[10px] font-mono text-neutral-500 bg-white/4 px-1 rounded">{children}</code>,
        }}
      >
        {log.message}
      </ReactMarkdown>
    </div>
  );

  if (log.type === 'error') return (
    <div className="space-y-1.5">
      <div className="flex items-start gap-1.5">
        <AlertCircle size={9} className="text-red-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-red-400/80 leading-relaxed wrap-break-words">{log.message}</p>
      </div>
      {!agentRunning && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 ml-3.5 px-2 py-0.5 rounded text-[10px] bg-white/4 border border-white/8 text-neutral-500 hover:text-neutral-300 hover:bg-white/6 transition-all cursor-pointer"
        >
          <RotateCcw size={8} />
          retry
        </button>
      )}
    </div>
  );

  return null;
};

export const LogGroupBlock = ({ group, isLast, agentRunning, onRetry }: LogGroupProps) => {
  const s         = ACTION_STYLE[group.action];
  const Icon      = s.Icon;
  const lastLog   = group.logs[group.logs.length - 1];
  const groupDone = !isLast || !agentRunning;
  const groupTime = lastLog?.timestamp
    ? formatDistanceToNow(new Date(lastLog.timestamp), { addSuffix: true })
    : '';

  // scaffold/edit: custom order (status → files → errors → done)
  const isScaffold = group.action === 'scaffold' || group.action === 'edit';
  const sorted     = isScaffold ? sortScaffoldLogs(group.logs) : group.logs;

  // For scaffold only — separate file writes into their own block
  const fileWrites = isScaffold ? sorted.filter((l) => l.type === 'file_write') : [];
  const rest       = isScaffold ? sorted.filter((l) => l.type !== 'file_write') : sorted;

  return (
    <div className="flex gap-3" style={{ animation: 'slideUp 0.18s ease-out both' }}>
      {/* Spine */}
      <div className="flex flex-col items-center shrink-0 w-5">
        <div className={`w-5 h-5 rounded flex items-center justify-center ${s.iconBg}`}>
          <Icon size={10} className={s.iconText} />
        </div>
        {(!isLast || agentRunning) && (
          <div className={`w-px flex-1 min-h-3 mt-1 ${s.bar}`} />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 pb-5">
        <span className={`text-[9px] uppercase tracking-[0.15em] font-semibold ${s.badge} block mb-2`}>
          {s.label}
        </span>

        {isScaffold ? (
          // Scaffold/edit: status messages, then file block, then errors + done
          <div className="space-y-1">
            {rest.filter(l => l.type === 'status').map((log, i) => (
              <LogEntry key={i} log={log} agentRunning={agentRunning} onRetry={onRetry} />
            ))}

            {fileWrites.length > 0 && (
              <div className="mt-1.5 rounded-md bg-white/2 border border-white/6 px-2.5 py-2 space-y-0.5">
                {fileWrites.map((log, i) => (
                  <LogEntry key={i} log={log} agentRunning={agentRunning} onRetry={onRetry} />
                ))}
              </div>
            )}

            {rest.filter(l => l.type !== 'status').map((log, i) => (
              <div key={i} className={log.type === 'done' ? 'mt-2' : ''}>
                <LogEntry log={log} agentRunning={agentRunning} onRetry={onRetry} />
              </div>
            ))}
          </div>
        ) : (
          // Preview/other: strict chronological order
          <div className="space-y-1">
            {rest.map((log, i) => (
              <LogEntry key={i} log={log} agentRunning={agentRunning} onRetry={onRetry} />
            ))}
          </div>
        )}

        {groupDone && groupTime && (
          <span className="text-[9px] text-neutral-700 font-mono mt-2.5 block tabular-nums">
            {groupTime}
          </span>
        )}
      </div>
    </div>
  );
};