export default function StatCard({ label, value, icon: Icon, accent = 'signal', trend }) {
  const accentClasses = {
    signal: 'bg-signal-100 text-signal-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-ink-400 uppercase tracking-wide">{label}</p>
          <p className="font-display text-3xl font-semibold text-ink-900 dark:text-white mt-1.5">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${accentClasses[accent]}`}>
          <Icon size={20} />
        </div>
      </div>
      {trend && <p className="text-xs text-ink-400 mt-3">{trend}</p>}
    </div>
  );
}
