import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { register, clearAuthError } from '../../features/auth/authSlice';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordError('');
    const result = await dispatch(register({ name: form.name, email: form.email, password: form.password }));
    if (register.fulfilled.match(result)) {
      toast.success('Account created! You can now log in.');
      navigate('/login');
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">Create your account</h2>
      <p className="text-sm text-ink-400 mb-6">Start managing projects in minutes</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full name</label>
          <input required className="input" placeholder="Jane Doe"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" required className="input" placeholder="you@company.com"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} required minLength={8} className="input pr-10"
              placeholder="At least 8 characters"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-500">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="label">Confirm password</label>
          <input type="password" required className="input" placeholder="Re-enter your password"
            value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
        </div>

        {(error || passwordError) && (
          <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{passwordError || error}</p>
        )}

        <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
          {status === 'loading' ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-ink-400 text-center mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-signal-500 font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
