// src/pages/VerifyOtp.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

function safeLen() {
  const n = Number.parseInt(process.env.REACT_APP_OTP_LEN, 10);
  return Number.isFinite(n) && n >= 4 && n <= 8 ? n : 6;
}

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const qsEmail = useMemo(() => {
    const q = new URLSearchParams(location.search);
    return q.get("email") || "";
  }, [location.search]);

  const [email, setEmail] = useState(() => location.state?.email || qsEmail || "");
  const [len, setLen] = useState(safeLen());
  const [digits, setDigits] = useState(() => Array(safeLen()).fill(""));
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(() => location.state?.initialCooldown || 0);

  const inputsRef = useRef([]);

  // cooldown ticker
  useEffect(() => {
    if (!cooldown) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);


  // Invalidate OTP only when tab closes or page refreshes (not on React unmount)
  useEffect(() => {
    if (!email) return;

    const handleBeforeUnload = () => {
      try {
        const url = `${API_BASE}/api/auth/invalidate-otp?email=${encodeURIComponent(email)}&purpose=verify`;
        navigator.sendBeacon(url);
      } catch (err) {
        // console.error("Failed to send OTP invalidate beacon:", err);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // ❌ no fetch here — avoids deleting OTP on StrictMode fake unmount
    };
  }, [email]);


  const onChangeDigit = (idx, val) => {
    if (val.length > 1) val = val.slice(-1);
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    setError("");
    if (val && idx < digits.length - 1) inputsRef.current[idx + 1]?.focus();
  };
  const onKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowLeft" && idx > 0) inputsRef.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < digits.length - 1) inputsRef.current[idx + 1]?.focus();
  };
  const onPaste = (e) => {
    const text = (e.clipboardData || window.clipboardData).getData("text") || "";
    const arr = text.replace(/\D/g, "").slice(0, digits.length).split("");
    if (!arr.length) return;
    const next = Array(digits.length).fill("");
    for (let i = 0; i < arr.length; i++) next[i] = arr[i];
    setDigits(next);
    const last = Math.min(arr.length, digits.length) - 1;
    if (last >= 0) inputsRef.current[last]?.focus();
    e.preventDefault();
  };

  const requestOtp = async () => {
    if (!email) return setError("Please enter your email.");
    setLoading(true);
    setInfo("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/request-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      // if server returned HTML 404, this will throw; catch below
      const data = await res.json().catch(() => ({
        success: false,
        message: `HTTP ${res.status} ${res.statusText}`,
      }));

      if (!res.ok || data?.success === false) {
        // If server sends back how long to wait, start the timer
        if (typeof data?.cooldownSec === "number") {
          setCooldown(Number(data.cooldownSec));
        }
        throw new Error(data?.message || "Failed to send OTP");
      }

      // adopt server length if provided
      const serverLen = Number.parseInt(data?.length, 10);
      if (Number.isFinite(serverLen) && serverLen >= 4 && serverLen <= 8) {
        setLen(serverLen);
        setDigits(Array(serverLen).fill(""));
      } else {
        setLen(safeLen());
        setDigits(Array(safeLen()).fill(""));
      }

      setInfo(`OTP sent to ${email}.`);
      setCooldown(Number.isFinite(data?.cooldownSec) ? Number(data.cooldownSec) : 120);
    } catch (e) {
      setError(e.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!email) return setError("Email is required.");
    const code = digits.join("");
    if (code.length !== digits.length) return setError("Please enter the complete code.");

    setLoading(true);
    setInfo("");
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code, purpose: "verify" }),
        credentials: "include",
      });
      const data = await res.json().catch(() => ({
        success: false,
        message: `HTTP ${res.status} ${res.statusText}`,
      }));
      if (!res.ok || data?.success === false) throw new Error(data?.message || "Invalid or expired OTP");

      setInfo("Email verified! You can now log in.");
      // You don't have a token yet — go back to login
      setTimeout(() => navigate("/login", { replace: true }), 800);
    } catch (e) {
      setError(e.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

    const handleBackToLogin = async () => {
    if (email) {
      try {
        await fetch(`${API_BASE}/api/auth/invalidate-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, purpose: "verify" }),
          credentials: "include",
        });
      } catch (err) {
        // console.error("Failed to invalidate OTP before going back:", err);
      }
    }
    navigate("/login");
  };


  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-2">Verify your email</h2>
        <p className="text-gray-500 text-center mb-6">Enter the {len}-digit code we sent to your email.</p>

        <label className="block text-sm font-semibold mb-2">Email</label>
        <div className="flex flex-col gap-1 mb-4">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="w-full px-4 py-3 border-2 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <button
              onClick={requestOtp}
              disabled={loading || !email || cooldown > 0}
              className="whitespace-nowrap px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-white font-semibold rounded-xl disabled:opacity-50"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Send Code"}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            Wrong email?{" "}
            <button
              type="button"
              onClick={() => navigate("/login", { state: { mode: "signup" } })}
              className="text-yellow-500 hover:text-yellow-600 font-semibold"
            >
              Try another
            </button>
          </div>
        </div>


        <label className="block text-sm font-semibold mb-3">One-Time Code</label>
        <div className="flex justify-between gap-2 mb-6" onPaste={onPaste}>
          {digits.map((v, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              value={v}
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              onChange={(e) => onChangeDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              className="w-12 h-12 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-yellow-400"
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {info && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700">{info}</div>}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600">{error}</div>}

        <button
          onClick={verifyOtp}
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <div className="text-center mt-6">
          <button onClick={handleBackToLogin} className="text-sm text-gray-600 hover:underline">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
