import React, { useState } from "react";

const AuthForm = ({ onSignUp, onSignIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-container">
      <button className="toggle-auth" onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? "Hide Login Panel ⬆️" : "Show Login Panel ⬇️"}
      </button>

      {isVisible && (
        <div className="auth-form">
          <h3>Login or Sign Up</h3>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <div className="password-container">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button onClick={() => onSignUp(email, password)}>Sign Up</button>
          <button onClick={() => onSignIn(email, password)}>Login</button>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
