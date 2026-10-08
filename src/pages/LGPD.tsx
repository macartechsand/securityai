import { useLanguage } from '../contexts/LanguageContext';

const LGPD = () => {
  const { language } = useLanguage();
  
  const content = {
    en: {
      title: "LGPD Compliance",
      lastUpdated: "Last updated: March 2024",
      sections: [
        {
          title: "Your Rights",
          text: "Under LGPD, you have the right to access, correct, delete, and transfer your personal data. You can also withdraw consent at any time."
        },
        {
          title: "Data Processing",
          text: "We process personal data only with legal basis and specific purposes, ensuring transparency and security in all operations."
        },
        {
          title: "International Transfers",
          text: "Any international data transfers comply with LGPD requirements and maintain appropriate security measures."
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

export default LGPD;