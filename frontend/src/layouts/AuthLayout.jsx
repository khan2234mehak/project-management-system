import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-ink-50">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-signal-500/10" />
        <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-signal-500/10" />
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="h-9 w-9 rounded-lg bg-signal-500 flex items-center justify-center font-display font-bold">P</div>
          <span className="font-display font-semibold text-xl tracking-tight">Pulseboard</span>
        </Link>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-3xl font-semibold leading-tight mb-4">
            Plan the work. Track the progress. Ship with confidence.
          </h1>
          <p className="text-ink-300 text-sm leading-relaxed">
            Projects, teams, Kanban boards, and real-time collaboration — all
            in one enterprise-ready workspace.
          </p>
        </div>
        <p className="relative z-10 text-xs text-ink-400">© {new Date().getFullYear()} Pulseboard. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
