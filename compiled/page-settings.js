function SettingsPage() {
  const [profile, setProfile] = window.useStore("profile", window.DEFAULT_PROFILE);
  const [roster, setRoster] = window.useStore("roster", window.DEFAULT_ROSTER);
  const [lastBackupAt, setLastBackupAt] = window.useStore("lastBackupAt", null);
  const [session, setSession] = React.useState(null);
  const [paste, setPaste] = React.useState("");
  const [confirmingWipe, setConfirmingWipe] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [automaticBackups, setAutomaticBackups] = React.useState([]);
  const [backupBusy, setBackupBusy] = React.useState(false);
  const importRef = React.useRef(null);
  React.useEffect(() => {
    window.fcAuth?.session().then(setSession).catch(() => {});
    const sub = window.fcSupabase?.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub?.data?.subscription?.unsubscribe?.();
  }, []);
  React.useEffect(() => {
    let active = true;
    const refresh = () => window.fcBackups?.list().then(items => active && setAutomaticBackups(items)).catch(() => {});
    refresh();
    window.addEventListener("fc:backup-created", refresh);
    window.addEventListener("fc:backup-restored", refresh);
    return () => {
      active = false;
      window.removeEventListener("fc:backup-created", refresh);
      window.removeEventListener("fc:backup-restored", refresh);
    };
  }, []);
  const exportBackup = () => {
    window.downloadJSON(window.exportFutbolClubData(), `futbolclub-backup-${new Date().toISOString().slice(0, 10)}.json`);
    setLastBackupAt(new Date().toISOString());
    window.__toast?.("Backup descargado");
  };
  const importBackup = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > window.FC_BACKUP_MAX_BYTES) throw new Error("El backup no puede superar 5 MB");
      const text = await file.text();
      const payload = JSON.parse(text);
      window.validateFutbolClubData(payload);
      if (!confirm("¿Reemplazar los datos actuales con este backup? Se validó el archivo, pero esta acción cambiará todo el contenido local.")) return;
      const count = window.importFutbolClubData(payload, "replace");
      window.__toast?.(`${count} grupos de datos importados`);
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      window.__toast?.(error.message || "No se pudo importar");
    }
  };
  const importRosterText = () => {
    const available = Math.max(0, 200 - roster.length);
    const parsed = paste.split(/\r?\n/).slice(0, available).map(line => line.trim()).filter(Boolean).map((line, index) => {
      const [name, num, pos] = line.split(",").map(part => part.trim());
      return {
        id: window.nextPlayerId(roster) + index,
        name: name.slice(0, 80),
        num: Math.max(0, Math.min(99, Number(num) || 0)),
        pos: ["ARQ", "DEF", "MED", "DEL"].includes(pos?.toUpperCase()) ? pos.toUpperCase() : "MED",
        photo: null,
        active: true
      };
    }).filter(player => player.name);
    if (!parsed.length) return window.__toast?.("Pegá al menos un jugador");
    setRoster(prev => [...prev, ...parsed]);
    setPaste("");
    window.__toast?.(`${parsed.length} jugadores agregados`);
  };
  const createSafeBackup = async () => {
    setBackupBusy(true);
    try {
      const backup = await window.fcBackups.create("manual", {
        force: true
      });
      window.__toast?.(backup ? "Backup seguro creado" : "Todavía no hay datos para respaldar");
    } catch (error) {
      window.__toast?.(error.message || "No se pudo crear el backup");
    } finally {
      setBackupBusy(false);
    }
  };
  const restoreLatestBackup = async () => {
    const latest = automaticBackups[0];
    if (!latest || !confirm("¿Restaurar el último backup automático? Antes se guardará una copia de seguridad del estado actual.")) return;
    setBackupBusy(true);
    try {
      await window.fcBackups.restore(latest.id);
      window.__toast?.("Backup restaurado correctamente");
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      window.__toast?.(error.message || "No se pudo restaurar el backup");
      setBackupBusy(false);
    }
  };
  const wipeAllData = async () => {
    try {
      await window.fcBackups.create("before-wipe", {
        force: true
      });
      for (const key of window.db.keys()) window.db.remove(key);
      window.__toast?.("Datos eliminados; quedó una copia de seguridad");
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      window.__toast?.(error.message || "No se eliminó nada porque falló el backup preventivo");
    }
  };
  const uploadCloud = async () => {
    setSyncing(true);
    try {
      await window.fcCloud.uploadLocal();
      window.__toast?.("Datos sincronizados");
    } catch (error) {
      if (error.code === "CLOUD_CONFLICT" && confirm(`${error.message}\n\n¿Reemplazar igualmente la versión de la nube?`)) {
        try {
          await window.fcCloud.uploadLocal({
            force: true
          });
          window.__toast?.("Versión de la nube reemplazada");
        } catch (forceError) {
          window.__toast?.(forceError.message || "No se pudo reemplazar la versión de la nube");
        }
      } else if (error.code !== "CLOUD_CONFLICT") {
        window.__toast?.(error.message || "No se pudo sincronizar");
      }
    } finally {
      setSyncing(false);
    }
  };
  const downloadCloud = async () => {
    if (!confirm("Se descargará primero un backup de seguridad y luego se reemplazarán tus datos locales. ¿Continuar?")) return;
    setSyncing(true);
    try {
      await window.fcCloud.downloadToLocal();
      window.__toast?.("Datos recuperados");
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      window.__toast?.(error.message || "No se pudieron recuperar los datos");
    } finally {
      setSyncing(false);
    }
  };
  return React.createElement("div", null, React.createElement("div", {
    className: "page-head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "page-kicker"
  }, "Cuenta y datos"), React.createElement("h1", {
    className: "page-title"
  }, "Tu futbolClub"), React.createElement("div", {
    className: "page-sub"
  }, "Eleg\xED la experiencia, proteg\xE9 tus datos y conect\xE1 tu cuenta cuando quieras sincronizar.")), React.createElement("div", null)), React.createElement("section", {
    className: "card hub-block"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Experiencia principal"), React.createElement("div", {
    className: "experience-grid"
  }, EXPERIENCE_OPTIONS.map(option => React.createElement("button", {
    key: option.id,
    className: `experience-card ${profile.experience === option.id ? "on" : ""}`,
    onClick: () => setProfile(p => ({
      ...p,
      experience: option.id,
      onboardingDone: true
    }))
  }, React.createElement("span", {
    className: "experience-icon"
  }, React.createElement(Icon, {
    name: option.icon,
    size: 22
  })), React.createElement("strong", null, option.title), React.createElement("small", null, option.text))))), React.createElement("div", {
    className: "hub-row"
  }, React.createElement("section", {
    className: "card"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Perfil"), React.createElement("label", {
    className: "field"
  }, React.createElement("span", null, "Tu nombre"), React.createElement("input", {
    maxLength: "80",
    value: profile.displayName || "",
    onChange: e => setProfile(p => ({
      ...p,
      displayName: e.target.value
    })),
    placeholder: "Nombre o apodo"
  })), React.createElement("label", {
    className: "field"
  }, React.createElement("span", null, "Temporada"), React.createElement("input", {
    maxLength: "40",
    value: profile.season || "",
    onChange: e => setProfile(p => ({
      ...p,
      season: e.target.value
    })),
    placeholder: "Ej. 2026 \xB7 Apertura"
  }))), React.createElement("section", {
    className: "card"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Cuenta y sincronizaci\xF3n"), session ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "account-row"
  }, React.createElement("div", {
    className: "avatar-me"
  }, window.initials(session.user?.user_metadata?.full_name || session.user?.email)), React.createElement("div", null, React.createElement("strong", null, session.user?.user_metadata?.full_name || "Cuenta conectada"), React.createElement("small", null, session.user?.email))), React.createElement("div", {
    className: "action-row"
  }, React.createElement("button", {
    className: "btn primary",
    disabled: syncing,
    onClick: uploadCloud
  }, syncing ? "Sincronizando…" : "Subir datos"), React.createElement("button", {
    className: "btn",
    disabled: syncing,
    onClick: downloadCloud
  }, "Recuperar cuenta"), React.createElement("button", {
    className: "btn ghost",
    disabled: syncing,
    onClick: () => window.fcAuth.signOut()
  }, "Cerrar sesi\xF3n")), React.createElement("small", {
    className: "account-note"
  }, "Antes de recuperar datos se descarga autom\xE1ticamente una copia local. Si hay cambios remotos, la app evita sobrescribirlos sin confirmaci\xF3n.")) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "guest-account-state"
  }, React.createElement("span", {
    className: "status-dot"
  }), React.createElement("div", null, React.createElement("strong", null, "Est\xE1s usando futbolClub sin cuenta"), React.createElement("small", null, "Editor, sorteo, camisetas y enlaces compartidos est\xE1n disponibles. Los datos se guardan solamente en este dispositivo."))), React.createElement("div", {
    className: "action-row"
  }, React.createElement("button", {
    className: "btn primary",
    onClick: () => window.go("auth")
  }, "Iniciar sesi\xF3n / Crear cuenta"), React.createElement("button", {
    className: "google-btn sm",
    disabled: !window.fcAuth?.configured,
    onClick: () => window.fcAuth.signInGoogle().catch(e => window.__toast?.(e.message))
  }, React.createElement(GoogleG, {
    size: 16
  }), " ", React.createElement("span", null, "Conectar Google para sincronizar"))), !window.fcAuth?.configured && React.createElement("small", {
    className: "account-note"
  }, "La cuenta es opcional. Podr\xE1s conectarla cuando el servicio de sincronizaci\xF3n est\xE9 configurado.")))), React.createElement("div", {
    className: "hub-row"
  }, React.createElement("section", {
    className: "card"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Backup local"), React.createElement("p", {
    className: "muted"
  }, "Se conservan autom\xE1ticamente hasta 7 copias seguras en este dispositivo. Tambi\xE9n pod\xE9s exportar todo antes de cambiar de equipo.", lastBackupAt && React.createElement(React.Fragment, null, " ", "\xDAltimo backup: ", React.createElement("strong", null, window.relDate(lastBackupAt)), ".")), automaticBackups[0] && React.createElement("p", {
    className: "muted"
  }, "\xDAltima copia autom\xE1tica:", " ", window.relDate(automaticBackups[0].createdAt), " \xB7", " ", automaticBackups.length, " disponible", automaticBackups.length === 1 ? "" : "s", "."), React.createElement("div", {
    className: "action-row"
  }, React.createElement("button", {
    className: "btn primary",
    disabled: backupBusy,
    onClick: createSafeBackup
  }, "Crear copia segura"), React.createElement("button", {
    className: "btn",
    disabled: backupBusy || !automaticBackups.length,
    onClick: restoreLatestBackup
  }, "Restaurar \xFAltima"), React.createElement("button", {
    className: "btn",
    onClick: exportBackup
  }, React.createElement(Icon, {
    name: "download",
    size: 13
  }), " Exportar JSON"), React.createElement("button", {
    className: "btn",
    onClick: () => importRef.current?.click()
  }, React.createElement(Icon, {
    name: "upload",
    size: 13
  }), " Importar")), React.createElement("button", {
    className: "btn ghost",
    onClick: () => window.fcObservability?.downloadDiagnostics()
  }, "Descargar diagn\xF3stico t\xE9cnico"), React.createElement("input", {
    ref: importRef,
    hidden: true,
    type: "file",
    accept: "application/json",
    onChange: importBackup
  })), React.createElement("section", {
    className: "card"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Carga r\xE1pida de jugadores"), React.createElement("textarea", {
    className: "paste-roster",
    value: paste,
    onChange: e => setPaste(e.target.value),
    placeholder: "Martín, 10, MED\nNahuel, 1, ARQ\nFacu, 4, DEF"
  }), React.createElement("button", {
    className: "btn primary",
    onClick: importRosterText
  }, "Agregar al plantel"))), React.createElement(InstallAppCard, null), React.createElement("section", {
    className: "card danger-zone"
  }, React.createElement(Icon, {
    name: "warning",
    size: 20,
    style: {
      color: "var(--accent-2)"
    }
  }), React.createElement("div", {
    className: "danger-copy"
  }, React.createElement("strong", null, "Zona de peligro"), React.createElement("div", null, "Eliminar todos los datos locales: plantel, alineaciones, evaluaciones y liga. No se puede deshacer.")), confirmingWipe ? React.createElement("div", {
    className: "action-row"
  }, React.createElement("button", {
    className: "btn ghost",
    onClick: () => setConfirmingWipe(false)
  }, "Cancelar"), React.createElement("button", {
    className: "btn danger",
    onClick: wipeAllData
  }, "S\xED, borrar todo")) : React.createElement("button", {
    className: "btn danger-outline",
    onClick: () => setConfirmingWipe(true)
  }, React.createElement(Icon, {
    name: "trash",
    size: 13
  }), " Borrar todo\u2026")));
}
function InstallAppCard() {
  const [installable, setInstallable] = React.useState(!!window.__pwaInstallPrompt);
  const [offlineReady, setOfflineReady] = React.useState(false);
  React.useEffect(() => {
    const canInstall = () => setInstallable(!!window.__pwaInstallPrompt);
    const installed = () => setInstallable(false);
    const ready = () => setOfflineReady(true);
    window.addEventListener("fc:pwa-installable", canInstall);
    window.addEventListener("fc:pwa-installed", installed);
    window.addEventListener("fc:pwa-ready", ready);
    navigator.serviceWorker?.ready.then(ready).catch(() => {});
    return () => {
      window.removeEventListener("fc:pwa-installable", canInstall);
      window.removeEventListener("fc:pwa-installed", installed);
      window.removeEventListener("fc:pwa-ready", ready);
    };
  }, []);
  const install = async () => {
    const prompt = window.__pwaInstallPrompt;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    window.__pwaInstallPrompt = null;
    setInstallable(false);
  };
  return React.createElement("section", {
    className: "card"
  }, React.createElement("div", {
    className: "panel-head"
  }, "Aplicaci\xF3n"), React.createElement("p", {
    className: "muted"
  }, offlineReady ? "Lista para abrirse con conexión limitada después de la primera carga." : "Preparando los archivos para uso con conexión limitada…"), installable ? React.createElement("button", {
    className: "btn primary",
    onClick: install
  }, "Instalar futbolClub") : React.createElement("small", {
    className: "account-note"
  }, "Tambi\xE9n pod\xE9s instalarla desde el men\xFA de tu navegador cuando est\xE9 disponible."));
}
//# sourceURL=src/page-settings.jsx
