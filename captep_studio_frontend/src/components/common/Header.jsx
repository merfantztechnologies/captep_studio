import { useNavigate } from 'react-router-dom';
import { Home, Plus, Settings, HelpCircle } from 'lucide-react';

const Header = ({ title, showButtons, searchPlaceholder }) => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    navigate('/home');
  };

  return (
    <header className="bg-white border-b border-gray-300 h-14 flex items-center px-6 w-full">
      <div className="flex items-center justify-between w-full">
        {/* Left side */}
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleHomeClick}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Go to Home"
          >
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="5" r="2"/>
              <circle cx="12" cy="5" r="2"/>
              <circle cx="19" cy="5" r="2"/>
              <circle cx="5" cy="12" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="19" cy="12" r="2"/>
              <circle cx="5" cy="19" r="2"/>
              <circle cx="12" cy="19" r="2"/>
              <circle cx="19" cy="19" r="2"/>
            </svg>
          </button>

          <span className="text-lg font-semibold text-blue-600">Captep Studio</span>
        </div>
        
        {/* Right side */}
        <div className="flex items-center space-x-4">
          <span className="p-2 hover:bg-gray-100 rounded">
            <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L4 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </span>
          
          <div className="flex flex-col items-end">
            <span className="text-xs text-gray-500">Environment</span>
            <span className="text-sm text-gray-800 font-medium">merfantz.com (default)</span>
          </div>
          
          <span className="p-2 hover:bg-gray-100 rounded">
            <Settings className="w-5 h-5 text-gray-600" />
          </span>
          
          <span className="p-2 hover:bg-gray-100 rounded">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </span>
          
          <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
            MS
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;