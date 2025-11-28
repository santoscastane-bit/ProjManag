import React from 'react';
import { Network } from 'lucide-react';

const columns = [
    'General',
    'Mantenimiento',
    'ASyB',
    'Pieza registro pos.global / servicios digitales',
    'WEB/app',
    'Squads',
    'Autos'
];

const rows = [
    {
        title: 'Res. de cuenta / SDM',
        color: 'bg-slate-100',
        cells: {
            General: ['Rubén Muñoz', 'Paz Garcia Garrido'],
        },
    },
    {
        title: 'Project Manager',
        color: 'bg-blue-50',
        cells: {
            Mantenimiento: ['Javier Bolaños Martín'],
            ASyB: ['Yasmina Ben-Marzouk Hidalgo', 'Santos Castañé Rodríguez', 'Paz Garcia Garrido'],
            'Pieza registro pos.global / servicios digitales': ['Gigi Marin'],
            'WEB/app': ['Gigi Marin'],
            Squads: ['Gigi Marin'],
            Autos: ['Gigi Marin'],
        },
    },
    {
        title: 'Equipo de Frontend',
        color: 'bg-green-50',
        cells: {
            Mantenimiento: ['Francisco José Sánchez Romero'],
            ASyB: [
                'Alejandro Exposito Gomez',
                'Marta Ocaña Martín',
                'Amanda Cuervo Sutil',
                'Jose Maria Perez Castro',
                'Manuel Ortiz Galan',
            ],
            'Pieza registro pos.global / servicios digitales': ['Ruben Montoro Morales'],
            'WEB/app': ['Carlos Arenas Carretero', 'Jonathan Morcillo'],
            Squads: ['Marina Laporte Böni'],
        },
    },
    {
        title: 'Equipo Backend',
        color: 'bg-orange-50',
        cells: {
            Mantenimiento: ['Victor Santos Peinado', 'Raúl Frías Vieco', 'Jorge Garcia Donate', 'Pablo Gomez Berasategui'],
            ASyB: ['William Maximo', 'Welton Cyriaco', 'Edmilson Verona', 'Lourdes Morente'],
            'WEB/app': ['Carlos Setien Cimas', 'Xavier Morillas'],
            Autos: ['Ruth Rodriguez-Manzaneque Lopez'],
        },
    },
    {
        title: 'Equipo Drupal',
        color: 'bg-rose-50',
        cells: {
            'Pieza registro pos.global / servicios digitales': ['Francisco Garde Calvo'],
            'WEB/app': ['Jaime Gonzalez Belaire'],
            Squads: ['Javier Jimenez Miranda'],
        },
    },
    {
        title: 'Diseño',
        color: 'bg-pink-50',
        cells: {
            'WEB/app': ['Ainara Fassi Sousa'],
            Squads: ['María del Mar García-Mochales Ruiz'],
        },
    },
    {
        title: 'QA',
        color: 'bg-indigo-50',
        cells: {
            'WEB/app': ['Vicent Miñana Gracia'],
        },
    },
];

const Cell = ({ items }) => {
    if (!items || items.length === 0) return <div className="min-h-[32px]"></div>;
    return (
        <div className="space-y-1">
            {items.map((name, idx) => (
                <div key={idx} className="text-sm text-slate-800 leading-tight">
                    <span className="font-semibold">{name}</span>
                </div>
            ))}
        </div>
    );
};

const OrgChart = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-slate-900 text-white">
                    <Network size={20} />
                </div>
                <div>
                    <p className="text-sm text-slate-500 uppercase">Organigrama</p>
                    <h2 className="text-2xl font-bold text-slate-800">Garaje de Ideas</h2>
                    <p className="text-sm text-slate-500">Distribución por áreas y roles</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="grid" style={{ gridTemplateColumns: `180px repeat(${columns.length}, minmax(140px, 1fr))` }}>
                    <div className="bg-slate-100 px-4 py-3 text-xs font-semibold uppercase text-slate-500">Rol</div>
                    {columns.map(col => (
                        <div key={col} className="bg-slate-100 px-4 py-3 text-xs font-semibold uppercase text-slate-500 border-l border-slate-200">
                            {col}
                        </div>
                    ))}
                </div>

                {rows.map((row) => (
                    <div
                        key={row.title}
                        className="grid border-t border-slate-200"
                        style={{ gridTemplateColumns: `180px repeat(${columns.length}, minmax(140px, 1fr))` }}
                    >
                        <div className={`${row.color} px-4 py-3 text-sm font-semibold text-slate-800 border-r border-slate-200`}>
                            {row.title}
                        </div>
                        {columns.map(col => (
                            <div
                                key={`${row.title}-${col}`}
                                className={`${row.color} px-4 py-3 border-l border-slate-200`}
                            >
                                <Cell items={row.cells[col]} />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrgChart;
