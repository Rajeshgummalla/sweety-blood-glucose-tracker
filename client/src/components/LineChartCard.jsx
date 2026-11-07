import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { formatDisplayDate } from '../utils/formatters';

export default function LineChartCard({ title, readings = [] }) {
  if (!readings || readings.length === 0) {
    return null;
  }

  // Map readings into chart data points
  const chartData = readings.map((r, idx) => ({
    index: idx + 1,
    date: r.reading_date,
    displayDate: formatDisplayDate(r.reading_date),
    slot: r.slot,
    value: r.value,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1">
          <p className="font-semibold">{data.displayDate}</p>
          <p className="text-slate-300">{data.slot}</p>
          <p className="text-rose-400 font-bold text-sm">{data.value} mg/dl</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title || 'Glucose Trend'}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Readings progression with normal target range (70 – 140 mg/dl)
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs mt-2 sm:mt-0">
          <span className="flex items-center text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 mr-1.5" />
            Reading (mg/dl)
          </span>
          <span className="flex items-center text-slate-500">
            <span className="w-3 h-0.5 bg-emerald-500 mr-1.5 border-dashed" />
            Target (140)
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(str) => {
                const parts = str.split('-');
                return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}`;
              }}
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
            />
            <YAxis
              domain={[40, 'dataMax + 30']}
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
              unit=" mg"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={140} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
            <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#e11d48"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#e11d48', strokeWidth: 1, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#be123c', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
