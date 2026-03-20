import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, isAuthenticated } from '@/lib/auth';

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  }, [email, password, navigate]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div
          className="rounded-[28px] p-[24px]"
          style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
          }}
        >
          <h1
            className="text-[24px] font-semibold text-center mb-[8px]"
            style={{ color: '#1A1A1A', fontFamily: "'Poppins', system-ui, sans-serif" }}
          >
            Panel de Administración
          </h1>
          <p
            className="text-[14px] text-center mb-[24px]"
            style={{ color: '#757474', fontFamily: "'Poppins', system-ui, sans-serif" }}
          >
            Ingresá tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[16px]">
            <div>
              <label
                className="block text-[13px] font-medium mb-[6px]"
                style={{ color: '#484848', fontFamily: "'Poppins', system-ui, sans-serif" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-[44px] px-[14px] rounded-[12px] text-[14px] outline-none transition-colors"
                style={{
                  background: '#F0F0F0',
                  border: '1px solid #E0E0E0',
                  color: '#1A1A1A',
                  fontFamily: "'Poppins', system-ui, sans-serif",
                }}
                placeholder="admin@proyecto.com"
              />
            </div>

            <div>
              <label
                className="block text-[13px] font-medium mb-[6px]"
                style={{ color: '#484848', fontFamily: "'Poppins', system-ui, sans-serif" }}
              >
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-[44px] px-[14px] rounded-[12px] text-[14px] outline-none transition-colors"
                style={{
                  background: '#F0F0F0',
                  border: '1px solid #E0E0E0',
                  color: '#1A1A1A',
                  fontFamily: "'Poppins', system-ui, sans-serif",
                }}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-[13px] text-red-500 text-center" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[44px] rounded-[69px] text-[16px] font-medium transition-opacity hover:opacity-90 outline-none disabled:opacity-50"
              style={{
                background: '#1A1A1A',
                color: '#FFFFFF',
                fontFamily: "'Poppins', system-ui, sans-serif",
              }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
