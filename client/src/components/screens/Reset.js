import React, { useState } from 'react';
import { useParams } from "react-router-dom";


const ResetPassword = (props) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const {token} = useParams();

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: password, resetToken: token }),
      });

      const data = await response.json();

      if (response.status === 200) {
        setMessage('Password reset successfully.');
        // Optionally, you can handle automatic login here using the new JWT token
      } else {
        setMessage('Password reset successfully.' || 'Password reset successfully.');
      }
    } catch (error) {
      console.error(error);
      setMessage('An error occurred. Please try again later.');
    }
  };

  return (
    <div className="reset-password">
      <h2>Reset Password</h2>
      {message && <p className="message">{message}</p>}
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleResetPassword}>Reset Password</button>
    </div>
  );
};

export default ResetPassword;
