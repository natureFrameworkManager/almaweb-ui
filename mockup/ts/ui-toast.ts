// ==========================================================================
// mockup/ts/ui-toast.ts — Notification Toasts
// ==========================================================================

export function showToast(message: string, actionLabel?: string, onAction?: () => void): void {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>${message}</span>`;

    if (actionLabel && onAction) {
        const btn = document.createElement("button");
        btn.className = "toast-undo";
        btn.textContent = actionLabel;
        btn.onclick = () => {
            onAction();
            toast.remove();
        };
        toast.appendChild(btn);
    }

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = "opacity 0.2s, transform 0.2s";
        toast.style.opacity = "0";
        toast.style.transform = "translateY(8px)";
        setTimeout(() => toast.remove(), 250);
    }, 3800);
}
