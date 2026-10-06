import React, { createContext, useContext, useState, useEffect } from 'react';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  en: {
    // Header
    'nav.home': 'Home',
    'nav.services': 'Services',
    'nav.contact': 'Contact',
    'theme.light': 'Switch to light mode',
    'theme.dark': 'Switch to dark mode',

    // Services
    'services.title': 'Our Services',
    'services.subtitle': 'Complete technology solutions to boost your digital success',
    'services.support.title': 'Technical Support',
    'services.support.description': 'Specialized 24/7 support to solve technical issues and ensure the proper functioning of your systems.',
    'services.consulting.title': 'IT Consulting',
    'services.consulting.description': 'Strategic consulting to optimize your IT processes and implement market best practices.',
    'services.security.title': 'Digital Security',
    'services.security.description': 'Complete protection for your data and systems against digital threats and vulnerabilities.',
    'services.development.title': 'Development',
    'services.development.description': 'Development of customized solutions to meet the specific needs of your business.',

    // Client Types
    'client.individual': 'Individual',
    'client.business': 'Business',

    // Service Types
    'service.support': 'Support / Incident',
    'service.solutions': 'Custom Solutions',
    'service.assessment': 'Security Assessment',

    // Analysis
    'analysis.title': 'AI-Powered Security Analysis',
    'analysis.processing': 'Processing your request...',
    'analysis.recommendations': 'Consolidated Recommendations',
    'analysis.need_help': 'Need specialized help?',
    'analysis.new_analysis': 'New Analysis',

    // Home
    'home.title': 'Identity Security Assistant',
    'home.subtitle': 'Ask about passwords, MFA, phishing, suspicious logins and account protection. Get clear guidance in plain language or with technical depth.',
    'home.badge.1': 'Simple or Technical answers',
    'home.badge.2': 'Evidence-aware: no guessing about compromise',
    'home.badge.3': 'Never asks for your passwords or codes',

    // Chat
    'chat.title': 'Security Assistant',
    'chat.mode.label': 'Answer level',
    'chat.mode.simple': 'Simple',
    'chat.mode.technical': 'Technical',
    'chat.mode.simple.hint': 'Plain language and practical steps',
    'chat.mode.technical.hint': 'Terminology, evidence and investigation steps',
    'chat.placeholder': 'Describe your situation or ask a question…',
    'chat.send': 'Send',
    'chat.thinking': 'Analyzing…',
    'chat.new': 'New conversation',
    'chat.empty.title': 'What would you like to know?',
    'chat.suggestion.1': 'How do I protect my account from takeover?',
    'chat.suggestion.2': 'I received an alert about a login from another country. What should I check?',
    'chat.suggestion.3': 'What is MFA and how do I turn it on?',
    'chat.suggestion.4': 'Is this email phishing? It asks me to confirm my account.',
    'chat.notice': 'Never share passwords, one-time codes, recovery codes, API keys or tokens here. This assistant will never ask for them.',
    'chat.disclaimer': 'AI can make mistakes and cannot see your accounts or devices. Verify important steps with the official provider. Conversations exist only in this browser session.',
    'chat.warning.secret': 'Something that looks like a password, code or key was detected and hidden before processing. If it was real, change or revoke it now.',
    'chat.error.rate_limited': 'Too many requests. Please wait a moment and try again.',
    'chat.error.invalid': 'The message could not be processed. Try shortening it.',
    'chat.error.unavailable': 'The assistant is unavailable right now. Please try again later.',
    'chat.error.timeout': 'The assistant took too long to answer. Please try again.',
    'chat.error.network': 'Could not reach the server. Check your connection and try again.',
    'chat.you': 'You',
    'chat.assistant': 'Assistant',

    // Contact
    'contact.title': 'Contact Us',
    'contact.subtitle': 'We are ready to help with your technology and digital security needs',
    'contact.form.name': 'Name',
    'contact.form.email': 'Email',
    'contact.form.subject': 'Subject',
    'contact.form.message': 'Message',
    'contact.form.submit': 'Send Message',
  },
  pt: {
    // Header
    'nav.home': 'Início',
    'nav.services': 'Serviços',
    'nav.contact': 'Contato',
    'theme.light': 'Mudar para modo claro',
    'theme.dark': 'Mudar para modo escuro',

    // Services
    'services.title': 'Nossos Serviços',
    'services.subtitle': 'Soluções completas em tecnologia para impulsionar seu sucesso digital',
    'services.support.title': 'Suporte Técnico',
    'services.support.description': 'Suporte especializado 24/7 para resolver problemas técnicos e garantir o funcionamento adequado dos seus sistemas.',
    'services.consulting.title': 'Consultoria em TI',
    'services.consulting.description': 'Consultoria estratégica para otimizar seus processos de TI e implementar as melhores práticas do mercado.',
    'services.security.title': 'Segurança Digital',
    'services.security.description': 'Proteção completa para seus dados e sistemas contra ameaças digitais e vulnerabilidades.',
    'services.development.title': 'Desenvolvimento',
    'services.development.description': 'Desenvolvimento de soluções personalizadas para atender às necessidades específicas do seu negócio.',

    // Client Types
    'client.individual': 'Pessoa Física',
    'client.business': 'Empresa',

    // Service Types
    'service.support': 'Suporte / Incidente',
    'service.solutions': 'Soluções Personalizadas',
    'service.assessment': 'Avaliação de Segurança',

    // Analysis
    'analysis.title': 'Análise de Segurança com IA',
    'analysis.processing': 'Processando sua solicitação...',
    'analysis.recommendations': 'Recomendações Consolidadas',
    'analysis.need_help': 'Precisa de ajuda especializada?',
    'analysis.new_analysis': 'Nova Análise',

    // Home
    'home.title': 'Assistente de Segurança de Identidade',
    'home.subtitle': 'Pergunte sobre senhas, MFA, phishing, logins suspeitos e proteção de contas. Receba orientações claras, em linguagem simples ou com profundidade técnica.',
    'home.badge.1': 'Respostas Simples ou Técnicas',
    'home.badge.2': 'Baseado em evidências: sem adivinhar invasões',
    'home.badge.3': 'Nunca pede suas senhas ou códigos',

    // Chat
    'chat.title': 'Assistente de Segurança',
    'chat.mode.label': 'Nível da resposta',
    'chat.mode.simple': 'Simples',
    'chat.mode.technical': 'Técnico',
    'chat.mode.simple.hint': 'Linguagem simples e passos práticos',
    'chat.mode.technical.hint': 'Terminologia, evidências e etapas de investigação',
    'chat.placeholder': 'Descreva sua situação ou faça uma pergunta…',
    'chat.send': 'Enviar',
    'chat.thinking': 'Analisando…',
    'chat.new': 'Nova conversa',
    'chat.empty.title': 'O que você gostaria de saber?',
    'chat.suggestion.1': 'Como posso proteger minha conta contra roubo?',
    'chat.suggestion.2': 'Recebi um alerta de login de outro país. O que devo verificar?',
    'chat.suggestion.3': 'O que é MFA e como ativo?',
    'chat.suggestion.4': 'Este e-mail é phishing? Ele pede para eu confirmar minha conta.',
    'chat.notice': 'Nunca compartilhe senhas, códigos de verificação, códigos de recuperação, chaves de API ou tokens aqui. Este assistente nunca vai pedir isso.',
    'chat.disclaimer': 'A IA pode errar e não enxerga suas contas nem seus dispositivos. Confirme passos importantes com o provedor oficial. As conversas existem apenas nesta sessão do navegador.',
    'chat.warning.secret': 'Algo parecido com senha, código ou chave foi detectado e ocultado antes do processamento. Se era real, troque ou revogue agora.',
    'chat.error.rate_limited': 'Muitas solicitações. Aguarde um momento e tente novamente.',
    'chat.error.invalid': 'Não foi possível processar a mensagem. Tente encurtá-la.',
    'chat.error.unavailable': 'O assistente está indisponível no momento. Tente novamente mais tarde.',
    'chat.error.timeout': 'O assistente demorou demais para responder. Tente novamente.',
    'chat.error.network': 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    'chat.you': 'Você',
    'chat.assistant': 'Assistente',

    // Contact
    'contact.title': 'Entre em Contato',
    'contact.subtitle': 'Estamos prontos para ajudar com suas necessidades em tecnologia e segurança digital',
    'contact.form.name': 'Nome',
    'contact.form.email': 'E-mail',
    'contact.form.subject': 'Assunto',
    'contact.form.message': 'Mensagem',
    'contact.form.submit': 'Enviar Mensagem',
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const browserLang = navigator.language.split('-')[0];
    return translations[browserLang as keyof typeof translations] ? browserLang : 'en';
  });

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language as keyof typeof translations][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};