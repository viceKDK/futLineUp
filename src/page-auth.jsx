// Pantalla de bienvenida: login, registro o continuar sin cuenta
function markAuthIntroSeen() {
  try { localStorage.setItem('fc.v1.authIntroSeen', '1'); } catch (_) {}
}
window.fcMarkAuthSeen = markAuthIntroSeen;

function AuthPage() {
  const [mode, setMode] = React.useState('login'); // 'login' | 'register'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const configured = !!window.fcAuth?.configured;

  const goHomeAsGuest = () => {
    markAuthIntroSeen();
    window.go('home');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return window.__toast?.('Completá email y contraseña');
    if (mode === 'register' && password !== confirm) return window.__toast?.('Las contraseñas no coinciden');
    setLoading(true);
    try {
      if (mode === 'login') {
        await window.fcAuth.signInEmail(email.trim(), password);
        window.__toast?.('Sesión iniciada');
      } else {
        await window.fcAuth.signUpEmail(email.trim(), password);
        window.__toast?.('Cuenta creada');
      }
      markAuthIntroSeen();
      window.go('settings');
    } catch (error) {
      window.__toast?.(error.message || 'No se pudo completar la operación');
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    try {
      await window.fcAuth.signInGoogle();
      markAuthIntroSeen();
    } catch (error) {
      window.__toast?.(error.message || 'No se pudo conectar con Google');
    }
  };

  const forgotPassword = async () => {
    if (!email.trim()) return window.__toast?.('Escribí tu email arriba primero');
    try {
      await window.fcAuth.resetPassword(email.trim());
      window.__toast?.('Te enviamos un email para restablecer la contraseña');
    } catch (error) {
      window.__toast?.(error.message || 'No se pudo enviar el email');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><span>fC</span></div>
          <div className="brand-name">futbol<em>Club</em></div>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Iniciar sesión</button>
          <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Crear cuenta</button>
        </div>

        <p className="auth-sub">
          {mode === 'login'
            ? 'Entrá para sincronizar tu plantel y alineaciones entre dispositivos.'
            : 'Creá una cuenta para guardar tus datos en la nube. Es totalmente opcional.'}
        </p>

        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>Email</span>
            <input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
          </label>
          <label className="field">
            <span>Contraseña</span>
            <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          {mode === 'register' && (
            <label className="field">
              <span>Confirmar contraseña</span>
              <input type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" />
            </label>
          )}
          <button className="btn primary lg" type="submit" disabled={loading}>
            {loading ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
          {mode === 'login' && (
            <button type="button" className="auth-forgot" onClick={forgotPassword}>¿Olvidaste tu contraseña?</button>
          )}
        </form>

        <div className="auth-switch">
          {mode === 'login'
            ? <>¿No tenés cuenta? <button onClick={() => setMode('register')}>Creá una</button></>
            : <>¿Ya tenés cuenta? <button onClick={() => setMode('login')}>Iniciá sesión</button></>}
        </div>

        <div className="auth-divider"><span>o</span></div>

        <button className="google-btn" onClick={google} disabled={!configured}>
          <GoogleG size={18} /> <span>Continuar con Google</span>
        </button>

        <button className="auth-guest-btn" onClick={goHomeAsGuest}>
          Continuar sin cuenta
        </button>
      </div>
    </div>
  );
}

const authCSS = document.createElement("style");
authCSS.textContent = `
  .auth-screen {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    background:
      radial-gradient(circle at 15% 10%, color-mix(in oklch, var(--accent) 7%, transparent), transparent 45%),
      var(--bg);
  }
  .auth-card {
    width: 100%; max-width: 400px;
    background: var(--bg-elev);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-l);
    padding: 32px 28px;
    box-shadow: var(--shadow);
  }
  .auth-brand { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 22px; }
  .auth-tabs {
    display: flex; background: var(--bg-elev-2); border: 1px solid var(--line);
    border-radius: 8px; overflow: hidden; margin-bottom: 14px;
  }
  .auth-tabs button {
    flex: 1; padding: 10px; font-size: 13px; font-weight: 600; color: var(--fg-mute);
    background: transparent;
  }
  .auth-tabs button.on { background: var(--accent); color: #0e1210; }
  .auth-sub { color: var(--fg-mute); font-size: 12.5px; text-align: center; margin: 0 0 18px; }
  .auth-form { display: flex; flex-direction: column; }
  .auth-form .btn.lg { margin-top: 4px; width: 100%; justify-content: center; }
  .auth-forgot { align-self: center; margin-top: 10px; font-size: 12px; color: var(--fg-dim); }
  .auth-forgot:hover { color: var(--accent); }
  .auth-switch { text-align: center; font-size: 12.5px; color: var(--fg-mute); margin: 14px 0 2px; }
  .auth-switch button { color: var(--accent); font-weight: 600; }
  .auth-divider { display: flex; align-items: center; gap: 10px; margin: 18px 0; color: var(--fg-dim); font-size: 11px; }
  .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--line-soft); }
  .google-btn {
    width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 10px 16px;
    background: #fff; border: 1px solid #dadce0; border-radius: 4px;
    color: #3c4043; font-family: Roboto, Arial, sans-serif; font-size: 14px; font-weight: 500;
    transition: box-shadow .15s, background .15s;
  }
  .google-btn:hover:not(:disabled) { background: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
  .google-btn:disabled { opacity: .5; cursor: not-allowed; }
  .auth-guest-btn {
    display: flex; align-items: center; justify-content: center;
    width: 100%; margin-top: 20px;
    padding: 13px 16px;
    background: var(--accent);
    border: 1px solid var(--accent);
    border-radius: var(--radius-s);
    color: #0e1210;
    font-size: 14px; font-weight: 700;
    transition: background .15s, transform .1s;
  }
  .auth-guest-btn:hover { background: oklch(0.90 0.17 124); }
  .auth-guest-btn:active { transform: translateY(1px); }
`;
document.head.appendChild(authCSS);

ReactDOM.createRoot(document.getElementById("page-auth")).render(<AuthPage />);
