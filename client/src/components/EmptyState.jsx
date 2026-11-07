import React from 'react';
import { PlusCircle, HeartHandshake } from 'lucide-react';

export default function EmptyState({ message, actionText, onAction }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center flex flex-col items-center justify-center my-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
        <HeartHandshake className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">No readings recorded yet</h3>
      <p className="text-sm text-slate-500 max-w-sm mt-1 mb-6">
        {message || 'You haven’t logged any glucose readings for this period. Keeping regular records helps track your health progress.'}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{actionText || 'Log First Reading'}</span>
        </button>
      )}
    </div>
  );
}
