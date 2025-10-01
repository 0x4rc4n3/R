// ============================================
// FILE: frontend/src/components/auth/RegisterForm.jsx - EXTREME MINIFIED
// ============================================
import R, { useState as uS } from 'react';
import { Link as L, useNavigate as uN } from 'react-router-dom';
import { useAuth as uA } from '../../hooks/useAuth';
import { ChefHat as CH, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import t from 'react-hot-toast'; // Renamed toast to 't' for minification

const RegisterForm = () => {
  const [data, setData] = uS({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dietaryPreferences: []
  });
  const [sP, setSP] = uS(false); // showPassword
  const [sCP, setSCP] = uS(false); // showConfirmPassword
  const [loading, setLoading] = uS(false);
  const [errors, setErrors] = uS({});

  const { register } = uA();
  const nav = uN(); // navigate

  const opts = [ // dietaryOptions
    'vegetarian', 'vegan', 'keto', 'gluten-free', 
    'dairy-free', 'paleo', 'low-carb', 'pescatarian'
  ];

  const hC = (e) => { // handleChange
    const { name, value } = e.target;
    setData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
  };

  const hDC = (o) => { // handleDietaryChange
    setData(p => ({
      ...p,
      dietaryPreferences: p.dietaryPreferences.includes(o)
        ? p.dietaryPreferences.filter(i => i !== o)
        : [...p.dietaryPreferences, o]
    }));
  };

  const vF = () => { // validateForm
    const e = {}; // newErrors

    if (!data.username.trim()) e.username = 'Username is required';
    else if (data.username.length < 3) e.username = 'Username must be at least 3 characters';

    if (!data.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.email)) e.email = 'Email is invalid';

    if (!data.password) e.password = 'Password is required';
    else if (data.password.length < 6) e.password = 'Password must be at least 6 characters';

    if (data.password !== data.confirmPassword) e.confirmPassword = 'Passwords do not match';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const hS = async (e) => { // handleSubmit
    e.preventDefault();
    if (!vF()) return;

    setLoading(true);
    try {
      const res = await register({
        username: data.username,
        email: data.email,
        password: data.password,
        dietaryPreferences: data.dietaryPreferences
      });

      if (res.success) {
        t.success('Registration successful!');
        nav('/');
      } else {
        t.error(res.error || 'Registration failed');
      }
    } catch (err) {
      t.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Icon for password visibility toggle
  const T = (s, setS) => (
    <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setS(!s)}>
      {s ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
    </button>
  );

  // Input component helper for re-use and clarity
  const I = ({ id, name, type, icon: Icon, placeholder, showToggle, toggleState, setToggleState }) => (
    <div>
      <label htmlFor={id} className="form-label capitalize">{id.replace(/([A-Z])/g, ' $1').trim()}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          id={id}
          name={name}
          type={type === 'password' && toggleState ? 'text' : type}
          required
          value={data[name]}
          onChange={hC}
          className={`form-input pl-10 ${showToggle ? 'pr-10' : ''} ${errors[name] ? 'border-red-500' : ''}`}
          placeholder={`     ${placeholder}`}
        />
        {showToggle && T(toggleState, setToggleState)}
      </div>
      {errors[name] && <p className="form-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-pink-50 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-orange-500 rounded-full">
              <CH className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Join Smart Recipe Hub
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Start your culinary journey today
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <form className="space-y-6" onSubmit={hS}>
            <I id="username" name="username" type="text" icon={User} placeholder="Choose a username" />
            <I id="email" name="email" type="email" icon={Mail} placeholder="Enter your email" />
            <I id="password" name="password" type="password" icon={Lock} placeholder="Create a password" showToggle toggleState={sP} setToggleState={setSP} />
            <I id="confirmPassword" name="confirmPassword" type="password" icon={Lock} placeholder="Confirm your password" showToggle toggleState={sCP} setToggleState={setSCP} />

            <div>
              <label className="form-label">Dietary Preferences (Optional)</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {opts.map(o => (
                  <label key={o} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.dietaryPreferences.includes(o)}
                      onChange={() => hDC(o)}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{o}</span>
                  </label>
                ))}
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
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <L to="/login" className="font-medium text-orange-600 hover:text-orange-500">
                  Sign in here
                </L>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;