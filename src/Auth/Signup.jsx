import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../hooks/userContext";
import logo from "../assets/images/logo.png"; // Assuming you have a logo image in this path

import {
  User,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Truck,
  CircleDollarSign,
  ShieldCheck,
  CheckCircle2,
  LockKeyhole,
} from "lucide-react";

// Google Icon Component for Button
const GoogleIcon = () => (
  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
    <path
      fill="#EA4335"
      d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.273 0 3.19 2.69 1.127 6.65l4.139 3.115z"
    />
    <path
      fill="#4285F4"
      d="M23.455 12.273c0-.818-.073-1.609-.209-2.373H12v4.509h6.418a5.505 5.505 0 0 1-2.391 3.609l3.7 2.873c2.164-2 3.41-4.945 3.41-8.618z"
    />
    <path
      fill="#FBBC05"
      d="M5.266 14.235L1.127 17.35A11.948 11.948 0 0 0 12 24c3.055 0 5.836-1 7.964-2.727l-3.7-2.873a7.132 7.132 0 0 1-4.264 1.509 7.077 7.077 0 0 1-6.734-4.674z"
    />
    <path
      fill="#34A853"
      d="M1.127 6.65C.41 8.282 0 10.09 0 12s.41 3.718 1.127 5.35l4.139-3.115A7.058 7.058 0 0 1 4.909 12c0-1.2.3-2.336.827-3.35L1.127 6.65z"
    />
  </svg>
);

