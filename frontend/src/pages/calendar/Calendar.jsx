import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FolderKanban, ListChecks } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, isSameMonth, isSameDay, addMonths, subMonths,
} from 'date-fns';
import api from '../../utils/api';
import PriorityBadge from '../../components/common/PriorityBadge';

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState({ tasks: [], projects: [] });
  const [selectedDay, setSelectedDay] = useState(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  useEffect(() => {
    api
      .get('/dashboard/calendar', {
        params: { start: format(calendarStart, 'yyyy-MM-dd'), end: format(calendarEnd, 'yyyy-MM-dd') },
      })
      .then((res) => setEvents(res.data.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]);

  const eventsByDay = useMemo(() => {
    const map = {};
    events.tasks.forEach((t) => {
      if (!t.date) return;
      const key = t.date;
      map[key] = map[key] || [];
      map[key].push({ ...t, kind: 'task' });
    });
    events.projects.forEach((p) => {
      if (!p.date) return;
      const key = p.date;
      map[key] = map[key] || [];
      map[key].push({ ...p, kind: 'project' });
    });
    return map;
  }, [events]);

  const selectedEvents = selectedDay ? eventsByDay[format(selectedDay, 'yyyy-MM-dd')] || [] : [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-2xl font-semibold text-ink-900 dark:text-white">Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="btn-ghost !p-2"><ChevronLeft size={16} /></button>
          <span className="font-medium text-ink-700 dark:text-ink-100 w-32 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="btn-ghost !p-2"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 card p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-400 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay[key] || [];
              const inMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDay && isSameDay(day, selectedDay);

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[72px] rounded-lg p-1.5 text-left flex flex-col gap-1 border transition-colors ${
                    isSelected ? 'border-signal-500 bg-signal-100/40' : 'border-transparent hover:bg-ink-50 dark:hover:bg-ink-700/50'
                  } ${!inMonth ? 'opacity-30' : ''}`}
                >
                  <span className={`text-xs font-medium ${isToday ? 'h-5 w-5 flex items-center justify-center rounded-full bg-signal-500 text-white' : 'text-ink-500 dark:text-ink-300'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex flex-wrap gap-0.5">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <span key={i} className={`h-1.5 w-1.5 rounded-full ${e.kind === 'task' ? 'bg-signal-500' : 'bg-blue-500'}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-display font-semibold text-sm text-ink-800 dark:text-white mb-3">
            {selectedDay ? format(selectedDay, 'MMMM d, yyyy') : 'Select a day'}
          </h3>
          {selectedDay && selectedEvents.length === 0 && <p className="text-sm text-ink-300">No deadlines on this day.</p>}
          <ul className="space-y-2">
            {selectedEvents.map((e, i) => (
              <li key={i} className="rounded-lg border border-ink-100 dark:border-ink-700 p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  {e.kind === 'task' ? <ListChecks size={13} className="text-signal-500" /> : <FolderKanban size={13} className="text-blue-500" />}
                  <span className="text-xs font-medium text-ink-400 uppercase">{e.kind}</span>
                </div>
                <p className="text-sm text-ink-700 dark:text-ink-100">{e.title}</p>
                {e.kind === 'task' && e.priority && <PriorityBadge priority={e.priority} className="mt-1" />}
                {e.kind === 'task' && e.project_name && <p className="text-xs text-ink-400 mt-1">{e.project_name}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
