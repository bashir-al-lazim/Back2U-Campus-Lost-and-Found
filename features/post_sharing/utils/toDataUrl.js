export async function toDataUrl(url) {
    if (!url) return null;
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) throw new Error("image fetch failed");
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
}