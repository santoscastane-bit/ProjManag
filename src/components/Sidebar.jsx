import React from 'react';
import { LayoutDashboard, FolderKanban, Users, Calendar, Menu, X, Network } from 'lucide-react';
import adeslasLogo from '../assets/logos/adeslas.png';
import garajeLogo from '../assets/logos/garaje.svg';

const Sidebar = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Proyectos', icon: FolderKanban },
        { id: 'workload', label: 'Cargabilidad', icon: Users },
        { id: 'calendar', label: 'Calendario', icon: Calendar },
        { id: 'org', label: 'Organigrama', icon: Network },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
                <div className="p-6 flex justify-between items-center">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <img src={adeslasLogo} alt="Adeslas" className="h-6 w-auto bg-white rounded px-2 py-1" />
                            <span className="text-xs text-slate-400">PMO</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <img src={garajeLogo} alt="Garaje de Ideas" className="h-6 w-auto filter invert brightness-0 contrast-200" />
                        </div>
                    </div>
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="mt-6 px-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsMobileOpen(false);
                                }}
                                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                  ${activeTab === item.id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center space-x-3 text-slate-400 text-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                            SC
                        </div>
                        <div>
                            <p className="text-white font-medium">Santos Castañé</p>
                            <p className="text-xs">Project Manager</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
