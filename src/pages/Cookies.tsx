import { useLanguage } from '../contexts/LanguageContext';

const Cookies = () => {
  const { language } = useLanguage();
  
  const content = {
    en: {
      title: "Cookie Policy",
      lastUpdated: "Last updated: March 2024",
      sections: [
        {
          title: "What Are Cookies",
          text: "Cookies are small text files stored on your device that help us provide and improve our services."
        },
        {
          title: "How We Use Cookies",
          text: "We use cookies for essential functions, analytics, and to enhance user experience. You can control cookie settings in your browser."
        },
        {
          title: "Cookie Types",
          text: "We use necessary cookies for site operation and optional cookies for analytics and personalization."
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

export default Cookies;