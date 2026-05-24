import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import logoImage from '../assets/logo.jpg';
import registerIllustration from '../assets/register_1.jpg';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: ''
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors({ ...errors, [field]: '' });
  };

  const handleSubmit = async (e) => {
    if (otpSent) {
      return handleVerifyOtp(e);
    }

    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      await authAPI.register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      setOtpSent(true);
      setPendingEmail(form.email.trim().toLowerCase());
      toast.success('Verification code sent to your email. Please verify to complete registration.');
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setErrors({ ...errors, otp: 'OTP is required' });
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.verifyRegistrationOTP({
        email: pendingEmail || form.email.trim().toLowerCase(),
        otp: otp.trim(),
      });

      const { token, user } = response.data?.data || {};
      if (!token || !user) {
        throw new Error('Invalid verification response');
      }

      login(user, token);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Verification failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthClass = ['', 'is-weak', 'is-fair', 'is-good', 'is-strong'][strength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];

  return (
    <div className="auth-page">

      {/* LEFT SIDE (UPDATED SAME AS LOGIN) */}
      <div className="auth-page__left auth-page__left--register">

        {/* Logo */}
        <Link to="/" className="auth-page__brand auth-page__brand--light">
          <div className="auth-page__brand-box auth-page__brand-box--light">
            <img src={logoImage} alt="TaxEasePro logo" className="auth-page__brand-image" />
          </div>
          <span className="auth-page__brand-text auth-page__brand-text--light">
            TaxEasePro
          </span>
        </Link>

        {/* IMAGE + TEXT */}
        <div className="auth-page__left-content">

          <img
            src={registerIllustration}
            alt="Register Illustration"
            className="auth-page__image"
          />

          <div className="auth-page__image-text">
            <h2>Your taxes, expertly handled.</h2>
            <p>
              Create your account and start managing all your CA services in one place.
            </p>
          </div>

        </div>

        {/* FOOTER */}
        <p className="auth-page__left-footnote">
          © 2025 TaxEasePro. All rights reserved.
        </p>
      </div>

      {/* RIGHT SIDE (FORM SAME) */}
      <div className="auth-page__right">
        <div className="auth-card">

          {/* Mobile Logo */}
          <Link to="/" className="auth-page__brand auth-page__brand--mobile">
            <div className="auth-page__brand-box auth-page__brand-box--dark">
              <span className="auth-page__brand-mark auth-page__brand-mark--light">CA</span>
            </div>
            <span className="auth-page__brand-text auth-page__brand-text--dark">
              TaxEasePro
            </span>
          </Link>

          {/* Title */}
          <div className="auth-card__intro">
            <h1 className="auth-card__title">Create account</h1>
            <p className="auth-card__subtitle">
              Start managing your taxes smarter today
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="auth-form auth-form--compact">

            {/* NAME */}
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <input
                className={`auth-input ${errors.name ? 'is-error' : ''}`}
                placeholder="Rahul Sharma"
                value={form.name}
                onChange={handleChange('name')}
              />
              {errors.name && <p className="auth-error">{errors.name}</p>}
            </div>

            {/* EMAIL */}
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                className={`auth-input ${errors.email ? 'is-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange('email')}
              />
              {errors.email && <p className="auth-error">{errors.email}</p>}
            </div>

            {/* PASSWORD */}
            <div className="auth-field">
              <label className="auth-label">Password</label>

              <div className="auth-input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  className={`auth-input auth-input--password ${
                    errors.password ? 'is-error' : ''
                  }`}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange('password')}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="auth-input-toggle"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {errors.password && <p className="auth-error">{errors.password}</p>}

              {form.password && (
                <div className="auth-strength">
                  <div className="auth-strength__bars">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`auth-strength__bar ${
                          i <= strength ? `is-active ${strengthClass}` : ''
                        }`}
                      />
                    ))}
                  </div>
                  <p className="auth-strength__text">
                    Password strength:{' '}
                    <span className="auth-strength__label">
                      {strengthLabel}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <input
                type="password"
                className={`auth-input ${errors.confirm ? 'is-error' : ''}`}
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={handleChange('confirm')}
              />
              {errors.confirm && <p className="auth-error">{errors.confirm}</p>}
            </div>

            {otpSent && (
              <div className="auth-field">
                <label className="auth-label">Verification Code</label>
                <input
                  type="text"
                  className={`auth-input ${errors.otp ? 'is-error' : ''}`}
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setErrors({ ...errors, otp: '' });
                  }}
                />
                {errors.otp && <p className="auth-error">{errors.otp}</p>}
                <p className="auth-note">
                  We sent a 6-digit verification code to <strong>{pendingEmail || form.email}</strong>.
                </p>
              </div>
            )}

            {/* TERMS */}
            <label className="auth-terms">
              <input type="checkbox" required className="auth-terms__input" />
              <span className="auth-terms__text">
                I agree to the{' '}
                <a href="#" className="auth-link auth-link--primary">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="auth-link auth-link--primary">
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* BUTTON */}
            <Button
              type="submit"
              variant="primary"
              className="auth-submit-btn"
              size="lg"
              loading={loading}
            >
              <UserPlus size={18} /> {otpSent ? 'Verify OTP' : 'Create Account'}
            </Button>

          </form>

          {/* FOOTER */}
          <p className="auth-footer-copy">
            Already have an account?{' '}
            <Link
              to="/login"
              className="auth-link auth-link--primary auth-link--semibold"
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}