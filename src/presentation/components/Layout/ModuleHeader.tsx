import React from 'react';
import { ChevronRight, Menu } from 'lucide-react';

interface ModuleHeaderProps {
  title: string;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({ title }) => (
  <div className="bg-institutional-blue text-white px-6 py-3 flex items-center justify-between shadow-sm">
    <h1 className="text-white font-bold text-lg flex items-center gap-2">
      <ChevronRight size={20} className="text-white" />
      {title}
    </h1>
    <div className="flex items-center gap-2">
      <button className="p-1.5 hover:bg-white/10 rounded transition-colors text-white">
        <Menu size={18} />
      </button>
    </div>
  </div>
);
