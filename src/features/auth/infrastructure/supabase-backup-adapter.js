export function createSupabaseBackupAdapter(client) {
  return Object.freeze({
    async session() { return (await client.auth.getSession()).data.session; },
    async metadata(userId) { const { data, error } = await client.from("user_backups").select("updated_at").eq("user_id", userId).maybeSingle(); if (error) throw error; return data ? { updatedAt: data.updated_at } : null; },
    async upload(userId, payload) { const { data, error } = await client.from("user_backups").upsert({ user_id: userId, payload }).select("updated_at").single(); if (error) throw error; return data.updated_at; },
    async download(userId) { const { data, error } = await client.from("user_backups").select("payload,updated_at").eq("user_id", userId).maybeSingle(); if (error) throw error; return data ? { payload: data.payload, updatedAt: data.updated_at } : null; },
  });
}
export function createSyncStamp({ storage, memory = new Map() }) {
  return Object.freeze({
    read(key) { try { return storage.getItem(key) || memory.get(key) || null; } catch { return memory.get(key) || null; } },
    write(key, value) { memory.set(key, value); try { storage.setItem(key, value); } catch { /* memory is the fallback */ } },
  });
}
