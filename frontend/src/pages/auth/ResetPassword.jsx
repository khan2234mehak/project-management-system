import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resetPassword } from '../../features/auth/authSlice';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(resetPassword({ token, newPassword: password }));
    if (resetPassword.fulfilled.match(result)) {
      toast.success('Password reset! Please sign in.');
      navigate('/login');
    }
  };

  if (!token) {
    return (
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink-900 mb-2">Invalid link</h2>
        <p className="text-sm text-ink-400">This password reset link is missing or invalid.</p>
        <Link to="/forgot-password" className="text-signal-500 text-sm font-medium hover:underline mt-6 inline-block">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">Set a new password</h2>
      <p className="text-sm text-ink-400 mb-6">Choose a strong password for your account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">New password</label>
          <input
            type="password"
            required
            minLength={8}
            className="input"
            placeholder="At least 8 characters, 1 number"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-priority-critical">{error}</p>}

        <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
          {status === 'loading' ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
