import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, LogOut, BarChart3, Calendar, Plus } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAddModal }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-200">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Sweety</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                Blood Glucose Tracker
              </span>
            </div>
          </div>

          {/* Navigation tabs */}
          {user && (
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-rose-50 text-rose-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-rose-50 text-rose-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </button>

              <div className="h-5 w-px bg-slate-200 mx-1 sm:mx-2 hidden sm:block" />

              {/* Add reading quick button */}
              <button
                onClick={onOpenAddModal}
                className="hidden sm:inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium px-3.5 py-2 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Reading</span>
              </button>

              {/* User profile & Logout */}
              <div className="flex items-center pl-2 space-x-2">
                <span className="text-xs text-slate-500 hidden md:inline-block font-medium">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
