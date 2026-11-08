import React, { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '../api/client';
import {
  formatToDateInput,
  formatDisplayDate,
  formatDateRange,
  getGlucoseStatus,
  SLOT_INFO,
} from '../utils/formatters';
import StatsCard from '../components/StatsCard';
import LineChartCard from '../components/LineChartCard';
import EmptyState from '../components/EmptyState';
import {
  Calendar,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Hash,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function ReportsPage({ selectedDate, setSelectedDate, onOpenAddModal }) {
  const [activeReportTab, setActiveReportTab] = useState('daily'); // 'daily', 'monthToDate', 'monthly'
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_LIMIT = 20;

  const todayStr = formatToDateInput();

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await reportsApi.getAll(selectedDate);
      setReportsData(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to generate reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeReportTab, selectedDate]);

  const dailyReport = reportsData?.daily || { count: 0, highest: null, lowest: null, average: null, readings: [] };
  const mtdReport = reportsData?.monthToDate || { count: 0, highest: null, lowest: null, average: null, readings: [] };
  const monthlyReport = reportsData?.monthly || { count: 0, highest: null, lowest: null, average: null, readings: [] };

  const currentReportMap = {
    daily: {
      title: 'Daily Report',
      rangeDescription: formatDisplayDate(selectedDate),
      data: dailyReport,
      chartTitle: 'Daily Glucose Curve',
    },
    monthToDate: {
      title: 'Month-to-Date Report',
      rangeDescription: mtdReport.dateRange
        ? formatDateRange(mtdReport.dateRange.start, mtdReport.dateRange.end)
        : '',
      data: mtdReport,
      chartTitle: 'Month-to-Date Trend',
    },
    monthly: {
      title: 'Monthly Report (Previous Month)',
      rangeDescription: monthlyReport.dateRange
        ? formatDateRange(monthlyReport.dateRange.start, monthlyReport.dateRange.end)
        : '',
      data: monthlyReport,
      chartTitle: 'Previous Month Trend',
    },
  };

  const activeReport = currentReportMap[activeReportTab];

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Analytics & Reports</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Clinical Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standardized blood glucose statistics for patient review and physician visits.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="report-date-input" className="text-xs font-medium text-slate-500 hidden sm:inline">
            Reference Date:
          </label>
          <div className="relative flex items-center">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              id="report-date-input"
              type="date"
              max={todayStr}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50 hover:bg-white transition-colors cursor-pointer"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Report Type Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-200/70 rounded-2xl max-w-2xl">
        <button
          onClick={() => setActiveReportTab('daily')}
          className={`py-2 px-3 text-sm font-semibold rounded-xl transition-all ${
            activeReportTab === 'daily'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Daily
        </button>
        <button
          onClick={() => setActiveReportTab('monthToDate')}
          className={`py-2 px-3 text-sm font-semibold rounded-xl transition-all ${
            activeReportTab === 'monthToDate'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Month-to-Date
        </button>
        <button
          onClick={() => setActiveReportTab('monthly')}
          className={`py-2 px-3 text-sm font-semibold rounded-xl transition-all ${
            activeReportTab === 'monthly'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Previous Month
        </button>
      </div>

      {/* Active Report Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-rose-50/50 to-white border border-rose-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{activeReport.title}</h2>
          <p className="text-xs font-semibold text-rose-700 mt-0.5">
            Reporting Period: {activeReport.rangeDescription}
          </p>
        </div>
        <div className="text-xs text-slate-500">
          {activeReport.data.count > 0 ? (
            <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-medium">
              Data available ({activeReport.data.count} readings)
            </span>
          ) : (
            <span className="inline-flex items-center text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-medium">
              No entries for this period
            </span>
          )}
        </div>
      </div>

      {/* Report Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Readings"
          value={activeReport.data.count}
          unit="logged"
          icon={Hash}
          color="blue"
          subtitle="Total samples in period"
        />
        <StatsCard
          title="Average"
          value={activeReport.data.average}
          unit="mg/dl"
          icon={Activity}
          color="amber"
          subtitle="Mean level (1 decimal)"
        />
        <StatsCard
          title="Highest"
          value={activeReport.data.highest}
          unit="mg/dl"
          icon={ArrowUpRight}
          color="rose"
          subtitle="Maximum peak observed"
        />
        <StatsCard
          title="Lowest"
          value={activeReport.data.lowest}
          unit="mg/dl"
          icon={ArrowDownRight}
          color="emerald"
          subtitle="Lowest minimum observed"
        />
      </div>

      {/* If 0 readings: Friendly Empty State */}
      {activeReport.data.count === 0 && !loading ? (
        <EmptyState
          message={`No blood glucose readings found for the ${activeReport.title.toLowerCase()} (${activeReport.rangeDescription}). Log readings regularly to generate clinical insights.`}
          actionText="Add New Reading"
          onAction={() => onOpenAddModal(selectedDate)}
        />
      ) : (
        <>
          {/* Trend Chart (Month-to-date and Monthly, or whenever multiple readings) */}
          {activeReport.data.readings && activeReport.data.readings.length > 0 && (
            <LineChartCard
              title={activeReport.chartTitle}
              readings={activeReport.data.readings}
            />
          )}

          {/* Daily Report Readings Breakdown (Requirement: "The daily report also lists each reading with its slot.") */}
          {activeReportTab === 'daily' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Day's Recorded Readings
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Individual slot logs for {formatDisplayDate(selectedDate)}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {dailyReport.readings.length} / 4 Slots Recorded
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {dailyReport.readings.map((reading) => {
                  const status = getGlucoseStatus(reading.value);
                  const slotMeta = SLOT_INFO[reading.slot] || {};
                  return (
                    <div
                      key={reading.id}
                      className="py-3.5 flex items-center justify-between hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${slotMeta.color}`}>
                          {reading.slot}
                        </span>
                        <div className="hidden sm:flex items-center text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          <span>{slotMeta.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${status.bgClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass} mr-1.5`} />
                          {status.label}
                        </span>
                        <div className="text-right">
                          <span className="text-lg font-bold text-slate-900">{reading.value}</span>
                          <span className="text-xs font-medium text-slate-400 ml-1">mg/dl</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Month Summary Table for Month-to-date and Monthly */}
          {activeReportTab !== 'daily' && (() => {
            const readingsList = activeReport.data.readings || [];
            const totalReadings = readingsList.length;
            const totalPages = Math.ceil(totalReadings / PAGE_LIMIT) || 1;
            const safePage = Math.min(Math.max(1, currentPage), totalPages);
            const startIndex = totalReadings === 0 ? 0 : (safePage - 1) * PAGE_LIMIT;
            const paginatedReadings = readingsList.slice(startIndex, startIndex + PAGE_LIMIT);
            const startDisplay = totalReadings === 0 ? 0 : startIndex + 1;
            const endDisplay = Math.min(startIndex + PAGE_LIMIT, totalReadings);

            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Period Readings Log</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Chronological record for {activeReport.rangeDescription}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {totalReadings} Total Readings
                    </span>
                    {totalPages > 1 && (
                      <span className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                        Page {safePage} of {totalPages}
                      </span>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="pb-3 px-3">Date</th>
                        <th className="pb-3 px-3">Slot</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3 text-right">Glucose Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedReadings.map((r) => {
                        const status = getGlucoseStatus(r.value);
                        const slotMeta = SLOT_INFO[r.slot] || {};
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {formatDisplayDate(r.reading_date)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${slotMeta.color}`}>
                                {r.slot}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${status.bgClass}`}>
                                {status.label}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              {r.value} <span className="text-xs font-normal text-slate-400">mg/dl</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-3 border-t border-slate-100 text-xs">
                    <p className="text-slate-500">
                      Showing <span className="font-semibold text-slate-800">{startDisplay}</span> to{' '}
                      <span className="font-semibold text-slate-800">{endDisplay}</span> of{' '}
                      <span className="font-semibold text-slate-800">{totalReadings}</span> readings
                    </p>

                    <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage <= 1}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous</span>
                      </button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          className={`w-7 h-7 rounded-lg font-medium transition-colors ${
                            num === safePage
                              ? 'bg-rose-600 text-white font-semibold shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {num}
                        </button>
                      ))}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage >= totalPages}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
