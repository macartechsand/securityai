import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const Terms = () => {
  const { language } = useLanguage();
  
  const content = {
    en: {
      title: "Terms of Use",
      lastUpdated: "Last updated: March 2024",
      sections: [
        {
          title: "Service Usage",
          text: "By accessing our services, you agree to these terms and conditions. We reserve the right to modify or terminate services at any time."
        },
        {
          title: "User Responsibilities",
          text: "Users must provide accurate information and maintain the security of their accounts. Any unauthorized use must be reported immediately."
        },
        {
          title: "Limitations",
          text: "We are not responsible for any damages arising from service use or interruption. Users accept all risks associated with service usage."
        }
      ]
    },
    
  };

  const currentContent = content[language as keyof typeof content] || content.en;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            {currentContent.title}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            {currentContent.lastUpdated}
          </p>
          {currentContent.sections.map((section, index) => (
            <div key={index} className="mb-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
                {section.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {section.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Terms;