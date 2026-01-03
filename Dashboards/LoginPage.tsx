import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import { login, getAllUsers, createUser } from '../services/authService';
import { User, LogIn, Eye, EyeOff, AlertCircle, UserPlus, X, CheckCircle } from 'lucide-react';
import { validateUsername, validatePassword, validateName, validateNameStrict } from '../services/inputValidationService';

interface LoginPageProps {
  onLogin: (role: UserRole, userId: string, userName: string) => void;
  lang?: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, lang = 'en' }) => {
  // Translation helper
  const t = (en: string, or: string) => lang === 'en' ? en : or;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  
  // Sign up form state
  const [signUpData, setSignUpData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: UserRole.FARMER as UserRole,
  });
  const [signUpError, setSignUpError] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic username availability check
  useEffect(() => {
    // Clear previous timeout
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    // Only check if username is valid and has minimum length
    if (signUpData.username.length >= 3) {
      const validation = validateUsername(signUpData.username);
      if (validation.valid) {
        setCheckingUsername(true);
        // Debounce: wait 500ms after user stops typing
        usernameCheckTimeoutRef.current = setTimeout(() => {
          const allUsers = getAllUsers();
          const isTaken = allUsers.some(u => u.username.toLowerCase() === signUpData.username.toLowerCase());
          setUsernameAvailable(!isTaken);
          setCheckingUsername(false);
        }, 500);
      } else {
        setUsernameAvailable(null);
        setCheckingUsername(false);
      }
    } else {
      setUsernameAvailable(null);
      setCheckingUsername(false);
    }

    // Cleanup
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [signUpData.username]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate inputs
    const usernameValidation = validateUsername(username);
    const passwordValidation = validatePassword(password);
    
    if (!usernameValidation.valid) {
      setError(usernameValidation.error || 'Invalid username');
      return;
    }
    
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || 'Invalid password');
      return;
    }
    
    setLoading(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      const user = login(usernameValidation.sanitized, password);
      
      if (user) {
        onLogin(user.role, user.id, user.name);
      } else {
        setError('Invalid username or password. Please try again.');
        setLoading(false);
      }
    }, 300);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError('');
    setSignUpLoading(true);

    // Validate all inputs (using strict validation - letters and spaces only)
    const firstNameValidation = validateNameStrict(signUpData.firstName);
    if (!firstNameValidation.valid) {
      setSignUpError(firstNameValidation.error || t('Invalid first name. Only letters and spaces are allowed.', 'ଅବୈଧ ପ୍ରଥମ ନାମ | କେବଳ ଅକ୍ଷର ଏବଂ ସ୍ଥାନ ଅନୁମୋଦିତ |'));
      setSignUpLoading(false);
      return;
    }

    const lastNameValidation = validateNameStrict(signUpData.lastName);
    if (!lastNameValidation.valid) {
      setSignUpError(lastNameValidation.error || t('Invalid last name. Only letters and spaces are allowed.', 'ଅବୈଧ ଶେଷ ନାମ | କେବଳ ଅକ୍ଷର ଏବଂ ସ୍ଥାନ ଅନୁମୋଦିତ |'));
      setSignUpLoading(false);
      return;
    }

    // Combine first and last name
    const fullName = `${firstNameValidation.sanitized} ${lastNameValidation.sanitized}`.trim();

    const usernameValidation = validateUsername(signUpData.username);
    if (!usernameValidation.valid) {
      setSignUpError(usernameValidation.error || 'Invalid username');
      setSignUpLoading(false);
      return;
    }

    const passwordValidation = validatePassword(signUpData.password);
    if (!passwordValidation.valid) {
      setSignUpError(passwordValidation.error || 'Invalid password');
      setSignUpLoading(false);
      return;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setSignUpError(t('Passwords do not match.', 'ପାସୱାର୍ଡ୍ ମେଳ ଖାଉନାହିଁ |'));
      setSignUpLoading(false);
      return;
    }

    // Check if username already exists
    const allUsers = getAllUsers();
    if (allUsers.some(u => u.username === usernameValidation.sanitized)) {
      setSignUpError(t('Username already exists. Please choose a different one.', 'ଉପଭୋକ୍ତା ନାମ ପୂର୍ବରୁ ବ୍ୟବହୃତ | ଦୟାକରି ଏକ ଭିନ୍ନ ନାମ ବାଛନ୍ତୁ |'));
      setSignUpLoading(false);
      return;
    }

    // Create user
    setTimeout(() => {
      try {
        const newUser = createUser(
          usernameValidation.sanitized,
          signUpData.password,
          signUpData.role,
          fullName
        );

        if (newUser) {
          // Reset all signup form fields
          setSignUpData({
            username: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            role: UserRole.FARMER,
          });
          setSignUpError('');
          setUsernameAvailable(null);
          setCheckingUsername(false);
          // Auto-login after successful sign-up
          onLogin(newUser.role, newUser.id, newUser.name);
        } else {
          setSignUpError(t('Failed to create account. Please try again.', 'ଆକାଉଣ୍ଟ୍ ସୃଷ୍ଟି କରିବାରେ ବିଫଳ | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |'));
          setSignUpLoading(false);
        }
      } catch (error) {
        setSignUpError(t('An error occurred. Please try again.', 'ଏକ ତ୍ରୁଟି ଘଟିଲା | ଦୟାକରି ପୁନର୍ବାର ଚେଷ୍ଟା କରନ୍ତୁ |'));
        setSignUpLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Hexacomb Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'repeating-linear-gradient(60deg, transparent, transparent 50px, rgba(34, 197, 94, 0.08) 50px, rgba(34, 197, 94, 0.08) 100px), repeating-linear-gradient(-60deg, transparent, transparent 50px, rgba(34, 197, 94, 0.08) 50px, rgba(34, 197, 94, 0.08) 100px)',
        backgroundSize: '100px 87px',
        backgroundPosition: '0 0, 50px 43px'
      }}></div>
      
      {/* Very subtle decorative hexagons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 opacity-[0.02]">
          <svg viewBox="0 0 100 100" className="w-full h-full text-green-600">
            <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="currentColor" stroke="currentColor" strokeWidth="0.3" />
          </svg>
        </div>
        <div className="absolute bottom-20 right-20 w-36 h-36 opacity-[0.02]">
          <svg viewBox="0 0 100 100" className="w-full h-full text-green-500">
            <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="currentColor" stroke="currentColor" strokeWidth="0.3" />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header with Logos */}
        <div className="text-center mb-8 space-y-4">
          {/* Logos Container */}
          <div className="flex items-center justify-center gap-6 mb-6">
            {/* Government of India Logo */}
            <div className="bg-white rounded-full p-3 shadow-md border-2 border-green-300 relative">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/1200px-Emblem_of_India.svg.png" 
                alt="Government of India" 
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex flex-col items-center justify-center shadow-inner">
                        <div class="w-14 h-14 rounded-full border-4 border-white flex items-center justify-center">
                          <div class="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                            <div class="w-5 h-5 rounded-full bg-white"></div>
                          </div>
                        </div>
                        <div class="text-white text-[7px] font-bold mt-0.5">भारत</div>
                      </div>
                    `;
                  }
                }}
              />
            </div>
            
            {/* Ministry of Agriculture and Farmers Welfare Logo */}
            <div className="bg-white rounded-full p-3 shadow-md border-2 border-green-300 relative">
              <img 
                src="https://www.agriwelfare.gov.in/images/logo.png" 
                alt="Ministry of Agriculture and Farmers Welfare" 
                className="w-20 h-20 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-20 h-20 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex flex-col items-center justify-center shadow-inner">
                        <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm-1 16.5v-5H8l4-4 4 4h-3v5h-2z"/>
                        </svg>
                        <div class="text-white text-[6px] font-bold mt-0.5 text-center leading-tight">कृषि</div>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          </div>
          
          {/* Ministry Text */}
          <div className="bg-white/70 backdrop-blur-sm rounded-lg px-4 py-2 border border-green-200 shadow-sm">
            <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Government of India</p>
            <p className="text-sm font-semibold text-green-700">Ministry of Agriculture & Farmers Welfare</p>
          </div>
          
          <h1 className="text-4xl font-bold text-green-700 mt-4">KisanSetu</h1>
          <p className="text-green-600 font-semibold text-lg">National Mission on Edible Oils</p>
          <p className="text-green-500 text-sm font-medium">(NMEO-OP)</p>
          <div className="pt-2">
            <p className="text-gray-600 text-sm">Login to access your dashboard</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-green-100 relative overflow-hidden">
          {/* Very subtle hexagon pattern inside form */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.015] pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="currentColor" className="text-green-600" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-[0.015] pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="currentColor" className="text-green-600" />
            </svg>
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-green-100">
              <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                <LogIn size={24} className="text-green-500" />
                {showSignUp ? 'Create Account' : 'Login'}
              </h2>
              {showSignUp && (
                <button
                  onClick={() => {
                    setShowSignUp(false);
                    setSignUpError('');
                    setSignUpData({
                      username: '',
                      password: '',
                      confirmPassword: '',
                      firstName: '',
                      lastName: '',
                      role: UserRole.FARMER,
                    });
                    setUsernameAvailable(null);
                    setCheckingUsername(false);
                  }}
                  className="text-gray-500 hover:text-green-600 transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            {!showSignUp ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      const validation = validateUsername(e.target.value);
                      setUsername(validation.sanitized);
                      if (!validation.valid && e.target.value.length > 0) {
                        setError(validation.error || 'Invalid username');
                      } else {
                        setError('');
                      }
                    }}
                    onBlur={(e) => {
                      const validation = validateUsername(e.target.value);
                      if (!validation.valid && e.target.value.length > 0) {
                        setError(validation.error || 'Invalid username');
                      }
                    }}
                    maxLength={20}
                    className="w-full p-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-green-50/50"
                    placeholder={t('Enter your username (3-20 characters)', 'ଆପଣଙ୍କର ବ୍ୟବହାରକାରୀ ନାମ ପ୍ରବେଶ କରନ୍ତୁ (୩-୨୦ ଅକ୍ଷର)')}
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 50) {
                          setPassword(value);
                          setError('');
                        }
                      }}
                      onBlur={(e) => {
                        const validation = validatePassword(e.target.value);
                        if (!validation.valid && e.target.value.length > 0) {
                          setError(validation.error || 'Invalid password');
                        }
                      }}
                      maxLength={50}
                      className="w-full p-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition pr-10 bg-green-50/50"
                      placeholder={t('Enter your password (min 6 characters)', 'ଆପଣଙ୍କର ପାସୱାର୍ଡ୍ ପ୍ରବେଶ କରନ୍ତୁ (ସର୍ବନିମ୍ନ ୬ ଅକ୍ଷର)')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-700 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 flex items-center gap-2 text-red-700 shadow-sm">
                    <AlertCircle size={18} className="text-red-600" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('Logging in...', 'ଲଗ୍ ଇନ୍ କରୁଛି...')}</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      <span>{t('Login', 'ଲଗ୍ ଇନ୍')}</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      {t('First Name', 'ପ୍ରଥମ ନାମ')} *
                      <span className="text-xs font-normal text-gray-500 ml-2">
                        ({t('Letters only', 'କେବଳ ଅକ୍ଷର')})
                      </span>
                    </label>
                    <input
                      type="text"
                      value={signUpData.firstName}
                      onChange={(e) => {
                        // Real-time sanitization: remove all non-letter, non-space characters
                        const sanitized = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        // Remove multiple consecutive spaces
                        const cleaned = sanitized.replace(/\s+/g, ' ');
                        const validation = validateNameStrict(cleaned);
                        setSignUpData({ ...signUpData, firstName: cleaned });
                        if (!validation.valid && cleaned.length > 0) {
                          setSignUpError(validation.error || t('Invalid first name. Only letters and spaces are allowed.', 'ଅବୈଧ ପ୍ରଥମ ନାମ | କେବଳ ଅକ୍ଷର ଏବଂ ସ୍ଥାନ ଅନୁମୋଦିତ |'));
                        } else {
                          setSignUpError('');
                        }
                      }}
                      onBlur={(e) => {
                        const validation = validateNameStrict(e.target.value);
                        if (!validation.valid && e.target.value.length > 0) {
                          setSignUpError(validation.error || t('Invalid first name. Only letters and spaces are allowed.', 'ଅବୈଧ ପ୍ରଥମ ନାମ | କେବଳ ଅକ୍ଷର ଏବଂ ସ୍ଥାନ ଅନୁମୋଦିତ |'));
                          // Auto-correct on blur
                          setSignUpData({ ...signUpData, firstName: validation.sanitized });
                        } else {
                          setSignUpError('');
                        }
                      }}
                      onKeyPress={(e) => {
                        // Prevent non-letter, non-space characters from being entered
                        const char = String.fromCharCode(e.which || e.keyCode);
                        if (!/^[a-zA-Z\s]$/.test(char)) {
                          e.preventDefault();
                        }
                      }}
                      maxLength={50}
                      className="w-full p-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-green-50/50"
                      placeholder={t('Enter your first name', 'ଆପଣଙ୍କର ପ୍ରଥମ ନାମ ପ୍ରବେଶ କରନ୍ତୁ')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-green-700 mb-2">
                      {t('Last Name', 'ଶେଷ ନାମ')} *
                      <span className="text-xs font-normal text-gray-500 ml-2">
                        ({t('Letters only', 'କେବଳ ଅକ୍ଷର')})
                      </span>
                    </label>
                    <input
                      type="text"
                      value={signUpData.lastName}
                      onChange={(e) => {
                        // Real-time sanitization: remove all non-letter, non-space characters
                        const sanitized = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                        // Remove multiple consecutive spaces
                        const cleaned = sanitized.replace(/\s+/g, ' ');
                        const validation = validateNameStrict(cleaned);
                        setSignUpData({ ...signUpData, lastName: cleaned });
                        if (!validation.valid && cleaned.length > 0) {
                          setSignUpError(validation.error || t('Invalid last name. Only letters and spaces are allowed.', 'ଅବୈଧ ଶେଷ ନାମ | କେବଳ ଅକ୍ଷର ଏବଂ ସ୍ଥାନ ଅନୁମୋଦିତ |'));
                        } else {
                          setSignUpError('');
                        }
                      }}
                      onBlur={(e) => {
                        const validation = validateNameStrict(e.target.value);
                        if (!validation.valid && e.target.value.length > 0) {
                          setSignUpError(validation.error || t('Invalid last name. Only letters and spaces are allowed.', 'ଅବୈଧ ଶେଷ ନାମ | କେବଳ ଅକ୍ଷର ଏବଂ ସ୍ଥାନ ଅନୁମୋଦିତ |'));
                          // Auto-correct on blur
                          setSignUpData({ ...signUpData, lastName: validation.sanitized });
                        } else {
                          setSignUpError('');
                        }
                      }}
                      onKeyPress={(e) => {
                        // Prevent non-letter, non-space characters from being entered
                        const char = String.fromCharCode(e.which || e.keyCode);
                        if (!/^[a-zA-Z\s]$/.test(char)) {
                          e.preventDefault();
                        }
                      }}
                      maxLength={50}
                      className="w-full p-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-green-50/50"
                      placeholder={t('Enter your last name', 'ଆପଣଙ୍କର ଶେଷ ନାମ ପ୍ରବେଶ କରନ୍ତୁ')}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    {t('Role', 'ଭୂମିକା')} *
                  </label>
                  <select
                    value={signUpData.role}
                    onChange={(e) => {
                      setSignUpData({ ...signUpData, role: e.target.value as UserRole });
                      setSignUpError('');
                    }}
                    className="w-full p-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-green-50/50"
                    required
                  >
                    <option value={UserRole.FARMER}>{t('Farmer (Kisan)', 'କୃଷକ (କିସାନ୍)')}</option>
                    <option value={UserRole.FPO}>{t('FPO Representative', 'FPO ପ୍ରତିନିଧି')}</option>
                    <option value={UserRole.PROCESSOR}>{t('Processor', 'ପ୍ରକ୍ରିୟାକରଣ')}</option>
                    <option value={UserRole.RETAILER}>{t('Retailer', 'ଖୁଚୁରା ବିକ୍ରେତା')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Username *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={signUpData.username}
                      onChange={(e) => {
                        const validation = validateUsername(e.target.value);
                        setSignUpData({ ...signUpData, username: validation.sanitized });
                        setUsernameAvailable(null);
                        if (!validation.valid && e.target.value.length > 0) {
                          setSignUpError(validation.error || 'Invalid username');
                        } else {
                          setSignUpError('');
                        }
                      }}
                      onBlur={(e) => {
                        const validation = validateUsername(e.target.value);
                        if (!validation.valid && e.target.value.length > 0) {
                          setSignUpError(validation.error || 'Invalid username');
                        }
                      }}
                      maxLength={20}
                      className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-green-50/50 ${
                        usernameAvailable === false ? 'border-red-400' : 
                        usernameAvailable === true ? 'border-green-400' : 
                        'border-green-200'
                      }`}
                      placeholder={t('Choose a username (3-20 characters)', 'ଏକ ବ୍ୟବହାରକାରୀ ନାମ ବାଛନ୍ତୁ (୩-୨୦ ଅକ୍ଷର)')}
                      required
                    />
                    {checkingUsername && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {usernameAvailable !== null && !checkingUsername && (
                      <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${usernameAvailable ? 'text-green-500' : 'text-red-500'}`}>
                        {usernameAvailable ? '✓' : '✗'}
                      </div>
                    )}
                  </div>
                  {usernameAvailable === false && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Username is already taken / ବ୍ୟବହାରକାରୀ ନାମ ପୂର୍ବରୁ ନିଆଯାଇଛି
                    </p>
                  )}
                  {usernameAvailable === true && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle size={12} />
                      Username is available / ବ୍ୟବହାରକାରୀ ନାମ ଉପଲବ୍ଧ
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signUpData.password}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 50) {
                          setSignUpData({ ...signUpData, password: value });
                          setSignUpError('');
                        }
                      }}
                      onBlur={(e) => {
                        const validation = validatePassword(e.target.value);
                        if (!validation.valid && e.target.value.length > 0) {
                          setSignUpError(validation.error || 'Invalid password');
                        }
                      }}
                      maxLength={50}
                      className="w-full p-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition pr-10 bg-green-50/50"
                      placeholder="Create a password (min 6 characters)"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-700 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    {t('Confirm Password', 'ପାସୱାର୍ଡ୍ ନିଶ୍ଚିତ କରନ୍ତୁ')} *
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signUpData.confirmPassword}
                    onChange={(e) => {
                      setSignUpData({ ...signUpData, confirmPassword: e.target.value });
                      setSignUpError('');
                    }}
                    className="w-full p-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition bg-green-50/50"
                    placeholder={t('Confirm your password', 'ଆପଣଙ୍କର ପାସୱାର୍ଡ୍ ନିଶ୍ଚିତ କରନ୍ତୁ')}
                    required
                  />
                </div>

                {signUpError && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 flex items-center gap-2 text-red-700 shadow-sm">
                    <AlertCircle size={18} className="text-red-600" />
                    <span className="text-sm font-medium">{signUpError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={signUpLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {signUpLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {!showSignUp && (
              <div className="mt-6 pt-4 border-t-2 border-green-100 text-center">
                <button
                  onClick={() => {
                    // Reset all fields when switching to signup
                    setSignUpData({
                      username: '',
                      password: '',
                      confirmPassword: '',
                      firstName: '',
                      lastName: '',
                      role: UserRole.FARMER,
                    });
                    setSignUpError('');
                    setUsernameAvailable(null);
                    setCheckingUsername(false);
                    setShowSignUp(true);
                  }}
                  className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <UserPlus size={16} className="text-green-500" />
                  {t('Create a new account', 'ଏକ ନୂତନ ଆକାଉଣ୍ଟ୍ ସୃଷ୍ଟି କରନ୍ତୁ')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

