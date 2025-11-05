// src/pages/ForgotPassword.js
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { AlertCircle, Loader } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { requestResetOtp, verifyResetOtp, changePasswordWithToken } = useAuth();

  const [step, setStep] = useState(1);          // 1: email, 2: OTP, 3: new pass
  const [email, setEmail] = useState("");
  const [otpLen, setOtpLen] = useState(6);      // server can override this
  const [otp, setOtp] = useState([]);           // will be sized to otpLen
  const [inputsRef, setInputsRef] = useState([]);
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [success, setSuccess] = useState("");

  // keep refs in sync with otp length
  useEffect(() => {
    setOtp(Array.from({ length: otpLen }, () => ""));
    setInputsRef(Array.from({ length: otpLen }, () => React.createRef()));
  }, [otpLen]);

  const focusIdx = (i) => inputsRef?.[i]?.current?.focus();

  const handleRequestOTP = async () => {
    setApiError(""); setSuccess("");
    if (!email) return setApiError("Please enter your email");

    setLoading(true);
    const res = await requestResetOtp(email);
    setLoading(false);

    if (!res?.success) return setApiError(res?.message || "Failed to send code");
    setOtpLen(Number(res.length || 6));
    setStep(2);
    setSuccess("We sent a code to your email.");
    setTimeout(() => focusIdx(0), 50);
  };

  const handleOtpChange = (index, val) => {
    if (!/^\d?$/.test(val)) return;         // allow 0-9 or empty
    const next = [...otp];
    next[index] = val;
    setOtp(next);

    if (val && index < otpLen - 1) focusIdx(index + 1);
    if (!val && index > 0) focusIdx(index - 1);
  };

  const handleOtpKey = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      focusIdx(index - 1);
    }
  };

  const handleSubmitOTP = async () => {
    setApiError(""); setSuccess("");
    const code = otp.join("");
    if (code.length !== otpLen) return setApiError("Please complete the code.");

    setLoading(true);
    const res = await verifyResetOtp(email, code);
    setLoading(false);

    if (!res?.success) return setApiError(res?.message || "Invalid code");
    setResetToken(res.resetToken);
    setStep(3);
    setSuccess("Code verified. Set a new password.");
  };

  const handleChangePassword = async () => {
    setApiError(""); setSuccess("");
    if (!newPassword || newPassword.length < 8) {
      return setApiError("Password must be at least 8 characters.");
    }
    if (newPassword !== confirmPassword) {
      return setApiError("Passwords do not match.");
    }

    setLoading(true);
    const res = await changePasswordWithToken(resetToken, newPassword);
    setLoading(false);

    if (!res?.success) return setApiError(res?.message || "Could not change password.");
    setSuccess("Password changed! You can now log in.");
    setTimeout(() => navigate("/login"), 900);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold text-gray-800">
            Pick<span className="text-yellow-400">A</span>Plate<span className="text-yellow-400">.</span>
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-10">
          {/* Notices */}
          {apiError && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> <span>{apiError}</span>
            </div>
          )}
          {success && (
            <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700">
              {success}
            </div>
          )}

          {/* STEP 1: email */}
          {step === 1 && (
            <>
              <h2 className="text-3xl font-bold text-center mb-3">Forgot <span className="text-yellow-400">A</span> Password</h2>
              <p className="text-gray-500 text-center mb-8">We’ll send a one-time code to your email.</p>

              <label className="block text-gray-800 font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:border-yellow-400"
                placeholder="your@email.com"
              />

              <button
                onClick={handleRequestOTP}
                disabled={loading}
                className="mt-6 w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader className="w-5 h-5 animate-spin" />}
                <span>Request OTP</span>
              </button>

              <p className="mt-4 text-center text-sm">
                Remembered it? <Link to="/login" className="font-semibold hover:underline">Log in</Link>
              </p>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-center mb-2">Enter the code</h2>
              <p className="text-gray-500 text-center mb-6">
                We sent a {otpLen}-digit code to <b>{email}</b>
              </p>

              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={inputsRef[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(i, e)}
                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-yellow-400"
                  />
                ))}
              </div>

              <button
                onClick={handleSubmitOTP}
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader className="w-5 h-5 animate-spin" />}
                <span>Verify Code</span>
              </button>

              <button
                onClick={() => setStep(1)}
                className="mt-3 w-full text-gray-600 hover:underline"
              >
                Change email
              </button>
            </>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-bold text-center mb-6">Set a new password</h2>

              <label className="block text-gray-800 font-medium mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:border-yellow-400"
                placeholder="At least 8 characters"
              />

              <label className="block text-gray-800 font-medium mb-2 mt-5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-5 py-3 border rounded-xl focus:outline-none focus:border-yellow-400"
                placeholder="Re-enter password"
              />

              <button
                onClick={handleChangePassword}
                disabled={loading}
                className="mt-6 w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading && <Loader className="w-5 h-5 animate-spin" />}
                <span>Change Password</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
