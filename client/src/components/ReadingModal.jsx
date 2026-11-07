import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { TIME_SLOTS, formatToDateInput } from '../utils/formatters';

export default function ReadingModal({ isOpen, onClose, onSave, editingReading = null }) {
  const [date, setDate] = useState(formatToDateInput());
  const [slot, setSlot] = useState(TIME_SLOTS[0]);
  const [value, setValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const todayStr = formatToDateInput();

  useEffect(() => {
    if (editingReading) {
      setDate(editingReading.reading_date);
      setSlot(editingReading.slot);
      setValue(editingReading.value.toString());
      setErrorMessage('');
    } else {
      setDate(formatToDateInput());
      setSlot(TIME_SLOTS[0]);
      setValue('');
      setErrorMessage('');
    }
  }, [editingReading, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Rule: Date cannot be in the future
    if (date > todayStr) {
      setErrorMessage('Date cannot be in the future.');
      return;
    }

    // Rule: Value is required
    if (value === undefined || value === null || value === '' || String(value).trim() === '') {
      setErrorMessage('Please enter a glucose value.');
      return;
    }

    // Rule: Value must be a whole number between 40 and 600
    const num = Number(value);
    if (!Number.isInteger(num) || num < 40 || num > 600) {
      setErrorMessage('Value must be between 40 and 600 mg/dl.');
      return;
    }

    try {
      setSubmitting(true);
      await onSave({
        date,
        slot,
        value: num,
      });
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save reading. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">
            {editingReading ? 'Edit Blood Glucose Reading' : 'Log New Glucose Reading'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
          {/* Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-start space-x-2 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Date Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="reading-date">
              Date
            </label>
            <input
              id="reading-date"
              type="date"
              max={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Cannot be a future date.</p>
          </div>

          {/* Time Slot Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="reading-slot">
              Time Slot
            </label>
            <select
              id="reading-slot"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm bg-white"
            >
              {TIME_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">One reading allowed per slot per day (max 4/day).</p>
          </div>

          {/* Glucose Value Field */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="reading-value">
              Blood Glucose Value
            </label>
            <div className="relative">
              <input
                id="reading-value"
                type="number"
                step="1"
                placeholder="e.g. 110"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-16 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm font-medium"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 uppercase">
                mg/dl
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Enter a whole number between 40 and 600.</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingReading ? 'Update Reading' : 'Save Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
