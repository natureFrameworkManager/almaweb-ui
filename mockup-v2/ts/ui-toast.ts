// mockup-v2/ts/ui-toast.ts
export function showToast(message: string, actionText?: string, onAction?: () => void) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span>${message}</span>`;

    if (actionText && onAction) {
        const btn = document.createElement("button");
        btn.className = "toast-action";
        btn.textContent = actionText;
        btn.onclick = () => {
            onAction();
            toast.remove();
        };
        toast.appendChild(btn);
    }

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 200);
    }, 3500);
}
