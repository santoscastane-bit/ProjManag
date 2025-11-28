import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import adeslasLogo from '../assets/logos/adeslas.png';

const Layout = ({ children, activeTab, setActiveTab }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={adeslasLogo} alt="Adeslas" className="h-8 w-auto bg-white rounded px-2 py-1" />
                        <span className="text-sm text-slate-500">PMO Dashboard</span>
                    </div>
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="text-slate-600 hover:text-slate-900"
                    >
                        <Menu size={24} />
                    </button>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