const Signup = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const [step, setStep] = useState(1); // signup: 1=form, 2=otp
  const [mode, setMode] = useState("login"); // Defaulted to 'login' to match login.png structure
  const [contact, setContact] = useState({ type: "", value: "" });
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { updateUser } = useUser();

  // ---------- Google callback ----------
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const userData = urlParams.get("user");

    if (token && userData) {
      const user = JSON.parse(decodeURIComponent(userData));

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      updateUser(user);
      toast.success("Google login successful!");
      navigate("/");
    }
  }, [navigate, updateUser]);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_APP_SERVER_URL}api/auth/google`;
  };

  const isEmail = (value) => /.+@.+\..+/.test(value);
  const isBdPhone = (value) => /^(?:\+88|88)?01[3-9]\d{8}$/.test(value.trim());

  /* =========================
      SIGNUP: Step–1 => Send OTP
  ========================== */
  const handleSendOtp = async (data) => {
    try {
      const { signupName, signupContact, signupPassword } = data;
      const trimmed = signupContact.trim();

      let payload = {
        name: signupName,
        password: signupPassword,
      };
      let type = "";

      if (isEmail(trimmed)) {
        type = "email";
        payload.email = trimmed.toLowerCase();
      } else if (isBdPhone(trimmed)) {
        type = "mobile";
        payload.mobile = trimmed;
      } else {
        toast.error("Enter a valid email or Bangladeshi phone number");
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_APP_SERVER_URL}api/auth/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        toast.info(
          type === "email"
            ? "OTP sent to your email"
            : "OTP sent to your phone",
        );
        setContact({
          type,
          value: type === "email" ? payload.email : payload.mobile,
        });
        setStep(2);
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error("🌐 Network error while sending OTP:", err);
      toast.error("Network error while sending OTP");
    }
  };

  /* =========================
      SIGNUP: Step–2 => Verify OTP
  ========================== */
  const handleVerifyOtp = async (data) => {
    try {
      const otpPayload =
        contact.type === "mobile"
          ? { mobile: contact.value, otp: String(data.otp) }
          : { email: contact.value, otp: String(data.otp) };

      const res = await fetch(
        `${import.meta.env.VITE_APP_SERVER_URL}api/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(otpPayload),
        },
      );

      if (res.ok) {
        const result = await res.json();
        toast.success("Signup successful");

        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));

        updateUser(result.user);
        reset();
        setStep(1);
        navigate("/");
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to verify OTP");
      }
    } catch (err) {
      console.error("🌐 Network error while verifying OTP:", err);
      toast.error("Network error while verifying OTP");
    }
  };

  /* =========================
      LOGIN: Email/Phone + Password
  ========================== */
  const handlePasswordLogin = async (data) => {
    try {
      const { loginContact, loginPassword } = data;
      const trimmed = loginContact.trim();

      let identifier = "";

      if (isEmail(trimmed)) {
        identifier = trimmed.toLowerCase();
      } else if (isBdPhone(trimmed)) {
        identifier = trimmed;
      } else {
        toast.error("Enter a valid email or Bangladeshi phone number");
        return;
      }

      const payload = { identifier, password: loginPassword };

      const res = await fetch(
        `${import.meta.env.VITE_APP_SERVER_URL}api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (res.ok) {
        const result = await res.json();
        toast.success("Login successful");

        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.user));

        updateUser(result.user);
        reset();
        navigate("/");
      } else {
        const error = await res.json();
        toast.error(error.message || "Login failed");
      }
    } catch (err) {
      console.error("🌐 Network error during login:", err);
      toast.error("Network error during login");
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setStep(1);
    setContact({ type: "", value: "" });
    reset();
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff7ed_0,_#f8fafc_42%,_#f1f5f9_100%)] flex items-center justify-center p-0 lg:p-6 font-sans antialiased text-slate-800">
      <div className="w-full max-w-[1180px] min-h-0 lg:min-h-[720px] grid grid-cols-1 lg:grid-cols-12 bg-white lg:rounded-[32px] shadow-[0_24px_70px_-28px_rgba(15,23,42,0.28)] border border-white overflow-hidden">
        {/* ================= LEFT SIDE PANEL: BRAND & ASSURANCES ================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#fffaf5] via-white to-orange-50 px-6 py-5 md:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-orange-100/70 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-100/60 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Logo Heading Section */}
          <div>
            <div className="hidden md:block">
              <Link
                to="/"
                className="relative inline-flex items-center gap-3 mb-10 group"
              >
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  <img
                    src={logo}
                    alt="Kroykori"
                    className="h-16 w-auto transition-transform duration-300 group-hover:scale-105"
                  />
                </span>
              </Link>

              <div className="space-y-3 max-w-sm">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Welcome to <span className="text-orange-600">Kroykori</span>
                </h2>

                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Great products, fair prices, and easy shopping—all in one
                  place.
                </p>
              </div>
            </div>

            {/* Assurance List Elements Grid */}
            <div className="hidden lg:block mt-10 space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl border border-orange-100 shadow-sm flex items-center justify-center text-orange-600 shrink-0">
                  <Truck className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Fast Delivery
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Get your products delivered at your doorstep.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl border border-orange-100 shadow-sm flex items-center justify-center text-emerald-600 shrink-0">
                  <CircleDollarSign className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Cash on Delivery
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Pay when you receive your products.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl border border-orange-100 shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
                  <ShieldCheck className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Trusted Products
                  </h4>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    100% authentic & quality products for you.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kroykori promotional card */}
          <div className="hidden lg:block relative mt-10 overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-[#172554] p-7 text-white shadow-xl shadow-slate-300/50">
            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-orange-500/25 blur-2xl" />
            <div className="absolute -bottom-14 left-10 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl" />
            <div className="relative">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-200">
                Shop with confidence
              </span>
              <h3 className="mt-4 text-2xl font-black leading-tight">
                Everything you love,
                <br />
                delivered by <span className="text-orange-400">Kroykori.</span>
              </h3>
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                {[
                  ["Secure", "Shopping"],
                  ["Quick", "Delivery"],
                  ["Easy", "Returns"],
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-white/10 bg-white/[0.07] px-2 py-3"
                  >
                    <p className="text-xs font-extrabold text-white">{title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE PANEL: LOGIN / REGISTRATION SYSTEM ================= */}
        <div className="lg:col-span-7 px-6 py-7 md:p-12 xl:p-16 flex flex-col justify-center bg-white relative">
          <div className="w-full max-w-[420px] mx-auto space-y-6">
            <div className="space-y-1.5 text-center lg:text-left">
              <span className="inline-flex mb-2 rounded-full bg-orange-50 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-orange-600">
                Kroykori Account
              </span>
              <h3 className="text-3xl font-black tracking-tight text-slate-900">
                Welcome Back!
              </h3>
              <p className="text-sm font-medium text-slate-400">
                Login to your account or create a new one
              </p>
            </div>

            {/* Premium Underlined Navigation Tabs Toggle */}
            <div className="flex border-b border-slate-100 font-semibold text-sm">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`w-1/2 pb-3 text-center transition-all border-b-2 focus:outline-none ${
                  mode === "login"
                    ? "border-orange-600 text-orange-600 font-black"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`w-1/2 pb-3 text-center transition-all border-b-2 focus:outline-none ${
                  mode === "signup"
                    ? "border-orange-600 text-orange-600 font-black"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                Register
              </button>
            </div>

            {/* ================= MODE: PASSWORD BASE LOGIN INPUT INTERFACE ================= */}
            {mode === "login" && (
              <form
                onSubmit={handleSubmit(handlePasswordLogin)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Email or Phone
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
                    <input
                      type="text"
                      {...register("loginContact", {
                        required: "Email or phone is required",
                        validate: (value) =>
                          isEmail(value) ||
                          isBdPhone(value) ||
                          "Enter a valid email or Bangladeshi phone number",
                      })}
                      className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-slate-700"
                      placeholder="Enter your email or phone number"
                    />
                  </div>
                  {errors.loginContact && (
                    <span className="text-rose-500 text-xs mt-1 block font-medium">
                      {errors.loginContact.message}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("loginPassword", {
                        required: "Password is required",
                      })}
                      className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-slate-700"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.loginPassword && (
                    <span className="text-rose-500 text-xs mt-1 block font-medium">
                      {errors.loginPassword.message}
                    </span>
                  )}
                </div>

                <div className="text-right pt-0.5">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-orange-600 hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md shadow-orange-100 uppercase tracking-wider"
                >
                  Login
                </button>
              </form>
            )}

            {/* ================= MODE: REGISTRATION PIPELINE INTERFACE ================= */}
            {mode === "signup" && (
              <>
                {step === 1 && (
                  <form
                    onSubmit={handleSubmit(handleSendOtp)}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
                        <input
                          type="text"
                          {...register("signupName", {
                            required: "Name is required",
                          })}
                          className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-slate-700"
                          placeholder="Enter your full name"
                        />
                      </div>
                      {errors.signupName && (
                        <span className="text-rose-500 text-xs mt-1 block font-medium">
                          {errors.signupName.message}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Email or Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
                        <input
                          type="text"
                          {...register("signupContact", {
                            required: "Email or phone is required",
                            validate: (value) =>
                              isEmail(value) ||
                              isBdPhone(value) ||
                              "Enter a valid email or Bangladeshi phone number",
                          })}
                          className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-slate-700"
                          placeholder="Enter email or phone number"
                        />
                      </div>
                      {errors.signupContact && (
                        <span className="text-rose-500 text-xs mt-1 block font-medium">
                          {errors.signupContact.message}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
                        <input
                          type={showPassword ? "text" : "password"}
                          {...register("signupPassword", {
                            required: "Password is required",
                            minLength: {
                              value: 6,
                              message: "Password must be at least 6 characters",
                            },
                          })}
                          className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-medium text-slate-700"
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {errors.signupPassword && (
                        <span className="text-rose-500 text-xs mt-1 block font-medium">
                          {errors.signupPassword.message}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md shadow-orange-100 uppercase tracking-wider"
                    >
                      Send OTP to Sign Up
                    </button>
                  </form>
                )}

                {/* OTP Verification Step UI */}
                {step === 2 && (
                  <form
                    onSubmit={handleSubmit(handleVerifyOtp)}
                    className="space-y-4"
                  >
                    <div className="bg-orange-50/60 border border-orange-100 rounded-xl p-3.5 text-xs text-orange-800 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />
                      <span>
                        OTP verification token sent to your registered{" "}
                        {contact.type} node setup.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Enter 4-Digit OTP
                      </label>
                      <div className="relative">
                        <LockKeyhole className="absolute left-3.5 top-3.5 text-slate-300 w-4 h-4" />
                        <input
                          type="text"
                          maxLength={4}
                          {...register("otp", {
                            required: "OTP is required",
                            pattern: {
                              value: /^[0-9]{4}$/,
                              message: "Enter a valid 4-digit OTP",
                            },
                          })}
                          className="w-full bg-slate-50/40 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition-all font-bold tracking-widest text-center text-slate-800"
                          placeholder="0000"
                        />
                      </div>
                      {errors.otp && (
                        <span className="text-rose-500 text-xs mt-1 block font-medium">
                          {errors.otp.message}
                        </span>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md shadow-orange-100 uppercase tracking-wider"
                    >
                      Verify & Sign Up
                    </button>
                  </form>
                )}
              </>
            )}

            {/* OAUTH INTEGRATION FRAMEWORK (Google API Trigger) */}
            <div className="space-y-4 pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  or continue with
                </span>
                <div className="flex-grow border-t border-slate-100"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-sm"
              >
                <GoogleIcon /> Continue with Google
              </button>
            </div>

            {/* Bottom Security Commitment Informational Tag */}
            <div className="bg-orange-50/30 border border-orange-100/40 rounded-xl p-3 text-center text-[11px] font-bold text-orange-700 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-600" /> Your
              information is 100% secure with us.
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
    </div>
  );
};

export default Signup;
