import "dotenv/config";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userPreferences, users } from "@/db/schema";

type Mode = "dry-run" | "execute";

function parseMode(): Mode {
  const args = process.argv.slice(2);
  const modeIndex = args.indexOf("--mode");
  if (modeIndex !== -1 && args[modeIndex + 1]) {
    const val = args[modeIndex + 1]?.toLowerCase();
    if (val === "execute") return "execute";
  }
  return "dry-run";
}

async function main() {
  const mode = parseMode();
  console.log(`[smart-collections:enable-existing] Running in ${mode.toUpperCase()} mode...`);

  const db = getDb();
  const allUsers = await db.select().from(users);

  console.log(`Found ${allUsers.length} total users in database.`);

  const prefs = await db.select().from(userPreferences);
  const prefsMap = new Map(prefs.map((p) => [p.userId, p]));

  let alreadyEnabled = 0;
  let needsUpdate = 0;
  let needsInsert = 0;

  for (const user of allUsers) {
    const pref = prefsMap.get(user.id);
    if (!pref) {
      needsInsert++;
    } else if (!pref.smartCollectionsEnabled) {
      needsUpdate++;
    } else {
      alreadyEnabled++;
    }
  }

  console.log(`- Already enabled: ${alreadyEnabled}`);
  console.log(`- Missing preferences (needs insert with enabled=true): ${needsInsert}`);
  console.log(`- Disabled preferences (needs update to enabled=true): ${needsUpdate}`);
  console.log(`- Total to enable: ${needsInsert + needsUpdate}`);

  if (mode === "dry-run") {
    console.log(
      "\nDry-run complete. No database changes were made. Run with --mode execute to apply.",
    );
    return;
  }

  console.log("\nExecuting updates...");
  const now = String(Math.floor(Date.now() / 1000));

  for (const user of allUsers) {
    const pref = prefsMap.get(user.id);
    if (!pref) {
      await db.insert(userPreferences).values({
        userId: user.id,
        smartCollectionsEnabled: true,
        createdAt: now,
      });
    } else if (!pref.smartCollectionsEnabled) {
      await db
        .update(userPreferences)
        .set({
          smartCollectionsEnabled: true,
          updatedAt: now,
        })
        .where(eq(userPreferences.id, pref.id));
    }
  }

  console.log(
    `Successfully enabled smart collections for ${needsInsert + needsUpdate} users!`,
  );
}

main().catch((err) => {
  console.error("Migration script failed:", err);
  process.exit(1);
});
