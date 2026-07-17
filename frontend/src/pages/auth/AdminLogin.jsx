import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { login, clearAuthError } from '../../features/auth/authSlice';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      const user = result.payload.user;
      if (user.role !== 'admin') {
        toast.error('This portal is for admins only. Please use the regular login.');
        // log them out locally
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        dispatch({ type: 'auth/logout/fulfilled' });
        return;
      }
      toast.success(`Welcome, ${user.name}!`);
      navigate('/admin/monitoring', { replace: true });
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <h2 className="font-display text-2xl font-semibold text-ink-900">Admin Portal</h2>
      </div>
      <p className="text-sm text-ink-400 mb-6">Restricted access — administrators only</p>

      <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        ⚠️ This login is for system administrators only.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Admin Email</label>
          <input type="email" required className="input" placeholder="admin@company.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} required className="input pr-10"
              placeholder="••••••••" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <button type="submit" disabled={status === 'loading'}
          className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-60">
          {status === 'loading' ? 'Signing in…' : 'Sign in as Admin'}
        </button>
      </form>

      <p className="text-sm text-ink-400 text-center mt-6">
        Not an admin?{' '}
        <Link to="/login" className="text-signal-500 font-medium hover:underline">User login</Link>
      </p>

      <div className="mt-6 rounded-lg bg-ink-50 border border-ink-100 p-3 text-xs text-ink-400">
        <strong className="text-ink-600">Demo admin:</strong> admin@pms.local / Admin@123
      </div>
    </div>
  );
}
