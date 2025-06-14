import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  MessageCircle, 
  History, 
  Settings, 
  Heart,
  AlertTriangle,
  Info
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { path: '/', icon: Home, label: 'Home', description: 'Dashboard and overview' },
    { path: '/chat', icon: MessageCircle, label: 'Medical Chat', description: 'AI consultation' },
    { path: '/history', icon: History, label: 'History', description: 'Past conversations' },
    { path: '/settings', icon: Settings, label: 'Settings', description: 'App preferences' },
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      {/* Logo and Title */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-medical-500 rounded-lg">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">MedAssist</h2>
            <p className="text-sm text-gray-500">Offline AI</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-medical-50 text-medical-700 border-r-2 border-medical-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <div className="flex-1">
                  <div>{item.label}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Medical Disclaimer */}
      <div className="p-4 m-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Medical Disclaimer</p>
            <p>This tool provides educational information only. Always consult healthcare professionals for medical advice.</p>
          </div>
        </div>
      </div>

      {/* Emergency Notice */}
      <div className="p-4 m-4 bg-red-50 rounded-lg border-l-4 border-red-500">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-red-800">
            <p className="font-medium mb-1">Emergency?</p>
            <p>Call your local emergency services immediately. Don't rely on this app for emergencies.</p>
          </div>
        </div>
      </div>

      {/* Status Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span>Offline Mode</span>
          </div>
          <div>v1.0.0</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
