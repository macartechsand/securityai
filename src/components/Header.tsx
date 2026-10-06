import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Moon, Sun, Menu, X } from 'lucide-react';

interface HeaderProps {
  toggleDarkMode: () => void;
  isDarkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleDarkMode, isDarkMode }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          <span className="text-xl font-bold text-slate-800 dark:text-white">Macartech</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/"
            className={`text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              location.pathname === '/' ? 'text-blue-600 dark:text-blue-400' : ''
            }`}
          >
            Home
          </Link>
          <Link 
            to="/services"
            className={`text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              location.pathname === '/services' ? 'text-blue-600 dark:text-blue-400' : ''
            }`}
          >
            Services
          </Link>
          <Link 
            to="/contact"
            className={`text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
              location.pathname === '/contact' ? 'text-blue-600 dark:text-blue-400' : ''
            }`}
          >
            Contact
          </Link>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700" />
            )}
          </button>
        </nav>

        <div className="flex items-center space-x-2 md:hidden">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label={isDarkMode ? "Mudar para modo claro" : "Mudar para modo escuro"}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-slate-700" />
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-slate-700 dark:text-slate-200" />
            ) : (
              <Menu className="h-6 w-6 text-slate-700 dark:text-slate-200" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 shadow-md py-4 md:hidden animate-fadeIn">
            <nav className="container mx-auto px-4 flex flex-col space-y-4">
              <Link 
                to="/"
                className={`text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 ${
                  location.pathname === '/' ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/services"
                className={`text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 ${
                  location.pathname === '/services' ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Serviços
              </Link>
              <Link 
                to="/contact"
                className={`text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-2 ${
                  location.pathname === '/contact' ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contato
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;