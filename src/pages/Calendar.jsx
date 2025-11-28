import React from 'react';
import { Calendar as CalendarIcon, Rocket, Snowflake, PartyPopper } from 'lucide-react';
import { useData } from '../hooks/useData';

const EventCard = ({ event }) => {
    const date = new Date(event.date);
    const isPast = date < new Date();

    let styles = {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        iconColor: 'text-slate-400',
        Icon: CalendarIcon
    };

    switch (event.type) {
        case 'Despliegue':
            styles = {
                bg: 'bg-emerald-50',
                border: 'border-emerald-200',
                iconColor: 'text-emerald-600',
                Icon: Rocket
            };
            break;
        case 'Congelacion':
            styles = {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                iconColor: 'text-blue-600',
                Icon: Snowflake
            };
            break;
        case 'Festivo':
            styles = {
                bg: 'bg-red-50',
                border: 'border-red-200',
                iconColor: 'text-red-600',
                Icon: PartyPopper
            };
            break;
        default:
            break;
    }

    if (isPast) {
        styles.bg = 'bg-slate-50';
        styles.border = 'border-slate-200';
        styles.iconColor = 'text-slate-400';
    }

    const Icon = styles.Icon;

    return (
        <div className={`
      flex items-center p-4 rounded-xl border ${styles.border} ${styles.bg} 
      transition-all hover:shadow-md
      ${isPast ? 'opacity-60 grayscale' : ''}
    `}>
            <div className={`
        flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center 
        bg-white border border-slate-100 shadow-sm mr-4
      `}>
                <div className="text-center">
                    <div className="text-xs font-bold text-slate-500 uppercase">
                        {date.toLocaleDateString('es-ES', { month: 'short' })}
                    </div>
                    <div className="text-lg font-bold text-slate-800 leading-none">
                        {date.getDate()}
                    </div>
                </div>
            </div>

            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${styles.iconColor}`}>
                        {event.type}
                    </span>
                    {isPast && <span className="text-xs font-medium text-slate-400">Finalizado</span>}
                </div>
                <h3 className="font-bold text-slate-800">{event.desc}</h3>
                <p className="text-sm text-slate-500">
                    {date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            <div className={`p-2 rounded-full bg-white/50 ${styles.iconColor}`}>
                <Icon size={20} />
            </div>
        </div>
    );
};

const Calendar = () => {
    const { deployments: DEPLOYMENTS, loading } = useData();

    if (loading) {
        return <div className="p-8 flex justify-center text-slate-500">Loading calendar events...</div>;
    }

    const sortedEvents = [...DEPLOYMENTS].sort((a, b) => new Date(a.date) - new Date(b.date));
    const upcomingEvents = sortedEvents.filter(e => new Date(e.date) >= new Date());
    const pastEvents = sortedEvents.filter(e => new Date(e.date) < new Date()).reverse();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Próximos Eventos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upcomingEvents.map((event, index) => (
                        <EventCard key={index} event={event} />
                    ))}
                    {upcomingEvents.length === 0 && (
                        <p className="text-slate-500 col-span-full">No hay eventos próximos.</p>
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-slate-600 mb-4">Historial</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pastEvents.map((event, index) => (
                        <EventCard key={index} event={event} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
