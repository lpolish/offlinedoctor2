import React from 'react';
import { AlertCircle, Settings, Activity } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title and Status */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-medical-500" />
            <h1 className="text-xl font-semibold text-gray-900">
              Offline Medical Assistant
            </h1>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center space-x-2 text-sm">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">AI Ready</span>
          </div>
        </div>

        {/* Medical Disclaimer */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="hidden md:inline">
            For educational purposes only - Consult healthcare professionals
          </span>
          <span className="md:hidden">Educational use only</span>
        </div>

        {/* Settings */}
        <button
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
