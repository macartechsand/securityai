import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Facebook, Twitter, Instagram, Github as GitHub } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-slate-100 dark:bg-slate-900 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-bold text-slate-800 dark:text-white">Macartech</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Technology and digital security solutions for businesses and individuals.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://instagram.com/_macartech" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://github.com/macartechsand" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
                aria-label="GitHub"
              >
                <GitHub className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-slate-800 dark:text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/services#support"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Technical Support
                </Link>
              </li>
              <li>
                <Link 
                  to="/services#consulting"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  IT Consulting
                </Link>
              </li>
              <li>
                <Link 
                  to="/services#security"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Digital Security
                </Link>
              </li>
              <li>
                <Link 
                  to="/services#development"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Development
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-slate-800 dark:text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/about"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link 
                  to="/careers"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-slate-800 dark:text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/privacy"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookies"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/lgpd"
                  className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  LGPD (Data Protection Law)
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            © {currentYear} Macartech. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
