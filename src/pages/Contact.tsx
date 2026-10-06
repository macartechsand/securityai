import React from 'react';
import { MapPin, Phone, Mail, Clock, MessageSquare } from 'lucide-react';

const Contact = () => {
  const contactInfo = [
    {
      icon: <Phone className="w-6 h-6 text-blue-600" />,
      title: "Phone",
      content: "+55 (11) 977288509",
      link: "tel:+5511977288509"
    },
    {
      icon: <Mail className="w-6 h-6 text-blue-600" />,
      title: "Email",
      content: "macartesand@gmail.com",
      link: "mailto:macartesand@gmail.com"
    },
    {
      icon: <MapPin className="w-6 h-6 text-blue-600" />,
      title: "Address",
      content: "São Paulo, SP - Brazil",
      link: "https://maps.google.com/?q=São Paulo, SP"
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-600" />,
      title: "Hours",
      content: "Mon-Fri: 8am to 6pm",
      link: null
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We're ready to help with your technology and digital security needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Contact Information
              </h2>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 mt-1">{info.icon}</div>
                    <div className="ml-4">
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {info.title}
                      </h3>
                      {info.link ? (
                        <a
                          href={info.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {info.content}
                        </a>
                      ) : (
                        <p className="text-slate-600 dark:text-slate-400">
                          {info.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Quick Support
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Need immediate help? Contact us via WhatsApp for faster support.
              </p>
              <a
                href="https://wa.me/5511977288509"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg text-center transition-colors duration-200"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;