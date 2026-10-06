import React from 'react';
import { Shield, Server, Lock, Code, Headphones, Users, Wrench, Database } from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: <Headphones className="w-12 h-12 text-blue-600" />,
      title: "Technical Support",
      description: "Specialized 24/7 support to solve technical issues and ensure the proper functioning of your systems.",
      features: [
        "Remote and on-site assistance",
        "Fast problem resolution",
        "Preventive maintenance",
        "Continuous monitoring"
      ]
    },
    {
      icon: <Users className="w-12 h-12 text-blue-600" />,
      title: "IT Consulting",
      description: "Strategic consulting to optimize your IT processes and implement market best practices.",
      features: [
        "Infrastructure analysis",
        "Strategic planning",
        "Project management",
        "Resource optimization"
      ]
    },
    {
      icon: <Lock className="w-12 h-12 text-blue-600" />,
      title: "Digital Security",
      description: "Complete protection for your data and systems against digital threats and vulnerabilities.",
      features: [
        "Vulnerability analysis",
        "Firewall implementation",
        "Backup and recovery",
        "Security training"
      ]
    },
    {
      icon: <Code className="w-12 h-12 text-blue-600" />,
      title: "Development",
      description: "Development of customized solutions to meet the specific needs of your business.",
      features: [
        "Web and mobile systems",
        "System integrations",
        "Process automation",
        "Evolutionary maintenance"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Our Services
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Complete technology solutions to boost your digital success
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
              <div className="mb-6">{service.icon}</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {service.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {service.description}
              </p>
              <ul className="space-y-3">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-slate-700 dark:text-slate-300">
                    <Shield className="w-5 h-5 text-blue-600 mr-3" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">
            Why choose Macartech?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Security Focus
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Specialized in digital security and protection
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
              <Headphones className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                Community Support
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Helping individuals and communities stay secure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;