import React from 'react';
import { History, ArrowRight, User, ShieldAlert, Sparkles, FileUp, MessageSquare } from 'lucide-react';

const getActionBadge = (action) => {
  switch (action) {
    case 'CASE_CREATED':
      return { bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: Sparkles };
    case 'CASE_ASSIGNED':
      return { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: User };
    case 'STATUS_CHANGE':
      return { bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: History };
    case 'DOCUMENT_UPLOADED':
      return { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: FileUp };
    case 'COMMENT_ADDED':
      return { bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: MessageSquare };
    default:
      return { bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: History };
  }
};

export default function AuditLogList({ logs }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No audit log entries recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const badge = getActionBadge(log.action);
        const Icon = badge.icon;
        const formattedDate = new Date(log.createdAt).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        return (
          <div
            key={log._id}
            className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 transition-all hover:border-slate-700"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`p-2 rounded-lg border ${badge.bg}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      {log.changedBy?.name || 'System User'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                      {log.changedBy?.role || 'User'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{log.details}</p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                {formattedDate}
              </span>
            </div>

            {/* State Transition Pill */}
            {log.fromStatus && log.toStatus && (
              <div className="mt-3 inline-flex items-center gap-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-xs font-mono">
                <span className="text-slate-400">{log.fromStatus}</span>
                <ArrowRight className="w-3 h-3 text-indigo-400" />
                <span className="text-indigo-300 font-bold">{log.toStatus}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
