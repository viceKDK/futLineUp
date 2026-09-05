// Optional Supabase integration. Configure window.SUPABASE_CONFIG in src/local-config.js.
(function initSupabase() {
  const config = window.SUPABASE_CONFIG;
  const factory = window.supabase?.createClient;
  if (!config?.url || !config?.anonKey || !factory) {
    window.fcSupabase = null;
    window.fcAuth = {
      configured: false,
      async signInGoogle() {
        throw new Error("Supabase no está configurado");
      },
      async signInEmail() {
        throw new Error("Supabase no está configurado");
      },
      async signUpEmail() {
        throw new Error("Supabase no está configurado");
      },
      async resetPassword() {
        throw new Error("Supabase no está configurado");
      },
      async updatePassword() {
        throw new Error("Supabase no está configurado");
      },
      async signOut() {},
      async session() {
        return null;
      },
    };
    return;
  }

  const client = factory(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  const syncMemory = new Map();
  const readSyncStamp = (key) => {
    try {
      return localStorage.getItem(key) || syncMemory.get(key) || null;
    } catch (_) {
      return syncMemory.get(key) || null;
    }
  };
  const writeSyncStamp = (key, value) => {
    syncMemory.set(key, value);
    try {
      localStorage.setItem(key, value);
    } catch (_) {}
  };
  window.fcSupabase = client;
  window.fcCloud = {
    async uploadLocal({ force = false } = {}) {
      const session = (await client.auth.getSession()).data.session;
      if (!session) throw new Error("Iniciá sesión para sincronizar");
      const payload = window.exportFutbolClubData();
      const bytes = new TextEncoder().encode(
        JSON.stringify(payload),
      ).byteLength;
      if (bytes > window.FC_BACKUP_MAX_BYTES)
        throw new Error(
          "Tus datos superan el límite de sincronización de 5 MB. Exportá un backup y reducí las fotos.",
        );
      const { data: remote, error: readError } = await client
        .from("user_backups")
        .select("updated_at")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (readError) throw readError;
      const syncKey = `fc.cloud.lastSyncAt.${session.user.id}`;
      const lastSync = readSyncStamp(syncKey);
      if (!force && remote?.updated_at && remote.updated_at !== lastSync) {
        const conflict = new Error(
          "Hay una versión más nueva en la nube. Recuperala o confirmá que querés reemplazarla.",
        );
        conflict.code = "CLOUD_CONFLICT";
        throw conflict;
      }
      const { data, error } = await client
        .from("user_backups")
        .upsert({ user_id: session.user.id, payload })
        .select("updated_at")
        .single();
      if (error) throw error;
      writeSyncStamp(syncKey, data.updated_at);
      return payload;
    },
    async downloadToLocal() {
      const session = (await client.auth.getSession()).data.session;
      if (!session) throw new Error("Iniciá sesión para sincronizar");
      const { data, error } = await client
        .from("user_backups")
        .select("payload,updated_at")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data?.payload)
        throw new Error("La cuenta todavía no tiene un backup");
      window.validateFutbolClubData(data.payload);
      window.downloadJSON(
        window.exportFutbolClubData(),
        `futbolclub-antes-de-sincronizar-${new Date().toISOString().slice(0, 10)}.json`,
      );
      window.importFutbolClubData(data.payload, "replace");
      writeSyncStamp(`fc.cloud.lastSyncAt.${session.user.id}`, data.updated_at);
      return data.updated_at;
    },
  };
  window.fcAuth = {
    configured: true,
    async signInGoogle() {
      return client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${location.origin}${location.pathname}#settings`,
        },
      });
    },
    async signInEmail(email, password) {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    async signUpEmail(email, password) {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;
      return data;
    },
    async resetPassword(email) {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}${location.pathname}#auth`,
      });
      if (error) throw error;
    },
    async updatePassword(password) {
      const { data, error } = await client.auth.updateUser({ password });
      if (error) throw error;
      return data;
    },
    async signOut() {
      return client.auth.signOut();
    },
    async session() {
      return (await client.auth.getSession()).data.session;
    },
  };
  client.auth.onAuthStateChange((event) => {
    if (event !== "PASSWORD_RECOVERY") return;
    window.fcRecoveryMode = true;
    window.dispatchEvent(new CustomEvent("fc:password-recovery"));
    window.go?.("auth");
  });
})();
