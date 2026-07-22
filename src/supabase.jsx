// Optional Supabase integration. Configure window.SUPABASE_CONFIG in src/local-config.js.
(function initSupabase() {
  const config = window.SUPABASE_CONFIG;
  const factory = window.supabase?.createClient;
  if (!config?.url || !config?.anonKey || !factory) {
    window.fcSupabase = null;
    window.fcAuth = {
      configured: false,
      async signInGoogle() { throw new Error('Supabase no está configurado'); },
      async signInEmail() { throw new Error('Supabase no está configurado'); },
      async signUpEmail() { throw new Error('Supabase no está configurado'); },
      async resetPassword() { throw new Error('Supabase no está configurado'); },
      async signOut() {},
      async session() { return null; },
    };
    return;
  }

  const client = factory(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  window.fcSupabase = client;
  window.fcCloud = {
    async uploadLocal() {
      const session = (await client.auth.getSession()).data.session;
      if (!session) throw new Error('Iniciá sesión para sincronizar');
      const payload = window.exportFutbolClubData();
      const { error } = await client.from('user_backups').upsert({ user_id: session.user.id, payload, updated_at: new Date().toISOString() });
      if (error) throw error;
      return payload;
    },
    async downloadToLocal() {
      const session = (await client.auth.getSession()).data.session;
      if (!session) throw new Error('Iniciá sesión para sincronizar');
      const { data, error } = await client.from('user_backups').select('payload,updated_at').eq('user_id', session.user.id).maybeSingle();
      if (error) throw error;
      if (!data?.payload) throw new Error('La cuenta todavía no tiene un backup');
      window.importFutbolClubData(data.payload, 'replace');
      return data.updated_at;
    },
  };
  window.fcAuth = {
    configured: true,
    async signInGoogle() {
      return client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${location.origin}${location.pathname}#settings` },
      });
    },
    async signInEmail(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
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
    async signOut() { return client.auth.signOut(); },
    async session() { return (await client.auth.getSession()).data.session; },
  };
})();