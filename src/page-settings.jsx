// ---- Settings / Hub ----
function SettingsPage() {
  const [profile, setProfile] = window.useStore(
    "profile",
    window.DEFAULT_PROFILE,
  );
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
    window.fcAuth
      ?.session()
      .then(setSession)
      .catch(() => {});
    const sub = window.fcSupabase?.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );
    return () => sub?.data?.subscription?.unsubscribe?.();
  }, []);

  React.useEffect(() => {
    let active = true;
    const refresh = () =>
      window.fcBackups
        ?.list()
        .then((items) => active && setAutomaticBackups(items))
        .catch(() => {});
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
    window.downloadJSON(
      window.exportFutbolClubData(),
      `futbolclub-backup-${new Date().toISOString().slice(0, 10)}.json`,
    );
    setLastBackupAt(new Date().toISOString());
    window.__toast?.("Backup descargado");
  };
  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      if (file.size > window.FC_BACKUP_MAX_BYTES)
        throw new Error("El backup no puede superar 5 MB");
      const text = await file.text();
      const payload = JSON.parse(text);
      window.validateFutbolClubData(payload);
      if (
        !confirm(
          "¿Reemplazar los datos actuales con este backup? Se validó el archivo, pero esta acción cambiará todo el contenido local.",
        )
      )
        return;
      const count = window.importFutbolClubData(payload, "replace");
      window.__toast?.(`${count} grupos de datos importados`);
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      window.__toast?.(error.message || "No se pudo importar");
    }
  };
  const importRosterText = () => {
    const available = Math.max(0, 200 - roster.length);
    const parsed = paste
      .split(/\r?\n/)
      .slice(0, available)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [name, num, pos] = line.split(",").map((part) => part.trim());
        return {
          id: window.nextPlayerId(roster) + index,
          name: name.slice(0, 80),
          num: Math.max(0, Math.min(99, Number(num) || 0)),
          pos: ["ARQ", "DEF", "MED", "DEL"].includes(pos?.toUpperCase())
            ? pos.toUpperCase()
            : "MED",
          photo: null,
          active: true,
        };
      })
      .filter((player) => player.name);
    if (!parsed.length) return window.__toast?.("Pegá al menos un jugador");
    setRoster((prev) => [...prev, ...parsed]);
    setPaste("");
    window.__toast?.(`${parsed.length} jugadores agregados`);
  };
  const createSafeBackup = async () => {
    setBackupBusy(true);
    try {
      const backup = await window.fcBackups.create("manual", { force: true });
      window.__toast?.(
        backup ? "Backup seguro creado" : "Todavía no hay datos para respaldar",
      );
    } catch (error) {
      window.__toast?.(error.message || "No se pudo crear el backup");
    } finally {
      setBackupBusy(false);
    }
  };
  const restoreLatestBackup = async () => {
    const latest = automaticBackups[0];
    if (
      !latest ||
      !confirm(
        "¿Restaurar el último backup automático? Antes se guardará una copia de seguridad del estado actual.",
      )
    )
      return;
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
      await window.fcBackups.create("before-wipe", { force: true });
      for (const key of window.db.keys()) window.db.remove(key);
      window.__toast?.("Datos eliminados; quedó una copia de seguridad");
      setTimeout(() => location.reload(), 500);
    } catch (error) {
      window.__toast?.(
        error.message || "No se eliminó nada porque falló el backup preventivo",
      );
    }
  };
  const uploadCloud = async () => {
    setSyncing(true);
    try {
      await window.fcCloud.uploadLocal();
      window.__toast?.("Datos sincronizados");
    } catch (error) {
      if (
        error.code === "CLOUD_CONFLICT" &&
        confirm(
          `${error.message}\n\n¿Reemplazar igualmente la versión de la nube?`,
        )
      ) {
        try {
          await window.fcCloud.uploadLocal({ force: true });
          window.__toast?.("Versión de la nube reemplazada");
        } catch (forceError) {
          window.__toast?.(
            forceError.message || "No se pudo reemplazar la versión de la nube",
          );
        }
      } else if (error.code !== "CLOUD_CONFLICT") {
        window.__toast?.(error.message || "No se pudo sincronizar");
      }
    } finally {
      setSyncing(false);
    }
  };
  const downloadCloud = async () => {
    if (
      !confirm(
        "Se descargará primero un backup de seguridad y luego se reemplazarán tus datos locales. ¿Continuar?",
      )
    )
      return;
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

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="page-kicker">Cuenta y datos</div>
          <h1 className="page-title">Tu futbolClub</h1>
          <div className="page-sub">
            Elegí la experiencia, protegé tus datos y conectá tu cuenta cuando
            quieras sincronizar.
          </div>
        </div>
        <div />
      </div>

      <section className="card hub-block">
        <div className="panel-head">Experiencia principal</div>
        <div className="experience-grid">
          {EXPERIENCE_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={`experience-card ${profile.experience === option.id ? "on" : ""}`}
              onClick={() =>
                setProfile((p) => ({
                  ...p,
                  experience: option.id,
                  onboardingDone: true,
                }))
              }
            >
              <span className="experience-icon">
                <Icon name={option.icon} size={22} />
              </span>
              <strong>{option.title}</strong>
              <small>{option.text}</small>
            </button>
          ))}
        </div>
      </section>

      <div className="hub-row">
        <section className="card">
          <div className="panel-head">Perfil</div>
          <label className="field">
            <span>Tu nombre</span>
            <input
              maxLength="80"
              value={profile.displayName || ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, displayName: e.target.value }))
              }
              placeholder="Nombre o apodo"
            />
          </label>
          <label className="field">
            <span>Temporada</span>
            <input
              maxLength="40"
              value={profile.season || ""}
              onChange={(e) =>
                setProfile((p) => ({ ...p, season: e.target.value }))
              }
              placeholder="Ej. 2026 · Apertura"
            />
          </label>
        </section>
        <section className="card">
          <div className="panel-head">Cuenta y sincronización</div>
          {session ? (
            <>
              <div className="account-row">
                <div className="avatar-me">
                  {window.initials(
                    session.user?.user_metadata?.full_name ||
                      session.user?.email,
                  )}
                </div>
                <div>
                  <strong>
                    {session.user?.user_metadata?.full_name ||
                      "Cuenta conectada"}
                  </strong>
                  <small>{session.user?.email}</small>
                </div>
              </div>
              <div className="action-row">
                <button
                  className="btn primary"
                  disabled={syncing}
                  onClick={uploadCloud}
                >
                  {syncing ? "Sincronizando…" : "Subir datos"}
                </button>
                <button
                  className="btn"
                  disabled={syncing}
                  onClick={downloadCloud}
                >
                  Recuperar cuenta
                </button>
                <button
                  className="btn ghost"
                  disabled={syncing}
                  onClick={() => window.fcAuth.signOut()}
                >
                  Cerrar sesión
                </button>
              </div>
              <small className="account-note">
                Antes de recuperar datos se descarga automáticamente una copia
                local. Si hay cambios remotos, la app evita sobrescribirlos sin
                confirmación.
              </small>
            </>
          ) : (
            <>
              <div className="guest-account-state">
                <span className="status-dot"></span>
                <div>
                  <strong>Estás usando futbolClub sin cuenta</strong>
                  <small>
                    Editor, sorteo, camisetas y enlaces compartidos están
                    disponibles. Los datos se guardan solamente en este
                    dispositivo.
                  </small>
                </div>
              </div>
              <div className="action-row">
                <button
                  className="btn primary"
                  onClick={() => window.go("auth")}
                >
                  Iniciar sesión / Crear cuenta
                </button>
                <button
                  className="google-btn sm"
                  disabled={!window.fcAuth?.configured}
                  onClick={() =>
                    window.fcAuth
                      .signInGoogle()
                      .catch((e) => window.__toast?.(e.message))
                  }
                >
                  <GoogleG size={16} />{" "}
                  <span>Conectar Google para sincronizar</span>
                </button>
              </div>
              {!window.fcAuth?.configured && (
                <small className="account-note">
                  La cuenta es opcional. Podrás conectarla cuando el servicio de
                  sincronización esté configurado.
                </small>
              )}
            </>
          )}
        </section>
      </div>

      <div className="hub-row">
        <section className="card">
          <div className="panel-head">Backup local</div>
          <p className="muted">
            Se conservan automáticamente hasta 7 copias seguras en este
            dispositivo. También podés exportar todo antes de cambiar de equipo.
            {lastBackupAt && (
              <>
                {" "}
                Último backup: <strong>{window.relDate(lastBackupAt)}</strong>.
              </>
            )}
          </p>
          {automaticBackups[0] && (
            <p className="muted">
              Última copia automática:{" "}
              {window.relDate(automaticBackups[0].createdAt)} ·{" "}
              {automaticBackups.length} disponible
              {automaticBackups.length === 1 ? "" : "s"}.
            </p>
          )}
          <div className="action-row">
            <button
              className="btn primary"
              disabled={backupBusy}
              onClick={createSafeBackup}
            >
              Crear copia segura
            </button>
            <button
              className="btn"
              disabled={backupBusy || !automaticBackups.length}
              onClick={restoreLatestBackup}
            >
              Restaurar última
            </button>
            <button className="btn" onClick={exportBackup}>
              <Icon name="download" size={13} /> Exportar JSON
            </button>
            <button className="btn" onClick={() => importRef.current?.click()}>
              <Icon name="upload" size={13} /> Importar
            </button>
          </div>
          <button
            className="btn ghost"
            onClick={() => window.fcObservability?.downloadDiagnostics()}
          >
            Descargar diagnóstico técnico
          </button>
          <input
            ref={importRef}
            hidden
            type="file"
            accept="application/json"
            onChange={importBackup}
          />
        </section>
        <section className="card">
          <div className="panel-head">Carga rápida de jugadores</div>
          <textarea
            className="paste-roster"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={"Martín, 10, MED\nNahuel, 1, ARQ\nFacu, 4, DEF"}
          />
          <button className="btn primary" onClick={importRosterText}>
            Agregar al plantel
          </button>
        </section>
      </div>

      <InstallAppCard />

      <section className="card danger-zone">
        <Icon name="warning" size={20} style={{ color: "var(--accent-2)" }} />
        <div className="danger-copy">
          <strong>Zona de peligro</strong>
          <div>
            Eliminar todos los datos locales: plantel, alineaciones,
            evaluaciones y liga. No se puede deshacer.
          </div>
        </div>
        {confirmingWipe ? (
          <div className="action-row">
            <button
              className="btn ghost"
              onClick={() => setConfirmingWipe(false)}
            >
              Cancelar
            </button>
            <button className="btn danger" onClick={wipeAllData}>
              Sí, borrar todo
            </button>
          </div>
        ) : (
          <button
            className="btn danger-outline"
            onClick={() => setConfirmingWipe(true)}
          >
            <Icon name="trash" size={13} /> Borrar todo…
          </button>
        )}
      </section>
    </div>
  );
}

function InstallAppCard() {
  const [installable, setInstallable] = React.useState(
    !!window.__pwaInstallPrompt,
  );
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

  return (
    <section className="card">
      <div className="panel-head">Aplicación</div>
      <p className="muted">
        {offlineReady
          ? "Lista para abrirse con conexión limitada después de la primera carga."
          : "Preparando los archivos para uso con conexión limitada…"}
      </p>
      {installable ? (
        <button className="btn primary" onClick={install}>
          Instalar futbolClub
        </button>
      ) : (
        <small className="account-note">
          También podés instalarla desde el menú de tu navegador cuando esté
          disponible.
        </small>
      )}
    </section>
  );
}
