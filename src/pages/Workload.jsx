import React, { useMemo } from 'react';
import { useData } from '../hooks/useData';
import { Filter, ChevronDown, ChevronRight, Edit2, Plus, Trash2, X } from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

const WorkloadCell = ({ load, projects, onEdit }) => {
    let bgColor = 'bg-slate-100';
    let textColor = 'text-slate-400';

    if (load > 0) {
        if (load > 1.1) {
            bgColor = 'bg-red-100';
            textColor = 'text-red-700';
        } else if (load >= 0.8) {
            bgColor = 'bg-green-100';
            textColor = 'text-green-700';
        } else {
            bgColor = 'bg-yellow-50';
            textColor = 'text-yellow-700';
        }
    }

    return (
        <div className={`h-full w-full flex items-center justify-center ${bgColor} transition-colors relative group border-r border-slate-100`}>
            <span className={`font-medium text-sm ${textColor}`}>
                {load > 0 ? `${Math.round(load * 100)}%` : '-'}
            </span>
            {onEdit && (
                <button
                    onClick={onEdit}
                    className="absolute top-1 right-1 text-slate-400 hover:text-slate-700 opacity-60 hover:opacity-100 focus:opacity-100 transition-opacity bg-white/60 rounded p-0.5 shadow-sm"
                    title="Editar carga"
                >
                    <Edit2 size={14} />
                </button>
            )}

            {/* Tooltip */}
            {projects && projects.length > 0 && (
                <div className="absolute opacity-0 group-hover:opacity-100 bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none transition-opacity duration-200">
                    <div className="bg-slate-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-xl">
                        {projects.map((p, i) => (
                            <div key={i} className="flex justify-between gap-4">
                                <span>{p.name}</span>
                                <span className="text-slate-400">{Math.round(p.load * 100)}%</span>
                            </div>
                        ))}
                        <div className="border-t border-slate-700 mt-1 pt-1 flex justify-between gap-4 font-bold">
                            <span>Total</span>
                            <span>{Math.round(load * 100)}%</span>
                        </div>
                    </div>
                    {/* Arrow */}
                    <div className="w-2 h-2 bg-slate-800 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                </div>
            )}
        </div>
    );
};

