import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, Clock, Rocket, FolderKanban } from 'lucide-react';
import { useData } from '../hooks/useData';

const KPICard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
        {subtext && <p className="text-xs text-slate-400 mt-4">{subtext}</p>}
    </div>
);

const Dashboard = () => {
    const { projects: PROJECTS, workload: WORKLOAD, deployments: DEPLOYMENTS, loading } = useData();

    const stats = useMemo(() => {
        if (loading) return null;

        const totalProjects = PROJECTS.length;
        const activeProjects = PROJECTS.filter(p => p.status !== 'Terminado' && p.status !== 'Cancelado').length;
        const overloadedEmployees = new Set(WORKLOAD.filter(w => w.load > 1.0).map(w => w.empId)).size;

        const nextDeployment = DEPLOYMENTS
            .filter(d => d.type === 'Despliegue' && new Date(d.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

        // Chart Data: Status
        const statusCounts = PROJECTS.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {});
        const statusData = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));

        // Chart Data: Block
        const blockCounts = PROJECTS.reduce((acc, curr) => {
            acc[curr.block] = (acc[curr.block] || 0) + 1;
            return acc;
        }, {});
        const blockData = Object.keys(blockCounts).map(key => ({ name: key, value: blockCounts[key] }));

        return { totalProjects, activeProjects, overloadedEmployees, nextDeployment, statusData, blockData };
    }, [PROJECTS, WORKLOAD, DEPLOYMENTS, loading]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    if (loading) {
        return <div className="p-8 flex justify-center text-slate-500">Loading dashboard...</div>;
    }
    const activePct = stats.totalProjects ? Math.round((stats.activeProjects / stats.totalProjects) * 100) : 0;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Resumen Ejecutivo</h2>
                <span className="text-sm text-slate-500">Última actualización: {new Date().toLocaleDateString()}</span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Total Proyectos"
                    value={stats.totalProjects}
                    icon={FolderKanban}
                    color="bg-blue-500"
                />
                <KPICard
                    title="Proyectos Activos"
                    value={stats.activeProjects}
                    icon={Clock}
                    color="bg-emerald-500"
                    subtext={`${activePct}% del total`}
                />
                <KPICard
                    title="Alertas Sobrecarga"
                    value={stats.overloadedEmployees}
                    icon={AlertTriangle}
                    color="bg-red-500"
                    subtext="Empleados con carga > 100%"
                />
                <KPICard
                    title="Próximo Despliegue"
                    value={stats.nextDeployment ? new Date(stats.nextDeployment.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'N/A'}
                    icon={Rocket}
                    color="bg-indigo-500"
                    subtext={stats.nextDeployment?.desc || 'Sin eventos próximos'}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Status Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Estado de Proyectos</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.statusData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {stats.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Block Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Proyectos por Bloque</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.blockData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" axisLine={false} tickLine={false} />
                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
