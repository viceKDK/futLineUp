import { createClient } from "@supabase/supabase-js";
import { test, expect } from "@playwright/test";

const config = {
  url: process.env.SUPABASE_TEST_URL,
  anonKey: process.env.SUPABASE_TEST_ANON_KEY,
  email: process.env.SUPABASE_TEST_EMAIL,
  password: process.env.SUPABASE_TEST_PASSWORD,
};
const configured = Object.values(config).every(Boolean);

test.describe("Supabase staging", () => {
  test.skip(
    !configured,
    "Definí SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY, SUPABASE_TEST_EMAIL y SUPABASE_TEST_PASSWORD",
  );
  test.describe.configure({ mode: "serial" });

  test("una sesión anónima no puede leer backups", async () => {
    const client = createClient(config.url, config.anonKey, {
      auth: { persistSession: false },
    });
    const { data, error } = await client.from("user_backups").select("user_id");
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  test("el usuario autenticado puede guardar y recuperar solamente su backup", async () => {
    const client = createClient(config.url, config.anonKey, {
      auth: { persistSession: false },
    });
    const { data: auth, error: authError } =
      await client.auth.signInWithPassword({
        email: config.email,
        password: config.password,
      });
    expect(authError).toBeNull();
    const userId = auth.user.id;
    const { data: original, error: originalError } = await client
      .from("user_backups")
      .select("payload")
      .eq("user_id", userId)
      .maybeSingle();
    expect(originalError).toBeNull();

    const marker = `quality-${Date.now()}`;
    try {
      const { error: writeError } = await client
        .from("user_backups")
        .upsert({ user_id: userId, payload: { qualityMarker: marker } });
      expect(writeError).toBeNull();
      const { data, error } = await client
        .from("user_backups")
        .select("payload")
        .eq("user_id", userId)
        .single();
      expect(error).toBeNull();
      expect(data.payload.qualityMarker).toBe(marker);
    } finally {
      if (original) {
        await client
          .from("user_backups")
          .upsert({ user_id: userId, payload: original.payload });
      } else {
        await client.from("user_backups").delete().eq("user_id", userId);
      }
      await client.auth.signOut();
    }
  });
});
