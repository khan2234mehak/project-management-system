import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../features/auth/authSlice';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const dispatch = useDispatch();
  const { status } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(forgotPassword(email));
    setSent(true);
  };

  if (sent) {
    return (
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink-900 mb-2">Check your email</h2>
        <p className="text-sm text-ink-400">
          If an account exists for <strong>{email}</strong>, we've sent a password reset link.
        </p>
        <Link to="/login" className="text-signal-500 text-sm font-medium hover:underline mt-6 inline-block">
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">Reset your password</h2>
      <p className="text-sm text-ink-400 mb-6">We'll email you a link to reset it</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            className="input"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
          {status === 'loading' ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <Link to="/login" className="text-signal-500 text-sm font-medium hover:underline mt-6 inline-block">
        ← Back to sign in
      </Link>
    </div>
  );
}
