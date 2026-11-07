import React, { useState, useEffect, useCallback } from 'react';
import { readingsApi, reportsApi } from '../api/client';
import {
  formatToDateInput,
  formatDisplayDate,
  getGlucoseStatus,
  TIME_SLOTS,
  SLOT_INFO,
} from '../utils/formatters';
import StatsCard from '../components/StatsCard';
import EmptyState from '../components/EmptyState';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage({
  onOpenAddModal,
  onOpenEditModal,
  selectedDate,
  setSelectedDate,
  refreshTrigger,
}) {
  const [dailyReadings, setDailyReadings] = useState([]);
  const [dailyStats, setDailyStats] = useState({ count: 0, highest: null, lowest: null, average: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const todayStr = formatToDateInput();

  const fetchDailyData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await reportsApi.getDaily(selectedDate);
      if (data && data.report) {
        setDailyStats({
          count: data.report.count || 0,
          highest: data.report.highest,
          lowest: data.report.lowest,
          average: data.report.average,
        });
        setDailyReadings(data.report.readings || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load readings for this date.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDailyData();
  }, [fetchDailyData, refreshTrigger]);

  const handleDelete = async (id, slot) => {
    if (!window.confirm(`Are you sure you want to delete the ${slot} reading?`)) {
      return;
    }
    try {
      setDeletingId(id);
      await readingsApi.delete(id);
      await fetchDailyData();
    } catch (err) {
      alert(err.message || 'Failed to delete reading.');
    } finally {
      setDeletingId(null);
    }
  };

  // Map readings by slot for easy slot matrix lookup
  const readingsBySlot = {};
  dailyReadings.forEach((r) => {
    readingsBySlot[r.slot] = r;
  });

  return (
    <div className="space-y-6">
      {/* Header with Date Selector & Action */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Daily Log</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            {formatDisplayDate(selectedDate)}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {dailyStats.count === 4
              ? 'All 4 daily target readings recorded.'
              : `${dailyStats.count} of 4 readings logged for this day.`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white transition-colors cursor-pointer"
            />
          </div>

          <button
            onClick={() => onOpenAddModal(selectedDate)}
            disabled={dailyStats.count >= 4}
            title={dailyStats.count >= 4 ? 'Maximum 4 readings per day reached' : 'Log a reading'}
            className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reading</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Daily Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Readings Logged"
          value={dailyStats.count}
          unit="/ 4"
          icon={CheckCircle2}
          color="blue"
          subtitle="Target 4 readings/day"
        />
        <StatsCard
          title="Average"
          value={dailyStats.average}
          unit="mg/dl"
          icon={Activity}
          color="amber"
          subtitle="Daily mean value"
        />
        <StatsCard
          title="Highest"
          value={dailyStats.highest}
          unit="mg/dl"
          icon={ArrowUpRight}
          color="rose"
          subtitle="Peak level for the day"
        />
        <StatsCard
          title="Lowest"
          value={dailyStats.lowest}
          unit="mg/dl"
          icon={ArrowDownRight}
          color="emerald"
          subtitle="Lowest level for the day"
        />
      </div>

      {/* Daily Slot Breakdown Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Scheduled Time Slots</h2>
          <span className="text-xs text-slate-500">4 checks recommended daily</span>
        </div>

        {dailyStats.count === 0 && !loading ? (
          <EmptyState
            message={`No blood glucose readings logged for ${formatDisplayDate(selectedDate)} yet. Record fasting or post-meal values to keep your doctor informed.`}
            actionText="Log First Reading"
            onAction={() => onOpenAddModal(selectedDate)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TIME_SLOTS.map((slotName) => {
              const reading = readingsBySlot[slotName];
              const slotMeta = SLOT_INFO[slotName] || {};

              if (reading) {
                const status = getGlucoseStatus(reading.value);
                return (
                  <div
                    key={slotName}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${slotMeta.color}`}>
                          {slotName}
                        </span>
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${status.bgClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass} mr-1.5`} />
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-baseline mt-3">
                        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                          {reading.value}
                        </span>
                        <span className="ml-1.5 text-xs font-semibold text-slate-500 uppercase">mg/dl</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-300" />
                        {slotMeta.time}
                      </p>
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-slate-100">
                      <button
                        onClick={() => onOpenEditModal(reading)}
                        className="inline-flex items-center space-x-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(reading.id, reading.slot)}
                        disabled={deletingId === reading.id}
                        className="inline-flex items-center space-x-1 text-xs font-medium text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>{deletingId === reading.id ? 'Deleting...' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={slotName}
                  className="bg-slate-50/60 rounded-2xl border border-dashed border-slate-300 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500">{slotName}</span>
                      <span className="text-xs text-slate-400 font-medium">Pending</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-slate-300" />
                      {slotMeta.time}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200/60 flex justify-end">
                    <button
                      onClick={() => onOpenAddModal(selectedDate, slotName)}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50/80 px-3 py-1.5 rounded-lg transition-colors border border-rose-200 bg-white shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log {slotMeta.short || 'Reading'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
