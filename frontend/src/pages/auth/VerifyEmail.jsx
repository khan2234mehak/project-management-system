import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '../../utils/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Verification token missing.');
      return;
    }
    api
      .get('/auth/verify-email', { params: { token } })
      .then((res) => {
        setState('success');
        setMessage(res.data.message);
      })
      .catch((err) => {
        setState('error');
        setMessage(err.response?.data?.message || 'Verification failed.');
      });
  }, [token]);

  return (
    <div className="text-center">
      {state === 'loading' && <Loader2 className="mx-auto mb-4 animate-spin text-signal-500" size={36} />}
      {state === 'success' && <CheckCircle2 className="mx-auto mb-4 text-green-500" size={36} />}
      {state === 'error' && <XCircle className="mx-auto mb-4 text-priority-critical" size={36} />}

      <h2 className="font-display text-xl font-semibold text-ink-900 mb-2">
        {state === 'loading' ? 'Verifying your email…' : state === 'success' ? 'Email verified!' : 'Verification failed'}
      </h2>
      <p className="text-sm text-ink-400 mb-6">{message}</p>

      <Link to="/login" className="btn-primary inline-flex">Go to sign in</Link>
    </div>
  );
}
