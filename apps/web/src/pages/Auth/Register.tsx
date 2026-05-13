import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import './Auth.css';

export const Register = () => {
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'consumer' as 'consumer' | 'merchant' | 'courier',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        role: form.role,
        profile: {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        },
      });
      if (form.role === 'merchant') {
        toast.success('Restaurant account created! Set up your restaurant now.');
        navigate('/dashboard');
      } else if (form.role === 'courier') {
        toast.success('Courier account created! Head to your dashboard.');
        navigate('/dashboard');
      } else {
        toast.success('Account created! Welcome!');
        navigate('/discover');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join FoodHub and start ordering</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="input-group">
              <label htmlFor="firstName">First Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input id="firstName" type="text" className="input" placeholder="John" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="lastName">Last Name</label>
              <input id="lastName" type="text" className="input" placeholder="Doe" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="reg-email">Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input id="reg-email" type="email" className="input" placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} required />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="phone">Phone</label>
            <div className="input-with-icon">
              <Phone size={18} className="input-icon" />
              <input id="phone" type="tel" className="input" placeholder="9876543210" value={form.phone} onChange={(e) => update('phone', e.target.value)} required minLength={10} />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="reg-password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input id="reg-password" type="password" className="input" placeholder="Min 8 characters" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={8} />
            </div>
          </div>

          <div className="input-group">
            <label>I am a</label>
            <div className="role-selector">
              {(['consumer', 'merchant', 'courier'] as const).map((role) => (
                <button key={role} type="button" className={`role-btn ${form.role === role ? 'active' : ''}`} onClick={() => update('role', role)}>
                  {role === 'consumer' ? '🍽️ Customer' : role === 'merchant' ? '🏪 Restaurant' : '🚴 Courier'}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
            {loading ? <Loader2 size={20} className="spin" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
