// src/features/moderation/pages/ModerationQueuePage.jsx
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../app/providers/createProvider";
import {
    fetchReports,
    warnUser,
    getUserStatus,
    hideItem,
    deleteReport,
    fetchCommentModerationStatus,
    hideCommentModeration,
    fetchHiddenItems,
    fetchHiddenComments,
    fetchHiddenLostReports,
    hideLostReport,
} from "../api/moderationApi";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const ModerationQueuePage = () => {
    const { role, user } = useContext(AuthContext);

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // modal state
    const [selectedReport, setSelectedReport] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [viewMode, setViewMode] = useState("reports"); // 'reports' | 'hidden'

    const [hiddenItems, setHiddenItems] = useState([]);
    const [hiddenComments, setHiddenComments] = useState([]);
    const [hiddenLostReports, setHiddenLostReports] = useState([]);
    const [loadingHidden, setLoadingHidden] = useState(false);


    const isAuthority = role === "staff" || role === "admin";

    const loadReports = async () => {
        try {
            setLoading(true);
            const { reports } = await fetchReports("all"); // always ALL
            setReports(reports);
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    const loadHiddenContent = async () => {
        try {
            setLoadingHidden(true);
            const [{ items }, { comments }, { lostReports }] = await Promise.all([
                fetchHiddenItems(),
                fetchHiddenComments(),
                fetchHiddenLostReports(),
            ]);
            setHiddenItems(items);
            setHiddenComments(comments);
            setHiddenLostReports(lostReports);
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to load hidden content");
        } finally {
            setLoadingHidden(false);
        }
    };



    const handleUnhideItemFromList = async (itemId) => {
        try {
            const updated = await hideItem(itemId, false);

            if (!updated) {
                toast.info("Item was already removed.");
            } else {
                toast.success("Item unhidden.");
            }

            setHiddenItems((prev) => prev.filter((i) => i._id !== itemId));
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to unhide item");
        }
    };

    const handleUnhideCommentFromList = async (commentId) => {
        try {
            const updated = await hideCommentModeration(commentId, false);

            if (!updated) {
                toast.info("Comment was already removed.");
            } else {
                toast.success("Comment unhidden.");
            }

            setHiddenComments((prev) => prev.filter((c) => c._id !== commentId));
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to unhide comment");
        }
    };

    const handleUnhideLostReportFromList = async (lostReportId) => {
        try {
            const updated = await hideLostReport(lostReportId, false);

            if (!updated) {
                toast.info("Lost report was already removed.");
            } else {
                toast.success("Lost report unhidden.");
            }

            setHiddenLostReports((prev) =>
                prev.filter((r) => r._id !== lostReportId)
            );
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to unhide lost report");
        }
    };




    useEffect(() => {
        if (!isAuthority) return;
        loadReports();
    }, [isAuthority]);

    if (!isAuthority) {
        return (
            <div className="w-full">
                <h1 className="text-2xl font-semibold mb-4">Moderation</h1>
                <p className="text-sm text-gray-500">
                    You are not authorized to view this page.
                </p>
            </div>
        );
    }

    const closeDetails = () => {
        setIsDetailsOpen(false);
        setSelectedReport(null);
    };

    const removeReportFromState = (id) => {
        setReports((prev) => prev.filter((r) => r._id !== id));
    };

    // --- sync comment status when opening details (exists? hidden?) ---
    const syncCommentStatus = async (report) => {
        if (!report?.targetId) return;
        try {
            const comment = await fetchCommentModerationStatus(report.targetId);

            if (!comment) {
                // comment was deleted entirely
                setReports((prev) =>
                    prev.map((r) =>
                        r._id === report._id
                            ? { ...r, _targetMissing: true }
                            : r
                    )
                );
                setSelectedReport((prev) =>
                    prev && prev._id === report._id
                        ? { ...prev, _targetMissing: true }
                        : prev
                );
                return;
            }

            const hidden = !!comment.hidden;

            setReports((prev) =>
                prev.map((r) =>
                    r._id === report._id
                        ? {
                            ...r,
                            _targetMissing: false,
                            _localHidden: hidden,
                        }
                        : r
                )
            );
            setSelectedReport((prev) =>
                prev && prev._id === report._id
                    ? {
                        ...prev,
                        _targetMissing: false,
                        _localHidden: hidden,
                    }
                    : prev
            );
        } catch (error) {
            console.error("Failed to sync comment status:", error);
            // no toast; it's not fatal for the UI
        }
    };

    // ---------------------------
    // Hide / unhide content
    // ---------------------------
    const handleHideContent = async (report) => {
        const reportId = report._id;

        try {
            let isNowHidden = null;

            if (report.targetType === "item") {
                const currentlyHidden = !!report._localHidden;
                const nextHidden = !currentlyHidden;

                const updatedItem = await hideItem(report.targetId, nextHidden);

                // hideItem returns null if item 404 (already deleted)
                if (!updatedItem) {
                    toast.info("Content was already removed.");
                    setReports((prev) =>
                        prev.map((r) =>
                            r._id === reportId ? { ...r, _targetMissing: true } : r
                        )
                    );
                    setSelectedReport((prev) =>
                        prev && prev._id === reportId
                            ? { ...prev, _targetMissing: true }
                            : prev
                    );
                    return;
                }

                isNowHidden = !!updatedItem.hidden;
            } else if (report.targetType === "comment") {
                const currentlyHidden = !!report._localHidden;
                const nextHidden = !currentlyHidden;

                const updatedComment = await hideCommentModeration(
                    report.targetId,
                    nextHidden
                );

                isNowHidden =
                    typeof updatedComment?.hidden === "boolean"
                        ? !!updatedComment.hidden
                        : nextHidden;
            } else if (report.targetType === "lostreport") {
                // 👇 NEW branch for lost reports
                const currentlyHidden = !!report._localHidden;
                const nextHidden = !currentlyHidden;

                const updatedLostReport = await hideLostReport(
                    report.targetId,
                    nextHidden
                );

                // hideLostReport returns null if lost report 404 (already deleted)
                if (!updatedLostReport) {
                    toast.info("Content was already removed.");
                    setReports((prev) =>
                        prev.map((r) =>
                            r._id === reportId ? { ...r, _targetMissing: true } : r
                        )
                    );
                    setSelectedReport((prev) =>
                        prev && prev._id === reportId
                            ? { ...prev, _targetMissing: true }
                            : prev
                    );
                    return;
                }

                isNowHidden =
                    typeof updatedLostReport?.hidden === "boolean"
                        ? !!updatedLostReport.hidden
                        : nextHidden;
            } else {
                toast.error("Unsupported target type.");
                return;
            }

            // ✅ success path: update local state, do NOT set _targetMissing
            setReports((prev) =>
                prev.map((r) =>
                    r._id === reportId
                        ? {
                            ...r,
                            _localHidden: isNowHidden,
                            _targetMissing: false,
                        }
                        : r
                )
            );
            setSelectedReport((prev) =>
                prev && prev._id === reportId
                    ? {
                        ...prev,
                        _localHidden: isNowHidden,
                        _targetMissing: false,
                    }
                    : prev
            );

            toast.success(
                isNowHidden
                    ? "Content hidden (no longer visible to students)."
                    : "Content unhidden."
            );
        } catch (error) {
            console.error("hide content failed", error);
            const status = error?.status;
            const msg = error?.message || "";

            // ⛔ Only when the server actually says “not found”
            if (status === 404 || /not found/i.test(msg)) {
                toast.info("Content was already removed.");

                setReports((prev) =>
                    prev.map((r) =>
                        r._id === reportId ? { ...r, _targetMissing: true } : r
                    )
                );
                setSelectedReport((prev) =>
                    prev && prev._id === reportId
                        ? { ...prev, _targetMissing: true }
                        : prev
                );
            } else {
                toast.error(msg || "Failed to update content visibility");
            }
        }
    };




    // ---------------------------
    // Warn user (no auto delete)
    // ---------------------------
    const handleWarnUser = async (report) => {
        // extra guard – UI will already disable the button
        const alreadyWarned =
            report._warned ||
            report.actionTaken === "warning" ||
            report.actionTaken === "ban";
        if (alreadyWarned) return;

        const email = window.prompt(
            "Enter the email of the user at fault to warn:"
        );
        if (!email || !email.trim()) return;

        const reason =
            window.prompt("Reason for warning (optional, internal):") || "";

        try {
            const staffInfo = user
                ? { email: user.email, name: user.displayName || user.email }
                : null;

            await warnUser(email.trim(), reason, report._id, staffInfo);
            const status = await getUserStatus(email.trim());

            const newActionTaken = status.isBanned ? "ban" : "warning";

            toast.success(
                status.isBanned
                    ? `Warning issued. User is now banned until ${status.bannedUntil}.`
                    : `Warning issued. Total warnings: ${status.warningsCount}`
            );

            // Mark this report as warned locally (so button stays disabled)
            setReports((prev) =>
                prev.map((r) =>
                    r._id === report._id
                        ? { ...r, _warned: true, actionTaken: newActionTaken }
                        : r
                )
            );
            setSelectedReport((prev) =>
                prev && prev._id === report._id
                    ? { ...prev, _warned: true, actionTaken: newActionTaken }
                    : prev
            );
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to issue warning");
        }
    };

    // ---------------------------
    // Dismiss = delete report
    // ---------------------------
    const handleDismiss = async (report) => {
        try {
            await deleteReport(report._id);
            removeReportFromState(report._id);
            toast.success("Report dismissed");
            closeDetails();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Failed to dismiss report");
        }
    };

    const openDetails = (report) => {
        setSelectedReport(report);
        setIsDetailsOpen(true);

        // For comment reports, sync current hidden + existence state from DB
        if (report.targetType === "comment") {
            syncCommentStatus(report);
        }
    };

    const formatDateTime = (value) => {
        if (!value) return "";
        try {
            const d = new Date(value);
            if (isNaN(d.getTime())) return "";
            return format(d, "MMM dd, yyyy HH:mm");
        } catch {
            return "";
        }
    };

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-5xl font-semibold">Moderation</h1>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="text-sm font-semibold border-2 border-black hover:bg-black hover:text-white transition-all duration-300 rounded-md px-3 py-1.5"
                        onClick={() => {
                            if (viewMode === "reports") {
                                setViewMode("hidden");
                                loadHiddenContent();
                            } else {
                                setViewMode("reports");
                            }
                        }}
                    >
                        {viewMode === "reports" ? "Show hidden content" : "Show reports"}
                    </button>
                    {viewMode === "reports" ? (
                        <button
                            type="button"
                            className="text-sm font-semibold border-2 border-black hover:bg-black hover:text-white transition-all duration-300 rounded-md px-3 py-1.5"
                            onClick={loadReports}
                        >
                            Refresh reports
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="text-sm font-semibold border-2 border-black hover:bg-black hover:text-white transition-all duration-300 rounded-md px-3 py-1.5"
                            onClick={loadHiddenContent}
                        >
                            Refresh hidden
                        </button>
                    )}


                </div>
            </div>


            {viewMode === "reports" ? (
                // ---------------- REPORTS VIEW ----------------
                loading ? (
                    <div className="flex justify-center py-10">
                        <span className="loading loading-spinner"></span>
                    </div>
                ) : reports.length === 0 ? (
                    <p className="text-sm text-gray-500">No reports found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <h2 className="text-lg font-semibold my-4">Reported Contents</h2>
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>When</th>
                                    <th>Type</th>
                                    <th>Reporter &amp; reason</th>
                                    <th>Target</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((r) => {
                                    const createdAtLabel = formatDateTime(r.createdAt);

                                    // Use targetItemId when present; fall back to targetId (older data)
                                    const itemId =
                                        r.targetItemId ||
                                        (r.targetType === "item" ? r.targetId : null);

                                    const reasonPreview =
                                        r.reason && r.reason.length > 40
                                            ? r.reason.slice(0, 40) + "…"
                                            : r.reason || "";

                                    return (
                                        <tr key={r._id}>
                                            <td className="whitespace-nowrap">
                                                {createdAtLabel}
                                            </td>
                                            <td className="capitalize">
                                                {r.targetType}
                                            </td>
                                            <td>
                                                <div className="text-xs">
                                                    <div className="font-medium">
                                                        {r.reporter?.name || "Unknown"}
                                                    </div>
                                                    <div className="text-gray-500">
                                                        {r.reporter?.email}
                                                    </div>
                                                    {reasonPreview && (
                                                        <div className="text-[11px] text-gray-400 italic mt-1">
                                                            “{reasonPreview}”
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                {itemId ? (
                                                    <Link
                                                        to={`/app/items/${itemId}`}
                                                        className="link link-primary link-hover text-xs"
                                                    >
                                                        {r.targetType === "comment"
                                                            ? "Open item (comment)"
                                                            : "Open item"}
                                                    </Link>
                                                ) : (
                                                    <span className="text-xs text-gray-400">
                                                        {r.targetType === "comment"
                                                            ? "Comment"
                                                            : r.targetType === "lostreport"
                                                                ? "Lost report"
                                                                : "Unknown target"}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="text-right">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm bg-black text-white"
                                                    onClick={() => openDetails(r)}
                                                >
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )

            ) : (
                // ---------------- HIDDEN CONTENT VIEW ----------------
                loadingHidden ? (
                    <div className="flex justify-center py-10">
                        <span className="loading loading-spinner"></span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Hidden items */}
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Hidden items</h2>
                            {hiddenItems.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    No hidden items.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Category</th>
                                                <th>Status</th>
                                                <th>Updated</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hiddenItems.map((item) => (
                                                <tr key={item._id}>
                                                    <td className="text-sm">
                                                        {item.title}
                                                    </td>
                                                    <td className="text-xs">
                                                        {item.category}
                                                    </td>
                                                    <td className="text-xs">
                                                        {item.status}
                                                    </td>
                                                    <td className="text-xs text-gray-500">
                                                        {formatDateTime(item.updatedAt)}
                                                    </td>
                                                    <td className="text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <button
                                                                type="button"
                                                                className="btn btn-xs btn-warning"
                                                                onClick={() =>
                                                                    handleUnhideItemFromList(
                                                                        item._id
                                                                    )
                                                                }
                                                            >
                                                                Unhide
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Hidden comments */}
                        <div>
                            <h2 className="text-lg font-semibold mb-2">Hidden comments</h2>
                            {hiddenComments.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    No hidden comments.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Comment</th>
                                                <th>Author</th>
                                                <th>Item</th>
                                                <th>Updated</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hiddenComments.map((c) => {
                                                const preview =
                                                    c.text && c.text.length > 60
                                                        ? c.text.slice(0, 60) + "…"
                                                        : c.text || "";

                                                return (
                                                    <tr key={c._id}>
                                                        <td className="text-sm">
                                                            {preview}
                                                        </td>
                                                        <td className="text-xs">
                                                            {c.author?.name || c.author?.email}
                                                        </td>
                                                        <td className="text-xs">
                                                            {c.itemId ? (
                                                                <Link
                                                                    to={`/app/items/${c.itemId}`}
                                                                    className="link link-primary link-hover text-xs"
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    Open item
                                                                </Link>
                                                            ) : (
                                                                <span className="text-gray-400">
                                                                    (no item)
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="text-xs text-gray-500">
                                                            {formatDateTime(c.updatedAt)}
                                                        </td>
                                                        <td className="text-right">
                                                            <button
                                                                type="button"
                                                                className="btn btn-xs btn-warning"
                                                                onClick={() =>
                                                                    handleUnhideCommentFromList(
                                                                        c._id
                                                                    )
                                                                }
                                                            >
                                                                Unhide
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Hidden lost reports */}
                        <div>
                            <h2 className="text-lg font-semibold mb-2">
                                Hidden lost reports
                            </h2>
                            {hiddenLostReports.length === 0 ? (
                                <p className="text-sm text-gray-500">
                                    No hidden lost reports.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Category</th>
                                                <th>Status</th>
                                                <th>Updated</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hiddenLostReports.map((lr) => (
                                                <tr key={lr._id}>
                                                    <td className="text-sm">{lr.title}</td>
                                                    <td className="text-xs">{lr.category}</td>
                                                    <td className="text-xs">{lr.status}</td>
                                                    <td className="text-xs text-gray-500">
                                                        {formatDateTime(lr.updatedAt)}
                                                    </td>
                                                    <td className="text-right">
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-warning"
                                                            onClick={() =>
                                                                handleUnhideLostReportFromList(lr._id)
                                                            }
                                                        >
                                                            Unhide
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )
            )}


            {/* DETAILS MODAL */}
            {isDetailsOpen && selectedReport && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-2xl relative">
                        {/* red close cross top-right */}
                        <button
                            type="button"
                            className="btn btn-sm btn-circle btn-error absolute right-2 top-2"
                            onClick={closeDetails}
                        >
                            ✕
                        </button>

                        <h3 className="font-bold text-lg mb-2">Report details</h3>

                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="font-semibold">Created: </span>
                                {formatDateTime(selectedReport.createdAt)}
                            </div>

                            <div>
                                <span className="font-semibold">Type: </span>
                                <span className="capitalize">
                                    {selectedReport.targetType}
                                </span>
                            </div>

                            {/* Reason (short) */}
                            <div>
                                <p className="font-semibold mb-1">Reason</p>
                                <p className="whitespace-pre-wrap bg-base-200 rounded-md p-2">
                                    {selectedReport.reason || "No reason provided."}
                                </p>
                            </div>

                            {/* Details (longer description) */}
                            {selectedReport.details &&
                                selectedReport.details.trim() !== "" && (
                                    <div>
                                        <p className="font-semibold mb-1">
                                            Details
                                        </p>
                                        <p className="whitespace-pre-wrap bg-base-200 rounded-md p-2">
                                            {selectedReport.details}
                                        </p>
                                    </div>
                                )}

                            <div>
                                <p className="font-semibold mb-1">Reporter</p>
                                <div className="text-sm">
                                    <div>{selectedReport.reporter?.name}</div>
                                    <div className="text-gray-500">
                                        {selectedReport.reporter?.email}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="font-semibold mb-1">Target</p>
                                {(() => {
                                    const targetItemId =
                                        selectedReport.targetItemId ||
                                        (selectedReport.targetType === "item"
                                            ? selectedReport.targetId
                                            : null);
                                    const isComment =
                                        selectedReport.targetType === "comment";
                                    const isLostReport =
                                        selectedReport.targetType === "lostreport";

                                    if (targetItemId) {
                                        return (
                                            <div className="space-y-1 text-sm">
                                                <Link
                                                    to={`/app/items/${targetItemId}`}
                                                    className="link link-primary link-hover text-sm"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Open item in new page
                                                </Link>
                                                {isComment && (
                                                    <p className="text-xs text-gray-500">
                                                        This report is about a comment on that item.
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <p className="text-xs text-gray-500">
                                            {isComment
                                                ? "Reported comment (item not found)"
                                                : isLostReport
                                                    ? "Reported lost report"
                                                    : "Unknown target"}
                                        </p>
                                    );
                                })()}
                            </div>

                        </div>

                        {/* ACTIONS */}
                        {(() => {
                            const isHidden = !!selectedReport._localHidden;
                            const isTargetMissing =
                                !!selectedReport._targetMissing;

                            const isWarned =
                                !!selectedReport._warned ||
                                selectedReport.actionTaken === "warning" ||
                                selectedReport.actionTaken === "ban";

                            return (
                                <div className="modal-action flex flex-wrap gap-2 mt-4">
                                    <button
                                        type="button"
                                        className={`btn btn-warning btn-sm ${isTargetMissing
                                            ? "btn-disabled opacity-60 cursor-not-allowed"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            !isTargetMissing &&
                                            handleHideContent(selectedReport)
                                        }
                                        disabled={isTargetMissing}
                                    >
                                        {isHidden
                                            ? "Unhide content"
                                            : "Hide content"}
                                    </button>

                                    <button
                                        type="button"
                                        className={`btn btn-outline btn-error btn-sm ${isWarned
                                            ? "btn-disabled opacity-60 cursor-not-allowed"
                                            : ""
                                            }`}
                                        onClick={() =>
                                            !isWarned &&
                                            handleWarnUser(selectedReport)
                                        }
                                        disabled={isWarned}
                                    >
                                        {isWarned ? "Warned" : "Warn user"}
                                    </button>

                                    <button
                                        type="button"
                                        className="text-sm hover:text-white hover:bg-black transition-all duration-300 font-semibold px-3 rounded-md border-2 border-black"
                                        onClick={() =>
                                            handleDismiss(selectedReport)
                                        }
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModerationQueuePage;
