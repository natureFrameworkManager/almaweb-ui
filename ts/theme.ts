import { getState, updateState, type ThemeMode } from "./state";

/**
 * Check whether a value is a supported theme mode.
 * @param value - Theme value to inspect.
 * @returns Whether the value is a supported theme mode.
 */
function isThemeMode(value: string | null): value is ThemeMode {
    return value === "system" || value === "dark" || value === "light";
}

/**
 * Apply the selected theme mode to the document.
 * @param theme - Theme mode to apply.
 */
export function applyTheme(theme: ThemeMode): void {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
}

/**
 * Persist and apply a theme selected by the user.
 * @param theme - Theme mode selected by the user.
 */
export function handleThemeChange(theme: string): void {
    if (!isThemeMode(theme)) {
        return;
    }
    updateState((state) => {
        state.theme = theme;
    });
    applyTheme(theme);
}

/** Initialize the theme selector from the shared state. */
export function initTheme(): void {
    const theme = getState().theme;
    document.querySelectorAll("#dark-mode-toggle > *").forEach((item) => {
        item.classList.toggle("active", item.getAttribute("data-mode") === theme);
    });
    applyTheme(theme);
}
