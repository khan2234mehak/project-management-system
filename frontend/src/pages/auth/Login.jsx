import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { login, clearAuthError } from '../../features/auth/authSlice';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useSelector((state) => state.auth);

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">Welcome back</h2>
      <p className="text-sm text-ink-400 mb-6">Sign in to your Pulseboard workspace</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" required className="input" placeholder="you@company.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label !mb-0">Password</label>
            <Link to="/forgot-password" className="text-xs text-signal-500 hover:underline">Forgot password?</Link>
          </div>
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

        <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-ink-400 text-center mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-signal-500 font-medium hover:underline">Create one</Link>
      </p>

      <div className="mt-4 text-center">
        <Link to="/admin/login" className="text-xs text-ink-400 hover:text-ink-600 underline">
          Admin login →
        </Link>
      </div>
    </div>
  );
}
