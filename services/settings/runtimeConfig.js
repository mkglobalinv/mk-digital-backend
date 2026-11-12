// Tiny registry that lets integrations re-read their configuration when the
// System Settings dashboard changes a credential, without restarting the app.
// Modules register a loader with onConfigChange(); settingsService calls
// notifyConfigChange() after it has written the new values to process.env.
// No imports on purpose: provider modules can depend on this safely.

const listeners = new Set();

export function onConfigChange(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function notifyConfigChange(changedKeys = []) {
    for (const listener of listeners) {
        try {
            const result = listener(changedKeys);
            if (result && typeof result.catch === "function") {
                result.catch((err) => console.error("[RuntimeConfig] async reload failed:", err.message));
            }
        } catch (err) {
            // Never include values here: only the error message from the reloader.
            console.error("[RuntimeConfig] reload failed:", err.message);
        }
    }
}
