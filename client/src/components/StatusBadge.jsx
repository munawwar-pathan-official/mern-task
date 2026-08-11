import React from 'react';
import {
  Sparkles,
  UserCheck,
  Clock,
  Send,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const statusConfig = {
  New: {
    bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    icon: Sparkles,
  },
  Assigned: {
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    icon: UserCheck,
  },
  'In Progress': {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    icon: Clock,
  },
  Submitted: {
    bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    icon: Send,
  },
  Cleared: {
    bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2,
  },
  Discrepant: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    icon: AlertTriangle,
  },
};

export default function StatusBadge({ status, size = 'normal' }) {
  const config = statusConfig[status] || {
    bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    icon: Clock,
  };
  const Icon = config.icon;

  const sizeClasses =
    size === 'large'
      ? 'px-3.5 py-1.5 text-sm font-semibold gap-2 border'
      : 'px-2.5 py-1 text-xs font-medium gap-1.5 border';

  return (
    <span
      className={`inline-flex items-center rounded-full transition-all duration-200 ${config.bg} ${sizeClasses}`}
    >
      <Icon className={size === 'large' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{status}</span>
    </span>
  );
}
