import React, { useState, useMemo } from 'react';
import { Search, Filter, Info, Edit2, Plus, Trash2, X } from 'lucide-react';
import { useData } from '../hooks/useData';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const StatusBadge = ({ status }) => {
    const styles = {
        'Terminado': 'bg-emerald-100 text-emerald-700',
        'En Progreso': 'bg-blue-100 text-blue-700',
        'En Curso': 'bg-blue-100 text-blue-700',
        'Kickoff': 'bg-purple-100 text-purple-700',
        'Validación': 'bg-amber-100 text-amber-700',
        'Cancelado': 'bg-red-100 text-red-700',
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
            {status}
        </span>
    );
};

const ProgressBar = ({ progress }) => (
    <div className="w-full bg-slate-200 rounded-full h-2">
        <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
        />
    </div>
);

const Projects = () => {
    const { projects: PROJECTS, loading, refresh } = useData();
    const [search, setSearch] = useState('');
    const [filterBlock, setFilterBlock] = useState('All');
    const [filterPM, setFilterPM] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [infoModal, setInfoModal] = useState(null);
    const [compactView, setCompactView] = useState(true);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [editModal, setEditModal] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null);
    const dayMs = 1000 * 60 * 60 * 24;

    const blocks = useMemo(() => ['All', ...new Set(PROJECTS.map(p => p.block))], [PROJECTS]);
    const pms = useMemo(() => ['All', ...new Set([...PROJECTS.map(p => p.pm_gdi), ...PROJECTS.map(p => p.pm_sca)])], [PROJECTS]);
    const statuses = useMemo(() => ['All', ...new Set(PROJECTS.map(p => p.status))], [PROJECTS]);

    const filteredProjects = useMemo(() => {
        return PROJECTS.filter(project => {
            const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
                project.code.toLowerCase().includes(search.toLowerCase());
            const matchesBlock = filterBlock === 'All' || project.block === filterBlock;
            const matchesPM = filterPM === 'All' || project.pm_gdi === filterPM || project.pm_sca === filterPM;
            const matchesStatus = filterStatus === 'All' || project.status === filterStatus;

            return matchesSearch && matchesBlock && matchesPM && matchesStatus;
        });
    }, [PROJECTS, search, filterBlock, filterPM, filterStatus]);

    const formatRemaining = (start, end) => {
        if (!start || !end) return 'N/A';
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 'N/A';
        const total = Math.max(0, endDate - startDate);
        const remaining = Math.max(0, endDate - new Date());
        const daysLeft = Math.max(0, Math.ceil(remaining / dayMs));
        if (total === 0) return `${daysLeft}d`;
        const pct = Math.min(100, Math.max(0, Math.round((remaining / total) * 100)));
        return `${daysLeft}d (${pct}%)`;
    };

    const calcTheoreticalProgress = (start, end) => {
        if (!start || !end) return null;
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return null;
        const total = endDate - startDate;
        if (total <= 0) return null;
        const elapsed = new Date() - startDate;
        const ratio = Math.min(1, Math.max(0, elapsed / total));
        return ratio;
    };

    const formatDate = (value) => {
        if (!value) return 'N/A';
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
    };

    const openInfo = (project) => setInfoModal(project);

    const openEdit = (project) => {
        setEditModal({
            id: project?.id || `PRJ-${Date.now()}`,
            code: project?.code || '',
            name: project?.name || '',
            block: project?.block || '',
            hours: project?.hours || '',
            start: project?.start || '',
            end: project?.end || '',
            progress: Math.round((project?.progress || 0) * 100),
            pm_gdi: project?.pm_gdi || '',
            pm_sca: project?.pm_sca || '',
            status: project?.status || '',
            bp_real: project?.bp_real || '',
            bp_estimado: project?.bp_estimado || '',
            facturado: project?.facturado || '',
            link: project?.link || '',
            doc_tecnico: project?.doc_tecnico || '',
            doc_funcional: project?.doc_funcional || '',
            doc_cierre: project?.doc_cierre || '',
            type: project?.type || '',
        });
    };

    const saveProject = async () => {
        if (!editModal?.name) return;
        const payload = {
            ...editModal,
            progress: Math.max(0, Math.min(100, Number(editModal.progress))) / 100,
        };
        await setDoc(doc(db, 'projects', String(editModal.id)), payload);
        setEditModal(null);
        refresh();
    };

    const confirmDelete = async () => {
        if (!deleteModal) return;
        await deleteDoc(doc(db, 'projects', String(deleteModal.id)));
        setDeleteModal(null);
        refresh();
    };

    if (loading) {
        return <div className="p-8 flex justify-center text-slate-500">Loading projects...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Proyectos</h2>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Filter size={16} />
                        <span>Filtros</span>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar proyecto..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Filters */}
                    <select
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={filterBlock}
                        onChange={(e) => setFilterBlock(e.target.value)}
                    >
                        <option value="All">Todos los Bloques</option>
                        {blocks.filter(b => b !== 'All').map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>

                    <select
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={filterPM}
                        onChange={(e) => setFilterPM(e.target.value)}
                    >
                        <option value="All">Todos los PMs</option>
                        {pms.filter(p => p !== 'All').map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>

                    <select
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">Todos los estados</option>
                        {statuses.filter(s => s !== 'All').map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const next = !isEditingMode;
                            setIsEditingMode(next);
                            if (!next) {
                                setEditModal(null);
                                setDeleteModal(null);
                            }
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border ${isEditingMode ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Edit2 size={16} /> {isEditingMode ? 'Salir de edición' : 'Modo edición'}
                    </button>
                    <button
                        onClick={() => setCompactView(!compactView)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    >
                        {compactView ? 'Vista tabla' : 'Vista compacta'}
                    </button>
                    {isEditingMode && (
                        <button
                            onClick={() => openEdit(null)}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                            <Plus size={16} /> Añadir proyecto
                        </button>
                    )}
                </div>
            </div>

            {/* Views */}
            {!compactView && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider"></th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bloque</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Horas</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">F.Inicio</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">F.Fin</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">% progreso real</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">% Estimado</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Facturado</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">PM.GDI</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">PM.SCA</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredProjects.map((project) => {
                                    const theo = calcTheoreticalProgress(project.start, project.end);
                                    const delayed = theo !== null && project.progress < theo;
                                    const alertRow = delayed ? 'bg-red-50' : '';
                                    const alertLeft = delayed ? 'border-l-4 border-red-300' : '';
                                    return (
                                        <tr key={project.id} className={`${alertRow} hover:bg-slate-50 transition-colors`}>
                                            <td className={`px-6 py-4 text-sm text-slate-500 ${alertLeft}`}>
                                                <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openInfo(project)}
                                                    className="text-slate-400 hover:text-slate-700"
                                                    title="Ver detalles"
                                                >
                                                    <Info size={16} />
                                                </button>
                                                {isEditingMode && (
                                                    <>
                                                        <button
                                                            onClick={() => openEdit(project)}
                                                            className="text-blue-500 hover:text-blue-700"
                                                            title="Editar proyecto"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteModal(project)}
                                                            className="text-red-400 hover:text-red-600"
                                                            title="Eliminar proyecto"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 text-sm ${delayed ? 'text-red-700' : 'text-slate-600'}`}>{project.block || 'N/A'}</td>
                                        <td className={`px-6 py-4 ${delayed ? 'text-red-700' : 'text-slate-600'}`}>
                                            <div className="text-sm font-medium text-slate-900">{project.name}</div>
                                            <div className="text-xs text-slate-500">{project.type}</div>
                                        </td>
                                        <td className={`px-6 py-4 text-sm ${delayed ? 'text-red-700' : 'text-slate-600'}`}>{project.hours ?? 'N/A'}</td>
                                        <td className={`px-6 py-4 text-sm ${delayed ? 'text-red-700' : 'text-slate-600'}`}>{formatDate(project.start)}</td>
                                        <td className={`px-6 py-4 text-sm ${delayed ? 'text-red-700' : 'text-slate-600'}`}>{formatDate(project.end)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <ProgressBar progress={project.progress} />
                                                <span className="text-xs text-slate-500 w-8 text-right">{Math.round(project.progress * 100)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const theo = calcTheoreticalProgress(project.start, project.end);
                                                if (theo === null) return <span className="text-xs text-slate-400">N/A</span>;
                                                return (
                                                    <div className="flex items-center space-x-2">
                                                        <ProgressBar progress={theo} />
                                                        <span className="text-xs text-slate-500 w-8 text-right">{Math.round(theo * 100)}%</span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{project.facturado ?? 'N/A'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{project.pm_gdi}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">{project.pm_sca}</td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={project.status} />
                                        </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredProjects.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No se encontraron proyectos que coincidan con los filtros.
                        </div>
                    )}
                </div>
            )}

            {compactView && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredProjects.map(project => {
                        const theo = calcTheoreticalProgress(project.start, project.end);
                        const delayed = theo !== null && project.progress < theo;
                        return (
                            <div
                                key={project.id}
                                className={`rounded-xl shadow-sm p-4 space-y-3 border ${delayed ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase text-slate-400 font-semibold">{project.block || 'N/A'}</p>
                                        <h3 className="text-lg font-bold text-slate-800 leading-snug">{project.name}</h3>
                                        <p className="text-xs text-slate-500">{project.type}</p>
                                    </div>
                                    <button
                                        onClick={() => openInfo(project)}
                                        className="text-slate-400 hover:text-slate-700"
                                        title="Ver detalles"
                                    >
                                        <Info size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                                    <div>
                                        <p className="text-slate-400">F. Inicio</p>
                                        <p className="font-semibold text-slate-800">{formatDate(project.start)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">F. Fin</p>
                                        <p className="font-semibold text-slate-800">{formatDate(project.end)}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Horas</p>
                                        <p className="font-semibold text-slate-800">{project.hours ?? 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Facturado</p>
                                        <p className="font-semibold text-slate-800">{project.facturado ?? 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">PM GDI</p>
                                        <p className="font-semibold text-slate-800 truncate">{project.pm_gdi}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">PM SCA</p>
                                        <p className="font-semibold text-slate-800 truncate">{project.pm_sca}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>% Progreso real</span>
                                        <span className="font-semibold text-slate-800">{Math.round(project.progress * 100)}%</span>
                                    </div>
                                    <ProgressBar progress={project.progress} />
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>% Estimado</span>
                                        <span className="font-semibold text-slate-800">
                                            {theo === null ? 'N/A' : `${Math.round(theo * 100)}%`}
                                        </span>
                                    </div>
                                    <ProgressBar progress={theo || 0} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <StatusBadge status={project.status} />
                                    {isEditingMode && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openEdit(project)}
                                                className="text-blue-500 hover:text-blue-700 text-xs"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal(project)}
                                                className="text-red-500 hover:text-red-700 text-xs"
                                            >
                                                Borrar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {filteredProjects.length === 0 && (
                        <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-500">
                            No se encontraron proyectos que coincidan con los filtros.
                        </div>
                    )}
                </div>
            )}

            {/* Info modal */}
            {infoModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Detalle del proyecto</h3>
                                <p className="text-sm text-slate-500">{infoModal.name}</p>
                            </div>
                            <button onClick={() => setInfoModal(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="text-slate-500">Código Pedido:</span> <span className="font-medium text-slate-800">{infoModal.code || 'N/A'}</span></div>
                            <div><span className="text-slate-500">BP Real:</span> <span className="font-medium text-slate-800">{infoModal.bp_real ?? 'N/A'}</span></div>
                            <div><span className="text-slate-500">BP Aprobado:</span> <span className="font-medium text-slate-800">{infoModal.bp_estimado ?? 'N/A'}</span></div>
                            <div><span className="text-slate-500">Cierre de proyecto:</span> <span className="font-medium text-slate-800">{infoModal.doc_cierre ? 'Definido' : 'No definido'}</span></div>
                        </div>
                        <div className="space-y-2">
                            {[
                                ['Enlace', infoModal.link],
                                ['Documento técnico', infoModal.doc_tecnico],
                                ['Documento funcional', infoModal.doc_funcional],
                                ['Cierre de proyecto', infoModal.doc_cierre],
                            ].map(([label, url]) => (
                                <div key={label} className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2">
                                    <span className="text-sm text-slate-700">{label}</span>
                                    {url ? (
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                                        >
                                            Abrir
                                        </a>
                                    ) : (
                                        <span className="text-xs text-slate-400">No definido</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {isEditingMode && editModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">{editModal?.id ? 'Editar proyecto' : 'Nuevo proyecto'}</h3>
                            <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="Código Pedido" value={editModal.code} onChange={e => setEditModal({ ...editModal, code: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="Nombre" value={editModal.name} onChange={e => setEditModal({ ...editModal, name: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="Bloque" value={editModal.block} onChange={e => setEditModal({ ...editModal, block: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="Horas" value={editModal.hours} onChange={e => setEditModal({ ...editModal, hours: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="F. Inicio" value={editModal.start} onChange={e => setEditModal({ ...editModal, start: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="F. Fin" value={editModal.end} onChange={e => setEditModal({ ...editModal, end: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="% Progreso real" type="number" min={0} max={100} value={editModal.progress} onChange={e => setEditModal({ ...editModal, progress: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="PM GDI" value={editModal.pm_gdi} onChange={e => setEditModal({ ...editModal, pm_gdi: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="PM SCA" value={editModal.pm_sca} onChange={e => setEditModal({ ...editModal, pm_sca: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="Estado" value={editModal.status} onChange={e => setEditModal({ ...editModal, status: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="BP Real" value={editModal.bp_real} onChange={e => setEditModal({ ...editModal, bp_real: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="BP Aprobado" value={editModal.bp_estimado} onChange={e => setEditModal({ ...editModal, bp_estimado: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="Facturado" value={editModal.facturado} onChange={e => setEditModal({ ...editModal, facturado: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="Enlace" value={editModal.link} onChange={e => setEditModal({ ...editModal, link: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="Documento técnico" value={editModal.doc_tecnico} onChange={e => setEditModal({ ...editModal, doc_tecnico: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="Documento funcional" value={editModal.doc_funcional} onChange={e => setEditModal({ ...editModal, doc_funcional: e.target.value })} />
                            <input className="border border-slate-200 rounded-md px-3 py-2" placeholder="Cierre de proyecto" value={editModal.doc_cierre} onChange={e => setEditModal({ ...editModal, doc_cierre: e.target.value })} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditModal(null)} className="px-3 py-2 text-sm border border-slate-200 rounded-md">Cancelar</button>
                            <button onClick={saveProject} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {isEditingMode && deleteModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-5 space-y-3">
                        <h3 className="text-lg font-bold text-slate-800">Eliminar proyecto</h3>
                        <p className="text-sm text-slate-600">¿Seguro que deseas eliminar {deleteModal.name}?</p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteModal(null)} className="px-3 py-2 text-sm border border-slate-200 rounded-md">Cancelar</button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