const Workload = () => {
    const { employees: EMPLOYEES, workload: WORKLOAD, loading, refresh } = useData();
    const [selectedYear, setSelectedYear] = React.useState(2025);
    const [selectedMonth, setSelectedMonth] = React.useState('Ene');
    const [roleFilter, setRoleFilter] = React.useState('all');
    const [expandedRows, setExpandedRows] = React.useState(new Set());
    const [editModal, setEditModal] = React.useState(null);
    const [newEmployeeModal, setNewEmployeeModal] = React.useState(false);
    const [deleteRequest, setDeleteRequest] = React.useState(null);
    const [isEditingMode, setIsEditingMode] = React.useState(false);

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const years = [2024, 2025, 2026];
    const roles = ['all', ...new Set(EMPLOYEES.map(e => e.role))];

    const toggleRow = (empId) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(empId)) {
            newExpanded.delete(empId);
        } else {
            newExpanded.add(empId);
        }
        setExpandedRows(newExpanded);
    };

    const filteredEmployees = useMemo(() => {
        return EMPLOYEES.filter(emp =>
            roleFilter === 'all' || emp.role === roleFilter
        );
    }, [EMPLOYEES, roleFilter]);

    const getWorkload = (empId, month, year) => {
        return WORKLOAD.find(w =>
            w.empId === empId &&
            w.month === month &&
            w.year === year
        );
    };

    const openEdit = (emp, month) => {
        const existing = getWorkload(emp.id, month, selectedYear);
        setEditModal({
            emp,
            month,
            projects: existing?.projects?.map(p => ({ name: p.name, load: Math.round((p.load || 0) * 100) })) || [{ name: '', load: 0 }],
        });
    };

    const saveEdit = async () => {
        if (!editModal) return;
        const { emp, month, projects } = editModal;
        const cleanProjects = projects
            .filter(p => p.name.trim())
            .map(p => ({ name: p.name.trim(), load: Math.max(0, Math.min(100, Number(p.load))) / 100 }));
        const totalLoad = cleanProjects.reduce((sum, p) => sum + (p.load || 0), 0);
        const ref = doc(db, 'workload', `${emp.id}-${month}-${selectedYear}`);
        await setDoc(ref, {
            empId: emp.id,
            month,
            year: selectedYear,
            load: Number(totalLoad.toFixed(3)),
            projects: cleanProjects
        });
        setEditModal(null);
        refresh();
    };

    const openNewEmployee = () => {
        setNewEmployeeModal({ name: '', role: '', area: '', email: '' });
    };

    const saveEmployee = async () => {
        if (!newEmployeeModal?.name) return;
        const nextId = (EMPLOYEES.reduce((max, e) => Math.max(max, e.id), 0) || 0) + 1;
        const data = { id: nextId, ...newEmployeeModal };
        await setDoc(doc(db, 'employees', String(nextId)), data);
        setNewEmployeeModal(false);
        refresh();
    };

    const requestDelete = (emp) => setDeleteRequest(emp);

    const confirmDelete = async () => {
        if (!deleteRequest) return;
        const empId = deleteRequest.id;
        // delete workload entries for this employee
        const q = query(collection(db, 'workload'), where('empId', '==', empId));
        const snap = await getDocs(q);
        const deletions = snap.docs.map(d => deleteDoc(d.ref));
        await Promise.all(deletions);
        await deleteDoc(doc(db, 'employees', String(empId)));
        setDeleteRequest(null);
        refresh();
    };

    if (loading) {
        return <div className="p-8 flex justify-center text-slate-500">Loading workload data...</div>;
    }

    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header Controls */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-bold text-slate-800">Cargabilidad</h2>

                    <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-transparent text-sm font-medium text-slate-700 border-none focus:ring-0 cursor-pointer"
                        >
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <div className="w-px h-4 bg-slate-300"></div>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-sm font-medium text-slate-700 border-none focus:ring-0 cursor-pointer"
                        >
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-white border border-slate-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {roles.map(r => (
                                <option key={r} value={r}>
                                    {r === 'all' ? 'Todos los roles' : r}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            const next = !isEditingMode;
                            setIsEditingMode(next);
                            if (!next) {
                                setEditModal(null);
                                setNewEmployeeModal(false);
                                setDeleteRequest(null);
                            }
                        }}
                        className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border ${isEditingMode ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Edit2 size={16} /> {isEditingMode ? 'Salir de edición' : 'Activar edición'}
                    </button>
                    {isEditingMode && (
                        <button
                            onClick={openNewEmployee}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                            <Plus size={16} /> Añadir persona
                        </button>
                    )}
                </div>
            </div>

            {/* Matrix */}
            <div className="flex-1 overflow-auto relative">
                <table className="w-full border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
                        <tr>
                            <th className="p-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50 z-30 border-b border-r border-slate-200 w-64 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                                Empleado
                            </th>
                            {months.map(month => (
                                <th key={month} className={`p-3 text-center text-xs font-semibold uppercase tracking-wider border-b border-r border-slate-200 min-w-[80px] ${month === selectedMonth ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>
                                    {month}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredEmployees.map(emp => {
                            const isExpanded = expandedRows.has(emp.id);

                            return (
                                <React.Fragment key={emp.id}>
                                    <tr className="hover:bg-slate-50 transition-colors">
                                        <td className="p-0 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                                            <div className="flex items-center p-3 h-full justify-between">
                                                <button
                                                    onClick={() => toggleRow(emp.id)}
                                                    className="mr-2 text-slate-400 hover:text-slate-600 transition-colors"
                                                >
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-slate-900 text-sm truncate">{emp.name}</div>
                                                    <div className="text-xs text-slate-500">{emp.role}</div>
                                                </div>
                                                {isEditingMode && (
                                                    <button
                                                        onClick={() => requestDelete(emp)}
                                                        className="ml-2 text-red-400 hover:text-red-600"
                                                        title="Eliminar persona"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        {months.map(month => {
                                            const data = getWorkload(emp.id, month, selectedYear);
                                            return (
                                                <td key={month} className="p-0 h-12 border-r border-slate-100">
                                                    <WorkloadCell
                                                        load={data?.load || 0}
                                                        projects={data?.projects || []}
                                                        onEdit={isEditingMode ? () => openEdit(emp, month) : undefined}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* Expanded Project Breakdown */}
                                    {isExpanded && (
                                        <tr className="bg-slate-50/50">
                                            <td className="p-0 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                                                <div className="p-2 pl-10 text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Proyectos
                                                </div>
                                            </td>
                                            <td colSpan={12} className="p-0">
                                                {/* We need to collect all unique projects for this employee across the year to list them?
                                                    Or just list projects active in this year? 
                                                    Let's iterate months and find unique projects.
                                                */}
                                                <div className="divide-y divide-slate-100">
                                                    {(() => {
                                                        // Find all projects this employee has in the selected year
                                                        const empProjects = new Set();
                                                        months.forEach(m => {
                                                            const w = getWorkload(emp.id, m, selectedYear);
                                                            w?.projects?.forEach(p => empProjects.add(p.name));
                                                        });

                                                        if (empProjects.size === 0) {
                                                            return <div className="p-3 text-xs text-slate-400 italic pl-10">Sin proyectos asignados este año</div>;
                                                        }

                                                        return Array.from(empProjects).map(projName => (
                                                            <div key={projName} className="flex">
                                                                <div className="w-64 flex-shrink-0 p-2 pl-10 text-xs text-slate-600 border-r border-slate-200 sticky left-0 bg-slate-50">
                                                                    {projName}
                                                                </div>
                                                                {months.map(m => {
                                                                    const w = getWorkload(emp.id, m, selectedYear);
                                                                    const pData = w?.projects?.find(p => p.name === projName);
                                                                    const load = pData?.load || 0;

                                                                    return (
                                                                        <div key={m} className="flex-1 min-w-[80px] border-r border-slate-100 flex items-center justify-center">
                                                                            <span className={`text-xs ${load > 0 ? 'text-slate-600 font-medium' : 'text-slate-300'}`}>
                                                                                {load > 0 ? `${Math.round(load * 100)}%` : '-'}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Edit modal */}
            {isEditingMode && editModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Editar cargabilidad</h3>
                                <p className="text-sm text-slate-500">{editModal.emp.name} · {editModal.month} {selectedYear}</p>
                            </div>
                            <button onClick={() => setEditModal(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {editModal.projects.map((p, idx) => (
                                <div key={idx} className="grid grid-cols-7 gap-2 items-center">
                                    <input
                                        className="col-span-5 border border-slate-200 rounded-md px-2 py-2 text-sm"
                                        placeholder="Proyecto"
                                        value={p.name}
                                        onChange={(e) => {
                                            const projects = [...editModal.projects];
                                            projects[idx] = { ...projects[idx], name: e.target.value };
                                            setEditModal({ ...editModal, projects });
                                        }}
                                    />
                                    <div className="col-span-2 flex items-center gap-2">
                                        <input
                                            type="number"
                                            className="w-full border border-slate-200 rounded-md px-2 py-2 text-sm"
                                            min={0}
                                            max={100}
                                            value={p.load}
                                            onChange={(e) => {
                                                const projects = [...editModal.projects];
                                                projects[idx] = { ...projects[idx], load: e.target.value };
                                                setEditModal({ ...editModal, projects });
                                            }}
                                        />
                                        <span className="text-sm text-slate-500">%</span>
                                        <button
                                            onClick={() => {
                                                const projects = editModal.projects.filter((_, i) => i !== idx);
                                                setEditModal({ ...editModal, projects: projects.length ? projects : [{ name: '', load: 0 }] });
                                            }}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setEditModal({ ...editModal, projects: [...editModal.projects, { name: '', load: 0 }] })}
                                className="inline-flex items-center gap-2 text-sm text-blue-600"
                            >
                                <Plus size={14} /> Añadir proyecto
                            </button>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <div className="text-sm text-slate-500">
                                Total asignado: {editModal.projects.reduce((sum, p) => sum + Number(p.load || 0), 0)}%
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditModal(null)} className="px-3 py-2 text-sm border border-slate-200 rounded-md">Cancelar</button>
                                <button onClick={saveEdit} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New employee modal */}
            {isEditingMode && newEmployeeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800">Añadir persona</h3>
                            <button onClick={() => setNewEmployeeModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <input
                                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                                placeholder="Nombre"
                                value={newEmployeeModal.name}
                                onChange={e => setNewEmployeeModal({ ...newEmployeeModal, name: e.target.value })}
                            />
                            <input
                                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                                placeholder="Rol"
                                value={newEmployeeModal.role}
                                onChange={e => setNewEmployeeModal({ ...newEmployeeModal, role: e.target.value })}
                            />
                            <input
                                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                                placeholder="Área"
                                value={newEmployeeModal.area}
                                onChange={e => setNewEmployeeModal({ ...newEmployeeModal, area: e.target.value })}
                            />
                            <input
                                className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
                                placeholder="Email"
                                value={newEmployeeModal.email}
                                onChange={e => setNewEmployeeModal({ ...newEmployeeModal, email: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setNewEmployeeModal(false)} className="px-3 py-2 text-sm border border-slate-200 rounded-md">Cancelar</button>
                            <button onClick={saveEmployee} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation */}
            {isEditingMode && deleteRequest && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-5 space-y-3">
                        <h3 className="text-lg font-bold text-slate-800">Eliminar persona</h3>
                        <p className="text-sm text-slate-600">
                            ¿Seguro que quieres eliminar a {deleteRequest.name}? Se borrarán también sus registros de cargabilidad.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setDeleteRequest(null)} className="px-3 py-2 text-sm border border-slate-200 rounded-md">Cancelar</button>
                            <button onClick={confirmDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workload;
