import React from 'react';
import { BookOpen, ClipboardEdit, Network, ArrowRight, PlayCircle, Info } from 'lucide-react';
import { motion } from 'motion/react';

export const InicioModule: React.FC = () => {
  const steps = [
    {
      title: "Paso 1: Entiende la estructura",
      description: "Navega a la sección de 'Estructura' para revisar y entender la organización, las dependencias y los procesos y actividades asociadas.",
      icon: <Network className="w-6 h-6 text-institutional-blue" />
    },
    {
      title: "Paso 2: Captura tus cargas de trabajo",
      description: "Dirígete a 'Captura de Cargas' donde podrás ingresar los tiempos y frecuencias de las actividades que realizas en tu día a día.",
      icon: <ClipboardEdit className="w-6 h-6 text-institutional-green" />
    },
    {
      title: "Paso 3: Guarda tus registros",
      description: "Asegúrate de guardar y verificar que la información introducida sea precisa. Esto nos ayudará a optimizar y dimensionar adecuadamente los procesos.",
      icon: <BookOpen className="w-6 h-6 text-institutional-blue" />
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-8 relative border-l-4 border-l-institutional-blue"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-4 bg-institutional-blue/10 rounded-2xl text-institutional-blue shrink-0">
            <Info className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Bienvenido a la plataforma SISDECAT</h1>
            <p className="text-slate-500 mt-2 text-lg">Sistema digital para la medición y dimensionamiento de cargas de trabajo.</p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 prose prose-slate max-w-none text-slate-600 text-base leading-relaxed">
          <p>
            Esta aplicación está diseñada para ayudarte a registrar y gestionar de forma eficiente 
            las actividades que realizas en tu cargo. Al documentar tus tiempos y frecuencias, 
            contribuyes directamente al estudio de cargas de trabajo de la institución, 
            lo cual permite optimizar procesos y mejorar la distribución de tareas.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {steps.map((step, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden group hover:border-institutional-blue/40 transition-colors"
          >
            <div className="mb-4 bg-institutional-blue/5 w-14 h-14 rounded-full flex items-center justify-center border border-institutional-blue/10 group-hover:bg-institutional-blue/10 group-hover:scale-110 transition-transform">
              {step.icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-institutional-blue/5 border border-institutional-blue/20 rounded-xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left shadow-sm"
      >
        <PlayCircle className="w-10 h-10 text-institutional-blue shrink-0" />
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-lg">¿Listo para comenzar?</h4>
          <p className="text-slate-600 mt-1 mb-4 text-sm max-w-2xl">
            Te recomendamos comenzar visualizando la estructura de tu área funcional y posteriormente dirigirte al módulo de captura de cargas.
          </p>
        </div>
        <div className="shrink-0">
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('navigate-module', { detail: 'estructura' }));
            }}
            className="inline-flex items-center gap-2 text-sm font-bold text-white bg-institutional-blue hover:bg-institutional-blue/90 transition-colors px-6 py-3 rounded-lg shadow-sm"
          >
            Ir a Estructura
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

