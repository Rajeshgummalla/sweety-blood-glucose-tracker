import React from 'react';

export default function StatsCard({ title, value, unit = 'mg/dl', icon: Icon, color = 'rose', subtitle }) {
  const colorMap = {
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  const activeColor = colorMap[color] || colorMap.rose;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${activeColor}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline">
        <span className="text-3xl font-bold tracking-tight text-slate-900">
          {value !== null && value !== undefined ? value : '—'}
        </span>
        {value !== null && value !== undefined && unit && (
          <span className="ml-1.5 text-xs font-medium text-slate-500">{unit}</span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
