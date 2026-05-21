import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { authAPI, userAPI } from '../services/api';
import logoImage from '../assets/logo.jpg';
import loginIllustration from '../assets/login_1.jpg';

function Login() {

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const navigate = useNavigate();

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); 
  // 1 = email, 2 = otp, 3 = reset password

  // Forgot password handler
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMsg('');
    try {
      await userAPI.forgotPassword({ email: forgotEmail });
      setForgotMsg('OTP sent to your email.');
      setStep(2); // Move to OTP verification step
    } catch (err) {
      setForgotMsg(err?.response?.data?.message || 'Error sending OTP');
    }
    setForgotLoading(false);
  };

  const handleVerifyOTP = async () => {
    console.log("VERIFY BUTTON CLICKED");
    try {
      await userAPI.verifyOTP({
        email: forgotEmail,
        otp: otp,
      });

      toast.success("OTP Verified");
      setStep(3); // show new password form

    } catch (err) {
      toast.error("Invalid OTP");
    }
  };
  const handleResetPassword = async () => {
    try {
       await userAPI.resetPassword({
        email: forgotEmail,
        otp: otp,
        newPassword: newPassword,
      });

      toast.success("Password updated successfully");
      setShowForgot(false);
      setStep(1);

    } catch (err) {
      toast.error("Failed to reset password");
    }
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Minimum 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await authAPI.login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { token, user } = response.data?.data || {};

      if (!token || !user) {
        throw new Error('Invalid login response');
      }

      login(user, token);

      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'superadmin' ? '/superadmin' : user.role === 'admin' ? '/admin' : '/dashboard');

    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Login failed. Please check your credentials.';
      // Show alert for incorrect email or password
      if (
        message.toLowerCase().includes('email not registered') ||
        message.toLowerCase().includes('incorrect password')
      ) {
        alert(message);
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      
      {/* LEFT SIDE */}
      <div className="auth-page__left auth-page__left--login">
        
        <Link to="/" className="auth-page__brand auth-page__brand--light">
          <div className="auth-page__brand-box auth-page__brand-box--light">
            <img src={logoImage} alt="TaxEasePro logo" className="auth-page__brand-image" />
          </div>
          <span className="auth-page__brand-text auth-page__brand-text--light">
            TaxEasePro
          </span>
        </Link>

        <div className="auth-page__left-content">
          <img
            src={loginIllustration}
            alt="CA Login Illustration"
            className="auth-page__image"
          />

          <div className="auth-page__image-text">
            <h2>Your taxes, expertly handled.</h2>
            <p>
              Sign in to access your dashboard and manage all your CA services in one place.
            </p>
          </div>
        </div>

        <p className="auth-page__left-footnote">
          © 2025 TaxEasePro. All rights reserved.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-page__right">
        <div className="auth-card">

          <Link to="/" className="auth-page__brand auth-page__brand--mobile">
            <div className="auth-page__brand-box auth-page__brand-box--dark">
              <img src={logoImage} alt="TaxEasePro logo" className="auth-page__brand-image" />
            </div>
            <span className="auth-page__brand-text auth-page__brand-text--dark">
              TaxEasePro
            </span>
          </Link>

          <div className="auth-card__intro">
            <h1 className="auth-card__title">Welcome back</h1>
            <p className="auth-card__subtitle">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form auth-form--spaced">
            
            {/* EMAIL */}
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <input
                type="email"
                className={`auth-input ${errors.email ? 'is-error' : ''}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  setErrors({ ...errors, email: '' });
                }}
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
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => {
                    setForm({ ...form, password: e.target.value });
                    setErrors({ ...errors, password: '' });
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="auth-input-toggle"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="auth-error">{errors.password}</p>
              )}
            </div>

            {/* OPTIONS */}
            <div className="auth-options">
              <label className="auth-check">
                <input type="checkbox" className="auth-check__input" />
                <span className="auth-check__label">Remember me</span>
              </label>

              <button
                type="button"
                className="auth-link auth-link--primary"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => setShowForgot(true)}
              >
                Forgot password?
              </button>

              {showForgot && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3>Forgot Password</h3>
                      {/* STEP 1 */}
                  {step === 1 && (
                    <>
                      <input
                        type="email"
                        placeholder="Enter email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                      />
                      <Button onClick={handleForgotSubmit}>
                        Send OTP
                      </Button>
                    </>
                  )}

                  {/* STEP 2 */}
                  {step === 2 && (
                    <>
                      <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                      <Button onClick={handleVerifyOTP}>
                        Verify OTP
                      </Button>
                    </>
                  )}

                  {/* STEP 3 */}
                  {step === 3 && (
                    <>
                      <input
                        type="password"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <Button onClick={handleResetPassword}>
                        Reset Password
                      </Button>
                    </>
                  )}

                  
                    {forgotMsg && <p>{forgotMsg}</p>}
                    <button onClick={() => setShowForgot(false)} className="modal-close">Close</button>
                  </div>
                </div>
              )}
            </div>

            {/* BUTTON */}
            <Button
              type="submit"
              variant="primary"
              className="auth-submit-btn"
              size="lg"
              loading={loading}
            >
              <LogIn size={18} /> Sign In
            </Button>
          </form>

          <p className="auth-footer-copy">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="auth-link auth-link--primary auth-link--semibold"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;