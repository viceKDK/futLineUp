function markAuthIntroSeen() {
  try {
    localStorage.setItem("fc.v1.authIntroSeen", "1");
  } catch (_) {}
}
window.fcMarkAuthSeen = markAuthIntroSeen;
function AuthPage() {
  const [mode, setMode] = React.useState("login");
  const [recovering, setRecovering] = React.useState(!!window.fcRecoveryMode);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const configured = !!window.fcAuth?.configured;
  React.useEffect(() => {
    const enterRecovery = () => setRecovering(true);
    window.addEventListener("fc:password-recovery", enterRecovery);
    return () => window.removeEventListener("fc:password-recovery", enterRecovery);
  }, []);
  const goHomeAsGuest = () => {
    markAuthIntroSeen();
    window.go("home");
  };
  const submit = async e => {
    e.preventDefault();
    if (!recovering && !email.trim() || !password) return window.__toast?.("Completá los datos requeridos");
    if ((mode === "register" || recovering) && password.length < 8) return window.__toast?.("La contraseña debe tener al menos 8 caracteres");
    if ((mode === "register" || recovering) && password !== confirm) return window.__toast?.("Las contraseñas no coinciden");
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
    if (!email.trim()) return window.__toast?.("Escribí tu email arriba primero");
    try {
      await window.fcAuth.resetPassword(email.trim());
      window.__toast?.("Te enviamos un email para restablecer la contraseña");
    } catch (error) {
      window.__toast?.(error.message || "No se pudo enviar el email");
    }
  };
  return React.createElement("div", {
    className: "auth-screen"
  }, React.createElement("div", {
    className: "auth-card"
  }, React.createElement("div", {
    className: "auth-brand"
  }, React.createElement("div", {
    className: "brand-mark"
  }, React.createElement("img", {
    src: "icons/icon.svg",
    alt: ""
  })), React.createElement("div", {
    className: "brand-name"
  }, "futbol", React.createElement("em", null, "Club"))), !recovering && React.createElement("div", {
    className: "auth-tabs",
    role: "tablist",
    "aria-label": "Acceso a la cuenta"
  }, React.createElement("button", {
    role: "tab",
    "aria-selected": mode === "login",
    className: mode === "login" ? "on" : "",
    onClick: () => setMode("login")
  }, "Iniciar sesi\xF3n"), React.createElement("button", {
    role: "tab",
    "aria-selected": mode === "register",
    className: mode === "register" ? "on" : "",
    onClick: () => setMode("register")
  }, "Crear cuenta")), React.createElement("p", {
    className: "auth-sub"
  }, recovering ? "Elegí una contraseña nueva para recuperar el acceso a tu cuenta." : mode === "login" ? "Entrá para sincronizar tu plantel y alineaciones entre dispositivos." : "Creá una cuenta para guardar tus datos en la nube. Es totalmente opcional."), React.createElement("form", {
    className: "auth-form",
    onSubmit: submit
  }, !recovering && React.createElement("label", {
    className: "field"
  }, React.createElement("span", null, "Email"), React.createElement("input", {
    type: "email",
    autoComplete: "email",
    value: email,
    onChange: e => setEmail(e.target.value),
    placeholder: "tu@email.com"
  })), React.createElement("label", {
    className: "field"
  }, React.createElement("span", null, "Contrase\xF1a"), React.createElement("input", {
    type: "password",
    autoComplete: mode === "login" ? "current-password" : "new-password",
    value: password,
    onChange: e => setPassword(e.target.value),
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  })), (mode === "register" || recovering) && React.createElement("label", {
    className: "field"
  }, React.createElement("span", null, "Confirmar contrase\xF1a"), React.createElement("input", {
    type: "password",
    autoComplete: "new-password",
    value: confirm,
    onChange: e => setConfirm(e.target.value),
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  })), React.createElement("button", {
    className: "btn primary lg",
    type: "submit",
    disabled: loading
  }, loading ? "Un momento…" : recovering ? "Guardar contraseña nueva" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"), !recovering && mode === "login" && React.createElement("button", {
    type: "button",
    className: "auth-forgot",
    onClick: forgotPassword
  }, "\xBFOlvidaste tu contrase\xF1a?")), !recovering && React.createElement("div", {
    className: "auth-switch"
  }, mode === "login" ? React.createElement(React.Fragment, null, "\xBFNo ten\xE9s cuenta?", " ", React.createElement("button", {
    onClick: () => setMode("register")
  }, "Cre\xE1 una")) : React.createElement(React.Fragment, null, "\xBFYa ten\xE9s cuenta?", " ", React.createElement("button", {
    onClick: () => setMode("login")
  }, "Inici\xE1 sesi\xF3n"))), !recovering && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "auth-divider"
  }, React.createElement("span", null, "o")), React.createElement("button", {
    className: "google-btn",
    onClick: google,
    disabled: !configured
  }, React.createElement(GoogleG, {
    size: 18
  }), " ", React.createElement("span", null, "Continuar con Google")), !configured && React.createElement("div", {
    className: "auth-provider-note"
  }, "La conexi\xF3n de cuentas todav\xEDa no est\xE1 configurada. Pod\xE9s continuar como invitado."), React.createElement("button", {
    className: "auth-guest-btn",
    onClick: goHomeAsGuest
  }, "Continuar sin cuenta"))));
}
window.mountPage("page-auth", React.createElement(AuthPage, null));
//# sourceURL=src/page-auth.jsx
