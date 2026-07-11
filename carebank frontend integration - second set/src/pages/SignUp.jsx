import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, X, Check, Mail, AlertCircle } from "lucide-react";
import Logo from "../components/Logo";
import JarvisCore from "../components/JarvisCore";
import { useAuth } from "../context/AuthContext";

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "",
    confirmPassword: "" 
  });
  const [error, setError] = useState("");
  const [mood, setMood] = useState("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [emailForOTP, setEmailForOTP] = useState("");
  const inputRefs = useRef([]);

  // Check if email exists
  const checkEmailAvailability = async (email) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/check-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      console.log("Email check response:", data);
      return data.exists || false;
    } catch (err) {
      console.error("Error checking email:", err);
      return false;
    }
  };

  // Send OTP via API
  const sendOTPToEmail = async (email) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log("Send OTP response status:", response.status);
      const data = await response.json();
      console.log("Send OTP response data:", data);

      if (!response.ok) {
        // Use the actual error message from server
        throw new Error(data.message || data.error || "Failed to send OTP");
      }

      return { ok: true, data };
    } catch (err) {
      console.error("Error sending OTP:", err);
      return { ok: false, error: err.message };
    }
  };

  // Verify OTP via API
  const verifyOTPWithAPI = async (email, otpCode) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Invalid OTP");
      }

      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // Register user via API
  const registerUser = async (userData) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Registration failed");
      }

      return { ok: true, data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value && !/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(0, 1);
    setOtp(newOtp);
    setOtpError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP keydown
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleVerifyOTP();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const digits = pasteData.replace(/\D/g, "").slice(0, 6);
    if (digits) {
      const newOtp = [...otp];
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const enteredOTP = otp.join("");
    if (enteredOTP.length !== 6) {
      setOtpError("Please enter all 6 digits");
      return;
    }

    setMood("thinking");
    setIsLoading(true);

    // Verify OTP with backend
    const result = await verifyOTPWithAPI(emailForOTP, enteredOTP);

    if (!result.ok) {
      setOtpError(result.error || "Invalid OTP. Please try again.");
      setMood("concerned");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setIsLoading(false);
      setTimeout(() => setMood("idle"), 1400);
      return;
    }

    // OTP verified successfully
    setOtpVerified(true);
    setOtpError("");
    setMood("happy");
    setIsLoading(false);

    // Now register the user
    const registerResult = await registerUser({
      name: form.name,
      email: form.email,
      password: form.password,
    });

    if (!registerResult.ok) {
      setError(registerResult.error || "Registration failed");
      setMood("concerned");
      setShowOTPModal(false);
      setIsLoading(false);
      setTimeout(() => setMood("idle"), 1400);
      return;
    }

    // Registration successful - update auth context
    if (registerResult.data.token) {
      localStorage.setItem("authToken", registerResult.data.token);
    }

    // Call signUp from AuthContext
    const signUpResult = signUp(form);
    if (!signUpResult.ok) {
      setError(signUpResult.error);
      setMood("concerned");
      setShowOTPModal(false);
      setTimeout(() => setMood("idle"), 1400);
      return;
    }

    setMood("happy");
    setTimeout(() => {
      setShowOTPModal(false);
      navigate("/app/subscription");
    }, 500);
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    const result = await sendOTPToEmail(form.email);
    
    if (!result.ok) {
      setOtpError(result.error || "Failed to resend OTP");
      setIsResending(false);
      return;
    }

    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    inputRefs.current[0]?.focus();
    setIsResending(false);
    
    // Start cooldown
    setResendCooldown(60);
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Close modal on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && showOTPModal && !otpVerified) {
        setShowOTPModal(false);
        setOtp(["", "", "", "", "", ""]);
        setOtpError("");
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showOTPModal, otpVerified]);

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate passwords match
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setMood("thinking");
    setIsLoading(true);

    // ✅ Check if email is already registered
    const emailExists = await checkEmailAvailability(form.email);
    if (emailExists) {
      setError("An account with this email already exists. Please sign in.");
      setMood("concerned");
      setIsLoading(false);
      setTimeout(() => setMood("idle"), 1400);
      return;
    }

    // Send OTP to email via API
    const result = await sendOTPToEmail(form.email);

    if (!result.ok) {
      setError(result.error || "Failed to send verification code");
      setMood("concerned");
      setIsLoading(false);
      setTimeout(() => setMood("idle"), 1400);
      return;
    }

    // Store email for OTP verification
    setEmailForOTP(form.email);
    
    // Show OTP modal
    setShowOTPModal(true);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setOtpVerified(false);
    setMood("idle");
    setIsLoading(false);
    
    // Focus first input after modal opens
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-void-950">
      <div className="flex items-center justify-center px-6 py-16 order-2 lg:order-1">
        <div className="w-full max-w-sm animate-fadeUp">
          <div className="lg:hidden mb-10">
            <Logo />
          </div>
          <p className="text-xs tracking-[0.25em] text-amber-500/80 font-mono uppercase mb-2">
            Get started
          </p>
          <h1 className="font-display text-3xl text-bone mb-8">Create your account</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-bone/50 mb-1.5 font-mono uppercase tracking-wide">
                Full name
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-void-900 border border-void-600 rounded-md px-3.5 py-2.5 text-sm text-bone focus-ring placeholder:text-bone/30"
                placeholder="Ada Lovelace"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-xs text-bone/50 mb-1.5 font-mono uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-void-900 border border-void-600 rounded-md px-3.5 py-2.5 text-sm text-bone focus-ring placeholder:text-bone/30"
                placeholder="you@company.com"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-xs text-bone/50 mb-1.5 font-mono uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-void-900 border border-void-600 rounded-md px-3.5 py-2.5 text-sm text-bone focus-ring placeholder:text-bone/30"
                placeholder="At least 6 characters"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-xs text-bone/50 mb-1.5 font-mono uppercase tracking-wide">
                Confirm Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-void-900 border border-void-600 rounded-md px-3.5 py-2.5 text-sm text-bone focus-ring placeholder:text-bone/30"
                placeholder="Confirm your password"
                disabled={isLoading}
              />
            </div>

            {error && <p className="text-ember-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-void-950 font-semibold text-sm py-2.5 rounded-md transition-colors shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Checking..." : "Create account"} 
              <ArrowRight size={15} />
            </button>
          </form>

          <p className="text-sm text-bone/40 mt-8">
            Already registered?{" "}
            <Link to="/signin" className="text-amber-400 hover:text-amber-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-col items-center justify-center relative bg-hud-grid border-l border-void-700/60 overflow-hidden order-1 lg:order-2">
        <div className="absolute top-8 right-8">
          <Logo />
        </div>
        <JarvisCore mood={mood} size={380} />
        <p className="absolute bottom-10 text-center text-bone/40 text-sm font-mono tracking-wide max-w-xs">
          INITIALIZING NEW OPERATOR PROFILE
        </p>
      </div>

      {/* OTP Verification Modal */}
      {showOTPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fadeIn">
          <div 
            className="absolute inset-0 bg-void-950/80 backdrop-blur-sm"
            onClick={() => {
              if (!otpVerified) {
                setShowOTPModal(false);
                setOtp(["", "", "", "", "", ""]);
                setOtpError("");
              }
            }}
          />
          
          <div className="relative bg-void-900 border border-void-700 rounded-xl max-w-md w-full p-6 shadow-2xl animate-scaleIn">
            {!otpVerified && (
              <button
                onClick={() => {
                  setShowOTPModal(false);
                  setOtp(["", "", "", "", "", ""]);
                  setOtpError("");
                }}
                className="absolute top-3 right-3 text-bone/30 hover:text-bone/60 transition-colors"
              >
                <X size={20} />
              </button>
            )}

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                {otpVerified ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Mail className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-display text-bone">
                  {otpVerified ? "Verified!" : "Verify your email"}
                </h3>
                <p className="text-xs text-bone/40">
                  {otpVerified 
                    ? "Email verified successfully" 
                    : `We sent a code to ${form.email}`}
                </p>
              </div>
            </div>

            {!otpVerified ? (
              <div className="space-y-6">
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={index === 0 ? handleOtpPaste : undefined}
                      className={`w-12 h-14 text-center text-xl font-mono bg-void-800 border-2 rounded-lg text-bone focus-ring transition-all ${
                        otpError 
                          ? "border-ember-500/50 focus:border-ember-500" 
                          : "border-void-600 focus:border-amber-500"
                      }`}
                      autoFocus={index === 0}
                      disabled={isLoading}
                    />
                  ))}
                </div>

                {otpError && (
                  <div className="flex items-center gap-2 text-ember-500 text-xs">
                    <AlertCircle size={14} />
                    <span>{otpError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0 || isResending || isLoading}
                    className={`text-amber-400 hover:text-amber-300 transition-colors ${
                      resendCooldown > 0 || isLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isResending 
                      ? "Sending..." 
                      : resendCooldown > 0 
                        ? `Resend in ${resendCooldown}s` 
                        : "Resend code"}
                  </button>
                  <span className="text-bone/30">
                    Code expires in 5 min
                  </span>
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-void-950 font-semibold text-sm rounded-md transition-colors shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Verifying..." : "Verify & Create Account"}
                </button>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <p className="text-bone/60 text-sm">
                  Your email has been verified. Creating your account...
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}