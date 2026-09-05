// Pantalla de bienvenida: login, registro o continuar sin cuenta
function markAuthIntroSeen() {
  try {
    localStorage.setItem("fc.v1.authIntroSeen", "1");
  } catch (_) {}
}
window.fcMarkAuthSeen = markAuthIntroSeen;

function AuthPage() {
  const [mode, setMode] = React.useState("login"); // 'login' | 'register'
  const [recovering, setRecovering] = React.useState(!!window.fcRecoveryMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const configured = !!window.fcAuth?.configured;

  React.useEffect(() => {
    const enterRecovery = () => setRecovering(true);
    window.addEventListener("fc:password-recovery", enterRecovery);
    return () =>
      window.removeEventListener("fc:password-recovery", enterRecovery);
  }, []);

  const goHomeAsGuest = () => {
    markAuthIntroSeen();
    window.go("home");
  };

  const submit = async (e) => {
    e.preventDefault();
    if ((!recovering && !email.trim()) || !password)
      return window.__toast?.("Completá los datos requeridos");
    if ((mode === "register" || recovering) && password.length < 8)
      return window.__toast?.("La contraseña debe tener al menos 8 caracteres");
    if ((mode === "register" || recovering) && password !== confirm)
      return window.__toast?.("Las contraseñas no coinciden");
    setLoading(true);
    try {
      if (recovering) {
        await window.fcAuth.updatePassword(password);
        window.fcRecoveryMode = false;
        setRecovering(false);
        window.__toast?.("Contraseña actualizada");
      } else if (mode === "login") {
        await window.fcAuth.signInEmail(email.trim(), password);
        window.__toast?.("Sesión iniciada");
      } else {
        await window.fcAuth.signUpEmail(email.trim(), password);
        window.__toast?.("Cuenta creada");
      }
      markAuthIntroSeen();
      window.go("settings");
    } catch (error) {
      window.__toast?.(error.message || "No se pudo completar la operación");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    try {
      await window.fcAuth.signInGoogle();
      markAuthIntroSeen();
    } catch (error) {
      window.__toast?.(error.message || "No se pudo conectar con Google");
    }
  };

  const forgotPassword = async () => {
    if (!email.trim())
      return window.__toast?.("Escribí tu email arriba primero");
    try {
      await window.fcAuth.resetPassword(email.trim());
      window.__toast?.("Te enviamos un email para restablecer la contraseña");
    } catch (error) {
      window.__toast?.(error.message || "No se pudo enviar el email");
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <img src="icons/icon.svg" alt="" />
          </div>
          <div className="brand-name">
            futbol<em>Club</em>
          </div>
        </div>

        {!recovering && (
          <div
            className="auth-tabs"
            role="tablist"
            aria-label="Acceso a la cuenta"
          >
            <button
              role="tab"
              aria-selected={mode === "login"}
              className={mode === "login" ? "on" : ""}
              onClick={() => setMode("login")}
            >
              Iniciar sesión
            </button>
            <button
              role="tab"
              aria-selected={mode === "register"}
              className={mode === "register" ? "on" : ""}
              onClick={() => setMode("register")}
            >
              Crear cuenta
            </button>
          </div>
        )}

        <p className="auth-sub">
          {recovering
            ? "Elegí una contraseña nueva para recuperar el acceso a tu cuenta."
            : mode === "login"
              ? "Entrá para sincronizar tu plantel y alineaciones entre dispositivos."
              : "Creá una cuenta para guardar tus datos en la nube. Es totalmente opcional."}
        </p>

        <form className="auth-form" onSubmit={submit}>
          {!recovering && (
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </label>
          )}
          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          {(mode === "register" || recovering) && (
            <label className="field">
              <span>Confirmar contraseña</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </label>
          )}
          <button className="btn primary lg" type="submit" disabled={loading}>
            {loading
              ? "Un momento…"
              : recovering
                ? "Guardar contraseña nueva"
                : mode === "login"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
          </button>
          {!recovering && mode === "login" && (
            <button
              type="button"
              className="auth-forgot"
              onClick={forgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </form>

        {!recovering && (
          <div className="auth-switch">
            {mode === "login" ? (
              <>
                ¿No tenés cuenta?{" "}
                <button onClick={() => setMode("register")}>Creá una</button>
              </>
            ) : (
              <>
                ¿Ya tenés cuenta?{" "}
                <button onClick={() => setMode("login")}>Iniciá sesión</button>
              </>
            )}
          </div>
        )}

        {!recovering && (
          <>
            <div className="auth-divider">
              <span>o</span>
            </div>

            <button
              className="google-btn"
              onClick={google}
              disabled={!configured}
            >
              <GoogleG size={18} /> <span>Continuar con Google</span>
            </button>
            {!configured && (
              <div className="auth-provider-note">
                La conexión de cuentas todavía no está configurada. Podés
                continuar como invitado.
              </div>
            )}

            <button className="auth-guest-btn" onClick={goHomeAsGuest}>
              Continuar sin cuenta
            </button>
          </>
        )}
      </div>
    </div>
  );
}

window.mountPage("page-auth", <AuthPage />);
