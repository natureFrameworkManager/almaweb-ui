/**
 * Transient user feedback.
 *
 * Renders toast notifications into the `#toast-region` placeholder defined in
 * `index.html` and toggles the `[hidden]` feedback placeholders styled by
 * `css/components/feedback.css`. Keeping this in one module lets every feature
 * report success, loading and error states the same way.
 */

/** Severity of a notification, controlling its icon and lifetime. */
export type FeedbackKind = "success" | "error" | "info";

/** How long a toast stays visible, in milliseconds. */
const TOAST_DURATION: Record<FeedbackKind, number> = {
    success: 3500,
    info: 3500,
    error: 6000,
};

/** Material symbol shown for each notification kind. */
const TOAST_ICON: Record<FeedbackKind, string> = {
    success: "check_circle",
    error: "error",
    info: "info",
};

/**
 * Remove a toast, playing the leaving animation first.
 * @param toast - Toast element to remove.
 */
function dismissToast(toast: HTMLElement): void {
    if (toast.classList.contains("is-leaving")) {
        return;
    }
    toast.classList.add("is-leaving");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
    // Fallback for environments where the animation never fires.
    setTimeout(() => toast.remove(), 400);
}

/**
 * Show a transient notification.
 *
 * Identical messages are collapsed while one is already visible so bursts of
 * failures (for example an offline start) do not stack up.
 * @param message - Text to display.
 * @param kind - Severity of the notification.
 */
export function showToast(message: string, kind: FeedbackKind = "info"): void {
    const region = document.getElementById("toast-region");
    if (!region) {
        return;
    }
    const alreadyShown = Array.from(region.querySelectorAll<HTMLElement>(".toast")).some(
        (toast) => toast.dataset["message"] === message,
    );
    if (alreadyShown) {
        return;
    }

    const toast = document.createElement("div");
    toast.className = `toast ${kind}`;
    toast.dataset["message"] = message;
    toast.setAttribute("role", kind === "error" ? "alert" : "status");

    const icon = document.createElement("span");
    icon.className = "material-symbols toast-icon";
    icon.textContent = TOAST_ICON[kind];

    const text = document.createElement("span");
    text.className = "toast-message";
    text.textContent = message;

    const dismiss = document.createElement("button");
    dismiss.className = "toast-dismiss material-symbols";
    dismiss.type = "button";
    dismiss.textContent = "close";
    dismiss.setAttribute("aria-label", "Benachrichtigung schließen");
    dismiss.addEventListener("click", () => dismissToast(toast));

    toast.append(icon, text, dismiss);
    region.append(toast);
    setTimeout(() => dismissToast(toast), TOAST_DURATION[kind]);
}

/**
 * Log an error and surface it to the user as a toast.
 * @param message - User facing message.
 * @param error - Optional technical error for the console.
 */
export function reportError(message: string, error?: unknown): void {
    if (error === undefined) {
        console.error(message);
    } else {
        console.error(message, error);
    }
    showToast(message, "error");
}

/**
 * Show or hide one of the `[hidden]` feedback placeholders.
 * @param id - Id of the placeholder element.
 * @param visible - Whether the placeholder should be visible.
 */
export function setPlaceholderVisible(id: string, visible: boolean): void {
    const element = document.getElementById(id);
    if (element) {
        element.hidden = !visible;
    }
}
