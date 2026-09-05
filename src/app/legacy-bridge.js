import { installBrowserRuntime } from "./install-browser-runtime.js";
import { installReactHelpers } from "../shared/presentation/react-helpers.js";
import { installBrowserFiles } from "../shared/presentation/browser-files.js";
import * as leagueStandings from "../features/league/domain/standings.js";
import * as leagueFixture from "../features/league/domain/fixture.js";
import * as leagueCsv from "../features/league/domain/csv.js";
import * as lineup from "../features/lineup/domain/lineup-draft.js";
import * as coach from "../features/coach/domain/coach.js";
import * as draw from "../features/draw/domain/team-balancer.js";
import { createAutomaticBackupService, createBackupScheduler } from "../features/backup/application/automatic-backup-service.js";
import { createIndexedDbBackupRepository } from "../features/backup/infrastructure/indexeddb-backup-repository.js";
import { createCloudBackupService } from "../features/auth/application/cloud-backup-service.js";
import { createSupabaseBackupAdapter, createSyncStamp } from "../features/auth/infrastructure/supabase-backup-adapter.js";

// Temporary adapter for classic JSX consumers. Business rules live in modules above;
// new code imports them directly instead of adding new window globals.
installBrowserRuntime(window);
installReactHelpers(window, window.React, window.ReactDOM);
installBrowserFiles(window);
Object.assign(window, {
  fcLeague: Object.freeze({ ...leagueStandings, ...leagueFixture, ...leagueCsv }),
  fcLineup: Object.freeze({ ...lineup }),
  fcCoachDomain: Object.freeze({ ...coach }),
  fcDrawDomain: Object.freeze({ ...draw }),
  fcBackupFactories: Object.freeze({ createAutomaticBackupService, createBackupScheduler, createIndexedDbBackupRepository }),
  fcCloudFactories: Object.freeze({ createCloudBackupService, createSupabaseBackupAdapter, createSyncStamp }),
});
