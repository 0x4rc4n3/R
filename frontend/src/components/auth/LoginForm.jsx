// ============================================
// FILE: frontend/src/components/auth/LoginForm.jsx - EXTREME MINIFIED
// ============================================
import R, { useState as uS } from 'react';
import { Link as L, useNavigate as uN } from 'react-router-dom';
import { useAuth as uA } from '../../hooks/useAuth';
import { ChefHat as CH, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import t from 'react-hot-toast'; // Renamed toast to 't'

const LoginForm = () => {
  const [data, setData] = uS({ email: '', password: '' });
  const [sP, setSP] = uS(false); // showPassword
  const [loading, setLoading] = uS(false);
  const [errors, setErrors] = uS({});

  const { login } = uA();
  const nav = uN(); // navigate

  // console.log('🖼️ LoginForm rendered'); // Removed debug logs for minification

  const hC = (e) => { // handleChange
    const { name, value } = e.target;
    setData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const vF = () => { // validateForm
    const e = {}; // newErrors

    if (!data.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.email)) e.email = 'Email is invalid';

    if (!data.password) e.password = 'Password is required';
    else if (data.password.length < 6) e.password = 'Password must be at least 6 characters';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const hS = async (e) => { // handleSubmit
    e.preventDefault();
    if (!vF()) return;

    setLoading(true);
    try {
      const res = await login(data.email, data.password);
      
      if (res.success) {
        t.success('Login successful!');
        nav('/');
      } else {
        t.error(res.error || 'Login failed');
        
        const err = res.error.toLowerCase();
        if (err.includes('email')) setErrors({ email: res.error });
        else if (err.includes('password')) setErrors({ password: res.error });
      }
    } catch (err) {
      t.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Icon for password visibility toggle
  const T = () => (
    <button
      type="button"
      className="absolute inset-y-0 right-0 pr-3 flex items-center"
      onClick={() => setSP(!sP)}
    >
      {sP ? (
        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
      ) : (
        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
      )}
    </button>
  );

  // Input component helper for re-use and clarity
  const I = ({ id, type, icon: Icon, placeholder, auto }) => (
    <div>
      <label htmlFor={id} className="form-label capitalize">{id.replace(/([A-Z])/g, ' $1').trim()}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id={id}
          name={id}
          type={id === 'password' ? (sP ? 'text' : 'password') : type}
          autoComplete={auto}
          required
          value={data[id]}
          onChange={hC}
          className={`form-input pl-10 ${id === 'password' ? 'pr-10' : ''} ${errors[id] ? 'border-red-500 focus:ring-red-500' : ''}`}
          placeholder={placeholder}
        />
        {id === 'password' && T()}
      </div>
      {errors[id] && <p className="form-error">{errors[id]}</p>}
    </div>
  );


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-orange-500 rounded-full">
              <CH className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Welcome back!
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your Smart Recipe Hub account
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form className="space-y-6" onSubmit={hS}>
            <I id="email" type="email" icon={Mail} placeholder="Enter your email" auto="email" />
            <I id="password" type="password" icon={Lock} placeholder="Enter your password" auto="current-password" />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <L to="/forgot-password" className="font-medium text-orange-600 hover:text-orange-500">
                  Forgot password?
                </L>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full btn btn-primary py-3 text-base font-medium ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <L to="/register" className="font-medium text-orange-600 hover:text-orange-500">
                  Sign up here
                </L>
              </p>
            </div>
          </form>
        </div>

        {/* Debug Info (Minified - but kept for completeness as it was in the source) */}
        <div className="bg-gray-100 p-4 rounded-lg text-xs">
          <p className="font-bold mb-2">D:</p>
          <p>E: {data.email || '(e)'}</p>
          <p>P: {data.password ? '●'.repeat(data.password.length) : '(e)'}</p>
          <p>L: {loading ? 'Y' : 'N'}</p>
          <p>E: {JSON.stringify(errors)}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;