import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, Phone } from 'lucide-react';
import { apiClient } from '../App';
import { toast } from 'sonner';

const AuthModal = ({ mode, setMode, onClose, setAuth, setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await apiClient.post('/auth/login', { email, password });
        localStorage.setItem('token', response.data.token);
        setAuth(true);
        setUser(response.data.user);
        toast.success('Welcome back!');
        onClose();
      } else {
        const response = await apiClient.post('/auth/register', { email, password, name, phone });
        localStorage.setItem('token', response.data.token);
        setAuth(true);
        setUser(response.data.user);
        toast.success('Account created successfully!');
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md glass p-8"
        data-testid="auth-modal"
      >
        <button
          data-testid="auth-modal-close"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A3A3A3] hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-['Syne'] font-bold mb-2">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-[#A3A3A3] mb-8">
          {mode === 'login' ? 'Sign in to book your appointment' : 'Join us to get started'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm mb-2">Name</label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                  <input
                    data-testid="auth-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-neutral-950 border border-white/10 focus:border-white/30 text-white placeholder:text-neutral-600 h-12 pl-11 pr-4 outline-none transition-colors"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Phone (Optional)</label>
                <div className="relative">
                  <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                  <input
                    data-testid="auth-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-white/10 focus:border-white/30 text-white placeholder:text-neutral-600 h-12 pl-11 pr-4 outline-none transition-colors"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm mb-2">Email</label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                data-testid="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-neutral-950 border border-white/10 focus:border-white/30 text-white placeholder:text-neutral-600 h-12 pl-11 pr-4 outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">Password</label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                data-testid="auth-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-neutral-950 border border-white/10 focus:border-white/30 text-white placeholder:text-neutral-600 h-12 pl-11 pr-4 outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            data-testid="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black px-8 py-4 font-bold tracking-widest text-sm hover:bg-gray-200 transition-all duration-300 hover:tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'PROCESSING...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            data-testid="auth-toggle-mode"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="text-sm text-[#A3A3A3] hover:text-white transition-colors"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;