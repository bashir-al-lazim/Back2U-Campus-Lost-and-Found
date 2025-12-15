import html2canvas from "html2canvas";
import PropTypes from "prop-types";
import { toast } from "react-toastify";

const ShareActions = ({ item, flyerRef }) => {
    const link = typeof window !== "undefined" ? window.location.href : "";
    const msg = `Lost & Found: "${item.title || "Untitled"}" (${item.category || "Unknown"}, ${item.status || "Open"}) — ${link}`;

    async function copyMsg() {
        try {
            await navigator.clipboard.writeText(msg)
            toast.success("Copied link")
        } catch(err) {
            console.error(err)
            toast.error("Failed to copy link")
        }
    }

    async function downloadFlyer() {
        const frame = flyerRef?.current;
        if (!frame) { toast.error("Flyer not mounted"); return; }
        const doc = frame.contentDocument || frame.contentWindow?.document;
        if (!doc) { toast.error("Flyer unavailable"); return; }

        try {
            const el = doc.body;
            const canvas = await html2canvas(el, { backgroundColor: "#fff", scale: 3 })
            const a = document.createElement("a")
            a.href = canvas.toDataURL("image/png")
            a.download = `back2u-${item._id}.png`
            a.click()

            toast.success("flyer downloaded successfully")
        } catch (err) {
            console.error(err)
            toast.error("Failed to generate flyer")
        }
    }

    return (
        <div className="dropdown dropdown-center">
            <button className="btn btn-secondary" tabIndex={0}>Share</button>
            <ul className="dropdown-content z-[1] mt-1 menu p-2 shadow bg-base-100 rounded-box gap-1 w-36" tabIndex={0}>
                <li className="border-b border-b-gray-300 rounded-xl"><button onClick={copyMsg}>Copy link</button></li>
                <li className="border-b border-b-gray-300 rounded-xl"><button onClick={downloadFlyer}>Download flyer</button></li>
            </ul>
        </div>
    );
};
export default ShareActions;


ShareActions.propTypes = { item: PropTypes.object.isRequired, flyerRef: PropTypes.object };