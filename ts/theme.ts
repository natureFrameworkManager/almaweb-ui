const THEME_STORAGE_KEY = "almaweb-theme";

type ThemeMode = "system" | "dark" | "light";

/**
 * Check whether a stored value is a supported theme mode.
 * @param value - Stored theme value.
 * @returns Whether the value is a supported theme mode.
 */
function isThemeMode(value: string | null): value is ThemeMode {
    return value === "system" || value === "dark" || value === "light";
}

/**
 * Apply the selected theme mode to the document.
 * @param theme - Theme mode to apply.
 */
function applyTheme(theme: ThemeMode) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.classList.toggle("dark", isDark);
}

/**
 * Persist and apply a theme selected by the user.
 * @param theme - Theme mode selected by the user.
 */
export function handleThemeChange(theme: string) {
    if (!isThemeMode(theme)) {
        return;
    }

    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyTheme(theme);
}

/** Initialize the theme selector from local storage. */
export function initTheme() {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const theme = isThemeMode(storedTheme) ? storedTheme : "system";

    document.querySelectorAll("#dark-mode-toggle > *").forEach((item) => {
        item.classList.toggle("active", item.getAttribute("data-mode") === theme);
    });
    handleThemeChange(theme);
}
