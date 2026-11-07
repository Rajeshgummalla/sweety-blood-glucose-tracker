import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { readingsApi } from './api/client';
import { formatToDateInput } from './utils/formatters';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ReadingModal from './components/ReadingModal';
import { Activity } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' or 'reports'
  const [selectedDate, setSelectedDate] = useState(formatToDateInput());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Activity className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-slate-600">Loading Sweety...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authView === 'login' ? (
      <LoginPage onNavigateRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onNavigateLogin={() => setAuthView('login')} />
    );
  }

  const handleOpenAddModal = (dateForModal = selectedDate, prefillSlot = null) => {
    setEditingReading(
      prefillSlot
        ? { reading_date: dateForModal, slot: prefillSlot, value: '' }
        : null
    );
    setSelectedDate(dateForModal);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reading) => {
    setEditingReading(reading);
    setIsModalOpen(true);
  };

  const handleSaveReading = async (readingData) => {
    if (editingReading && editingReading.id) {
      await readingsApi.update(editingReading.id, readingData);
    } else {
      await readingsApi.create(readingData);
    }
    // Increment refresh trigger to reload data on active pages
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal(selectedDate)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <DashboardPage
            onOpenAddModal={handleOpenAddModal}
            onOpenEditModal={handleOpenEditModal}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <ReportsPage
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onOpenAddModal={handleOpenAddModal}
          />
        )}
      </main>

      {/* Global Add/Edit Reading Modal */}
      <ReadingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReading(null);
        }}
        onSave={handleSaveReading}
        editingReading={editingReading}
      />

      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400">
        <p>Sweety – Blood Glucose Tracker • Built with Node.js, Express, PostgreSQL & React</p>
      </footer>
    </div>
  );
}
