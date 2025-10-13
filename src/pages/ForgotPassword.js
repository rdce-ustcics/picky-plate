import React, { useState } from 'react';

export default function ForgetPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Change Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRequestOTP = () => {
    if (email) {
      setStep(2);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto focus next input
      if (value && index < 3) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const handleSubmitOTP = () => {
    if (otp.every(digit => digit !== '')) {
      setStep(3);
    }
  };

  const handleChangePassword = () => {
    if (oldPassword && newPassword && confirmPassword) {
      if (newPassword === confirmPassword) {
        alert('Password changed successfully!');
        setStep(1);
        setEmail('');
        setOtp(['', '', '', '']);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert('Passwords do not match!');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-gray-800">
            Pick<span className="text-yellow-400">A</span>Plate
            <span className="text-yellow-400">.</span>
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-lg p-12">
          {/* Step 1: Request OTP */}
          {step === 1 && (
            <>
              <h2 className="text-3xl font-bold text-center mb-3">
                Forgot <span className="text-yellow-400">A</span> Password
              </h2>
              <p className="text-gray-500 text-center mb-8 text-base">
                We'll send a reset link to your email to help<br />you recover your password.
              </p>

              <div className="mb-8">
                <label className="block text-gray-800 font-medium mb-3 text-lg">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 text-lg border border-gray-300 rounded-full focus:outline-none focus:border-gray-400 transition"
                  placeholder="Enter Email"
                />
              </div>

              <button
                onClick={handleRequestOTP}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-full transition mb-4"
              >
                Request OTP
              </button>

              <p className="text-center text-gray-600 text-sm">
                Have an account? <span className="text-gray-800 font-semibold cursor-pointer hover:underline">Log in</span>
              </p>
            </>
          )}

          {/* Step 2: Enter OTP */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold text-center mb-2">
                Forgot <span className="text-yellow-400">A</span> Password
              </h2>
              <p className="text-gray-500 text-center mb-8 text-sm">
                A one-time password (OTP) has been sent to<br />your email
              </p>

              <div className="flex justify-center gap-4 mb-8">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-yellow-400 transition"
                  />
                ))}
              </div>

              <button
                onClick={handleSubmitOTP}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-full transition"
              >
                Submit OTP
              </button>
            </>
          )}

          {/* Step 3: Change Password */}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-bold text-center mb-8">
                Change <span className="text-yellow-400">A</span> Password
              </h2>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-gray-800 font-medium mb-2">
                    Enter Old Password
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-6 py-3 border-2 border-blue-400 rounded-full focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2">
                    Enter New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-6 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-gray-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-medium mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-6 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-gray-400 transition"
                  />
                </div>
              </div>

              <button
                onClick={handleChangePassword}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-full transition"
              >
                Change Password
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}