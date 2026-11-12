// Runs a command with the System Settings dashboard values applied on top of
// the server .env -- for build-time settings such as the marketing site's
// NEXT_PUBLIC_* analytics IDs:
//
//   node scripts/settings/run-with-settings.js -- npm run build --prefix mk-subdata-website
//
// Values are passed to the child process environment only; nothing is printed.
import { spawn } from "child_process";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const sep = process.argv.indexOf("--");
const command = sep >= 0 ? process.argv.slice(sep + 1) : [];
if (!command.length) {
    console.error("Usage: node scripts/settings/run-with-settings.js -- <command> [args...]");
    process.exit(2);
}

const { loadSettingsIntoRuntime } = await import("../../services/settings/settingsService.js");
try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
    const { loaded, errors } = await loadSettingsIntoRuntime();
    console.log(`[run-with-settings] applied ${loaded} dashboard setting(s)${errors.length ? `; unreadable: ${errors.join(", ")}` : ""}`);
} catch (err) {
    console.error(`[run-with-settings] could not load dashboard settings (${err.message}); using .env only.`);
} finally {
    await mongoose.disconnect().catch(() => {});
}

const child = spawn(command[0], command.slice(1), { stdio: "inherit", env: process.env, shell: false });
child.on("exit", (code, signal) => process.exit(signal ? 1 : code ?? 1));
