import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useI18n } from "../../../components/useI18n";

export interface LoginFormProps {
  email: string;
  password: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  error: string | null;
  busy: boolean;
  disabled?: boolean;
  onExit?: () => void;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  error,
  busy,
  disabled,
  onExit,
}: LoginFormProps): React.JSX.Element {
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailInvalid = emailTouched && email.trim().length > 0 && !isValidEmail(email);
  const passwordInvalid = passwordTouched && password.length > 0 && password.length < 4;
  const formDisabled = disabled || busy;

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!email.trim() || !isValidEmail(email) || password.length < 4) {
      return;
    }
    onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form" noValidate>
      {error ? <div className="login-error-banner">{error}</div> : null}

      <div className="login-field">
        <label htmlFor="login-email" className="login-field-label">
          {t("auth.email")}
        </label>
        <div className="login-input-wrap">
          <input
            id="login-email"
            type="email"
            className={`login-field-input${emailInvalid ? " login-field-input--invalid" : ""}`}
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            autoComplete="email"
            required
            disabled={formDisabled}
            placeholder="you@example.com"
          />
        </div>
        {emailInvalid ? (
          <p className="login-field-error">{t("auth.invalidEmail")}</p>
        ) : null}
      </div>

      <div className="login-field">
        <label htmlFor="login-password" className="login-field-label">
          {t("auth.password")}
        </label>
        <div className="login-input-wrap login-input-wrap--password">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            className={`login-field-input${passwordInvalid ? " login-field-input--invalid" : ""}`}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            autoComplete="current-password"
            required
            minLength={4}
            disabled={formDisabled}
          />
          <button
            type="button"
            className="login-password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={formDisabled}
            aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
          >
            {showPassword ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
          </button>
        </div>
        {passwordInvalid ? (
          <p className="login-field-error">{t("auth.passwordTooShort")}</p>
        ) : null}
      </div>

      <button type="submit" disabled={formDisabled} className="login-submit-btn">
        {busy ? <Loader2 className="login-submit-spinner" aria-hidden /> : null}
        {busy ? t("auth.signingIn") : t("auth.login")}
      </button>

      {onExit ? (
        <button type="button" disabled={formDisabled} className="login-exit-btn" onClick={onExit}>
          {t("auth.exitApp")}
        </button>
      ) : null}
    </form>
  );
}
