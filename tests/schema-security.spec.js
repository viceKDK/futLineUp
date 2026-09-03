import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const schemaPath = new URL("../supabase/schema.sql", import.meta.url);

test("RLS cubre todas las tablas y no conserva políticas amplias antiguas", async () => {
  const sql = await readFile(schemaPath, "utf8");
  const protectedTables = [
    "profiles",
    "workspaces",
    "workspace_members",
    "teams",
    "players",
    "team_players",
    "formations",
    "matches",
    "training_sessions",
    "attendance",
    "player_evaluations",
    "competitions",
    "fixtures",
    "user_backups",
  ];
  for (const table of protectedTables) {
    expect(sql).toContain(
      `alter table public.${table} enable row level security`,
    );
  }
  expect(sql).not.toMatch(
    /create policy "(?:teams|players|matches|evaluations|competitions) workspace"/,
  );
  expect(sql).toContain(
    "workspace_role(target) in ('owner','coach','assistant','organizer')",
  );
  expect(sql).toContain("workspace_role(target) in ('owner','organizer')");
});

test("backup remoto tiene aislamiento, tamaño máximo y timestamp del servidor", async () => {
  const sql = await readFile(schemaPath, "utf8");
  expect(sql).toContain("user_backups_payload_size");
  expect(sql).toContain("octet_length(payload::text) <= 5242880");
  expect(sql).toContain("user_backups_touch_updated_at");
  expect(sql).toContain("using(user_id=auth.uid())");
  expect(sql).toContain("with check(user_id=auth.uid())");
});
