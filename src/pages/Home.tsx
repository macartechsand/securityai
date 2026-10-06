import React from 'react';
import Chat from '../components/Chat';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Lock, AlertCircle } from 'lucide-react';

const Home: React.FC = () => {
  const { t } = useLanguage();

  return (
    <main className="flex-grow pt-24 pb-16">
      <div className="container mx-auto px-4">
        <section className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            {t('home.title')}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            {t('home.subtitle')}
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Shield className="h-5 w-5" />
              <span className="font-medium">{t('home.badge.1')}</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">{t('home.badge.2')}</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <Lock className="h-5 w-5" />
              <span className="font-medium">{t('home.badge.3')}</span>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto">
          <Chat />
        </section>
      </div>
    </main>
  );
};

export default Home;
