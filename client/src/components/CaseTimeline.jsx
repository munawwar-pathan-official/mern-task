import React from 'react';
import { Check, Circle, AlertCircle } from 'lucide-react';

const steps = ['New', 'Assigned', 'In Progress', 'Submitted', 'Cleared']; // Or Discrepant

export default function CaseTimeline({ currentStatus }) {
  const isDiscrepant = currentStatus === 'Discrepant';

  const getStepState = (stepName, index) => {
    if (isDiscrepant) {
      if (stepName === 'Cleared') return 'discrepant';
      const stepsOrder = ['New', 'Assigned', 'In Progress', 'Submitted'];
      const currentIndex = stepsOrder.indexOf(currentStatus);
      if (index <= 3) return 'completed';
      return 'upcoming';
    }

    const currentIndex = steps.indexOf(currentStatus);
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
        <span>Workflow Transition Timeline</span>
        <span className="text-indigo-400 font-mono text-[11px] lowercase">
          server-enforced
        </span>
      </h4>

      <div className="relative flex items-center justify-between">
        {/* Background Connecting Line */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-800 z-0" />

        {steps.map((step, idx) => {
          const state = getStepState(step, idx);
          const isFinalDiscrepantStep = isDiscrepant && idx === 4;

          return (
            <div
              key={step}
              className="relative z-10 flex flex-col items-center group cursor-default"
            >
              {/* Circle indicator */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  isFinalDiscrepantStep
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-4 ring-rose-500/20'
                    : state === 'completed'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : state === 'active'
                    ? 'bg-slate-950 text-indigo-400 border-2 border-indigo-500 ring-4 ring-indigo-500/20 scale-110 shadow-xl'
                    : 'bg-slate-950 text-slate-600 border border-slate-700'
                }`}
              >
                {isFinalDiscrepantStep ? (
                  <AlertCircle className="w-5 h-5" />
                ) : state === 'completed' ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : state === 'active' ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="mt-2.5 text-center">
                <p
                  className={`text-xs font-semibold whitespace-nowrap ${
                    isFinalDiscrepantStep
                      ? 'text-rose-400 font-bold'
                      : state === 'active'
                      ? 'text-indigo-400 font-bold'
                      : state === 'completed'
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  {isFinalDiscrepantStep ? 'Discrepant' : step}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
