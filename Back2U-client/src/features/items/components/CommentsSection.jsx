// src/features/items/components/CommentsSection.jsx
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../../app/providers/createProvider';
import {
    fetchComments,
    createComment,
    toggleLikeComment,
    deleteComment,
    hideComment,
    updateComment,
} from '../api/commentsApi';
import { createReport } from '../../moderation/api/moderationApi';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const CommentsSection = ({ item }) => {
    const { user, role } = useContext(AuthContext);

    const itemId = item?._id || item?.id;

    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [text, setText] = useState('');

    const [mentionResults, setMentionResults] = useState([]);
    const [selectedMentions, setSelectedMentions] = useState([]);

    // edit state
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editText, setEditText] = useState('');

    // report state
    const [reportingCommentId, setReportingCommentId] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [reportSubmitting, setReportSubmitting] = useState(false);

    const userEmail = user?.email;
    const isStaffOrAdmin = role === 'staff' || role === 'admin';

    // ---------- safe helpers for mention candidates ----------

    const normalizeMentionCandidate = (
        source,
        fallbackLabel,
        fallbackRole = 'student'
    ) => {
        if (!source) return null;

        // if it's just an ObjectId string -> ignore (no email/name)
        if (typeof source !== 'object' || Array.isArray(source)) {
            return null;
        }

        const email = source.email;
        if (!email) return null;

        const name = source.name || email || fallbackLabel;

        return {
            name,
            email,
            role: source.role || fallbackRole,
        };
    };

    const postedByCandidate = normalizeMentionCandidate(
        item?.postedBy,
        'Item owner',
        'student'
    );
    const claimedByCandidate = normalizeMentionCandidate(
        item?.claimedBy,
        'Claimant',
        'student'
    );
    const currentUserCandidate =
        user && {
            name: user.displayName || user.email,
            email: user.email,
            role: role || 'student',
        };

    const mentionCandidates = [
        postedByCandidate,
        claimedByCandidate,
        currentUserCandidate,
    ].filter(Boolean);

    // ---------- load comments ----------

    useEffect(() => {
        const load = async () => {
            if (!itemId) return;
            try {
                setLoading(true);
                const data = await fetchComments(itemId);
                setComments(data);
            } catch (err) {
                console.error(err);
                toast.error(err.message || 'Failed to load comments');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [itemId]);

    // ---------- form handlers ----------

    const handleChangeText = (e) => {
        const value = e.target.value;
        setText(value);

        const match = value.match(/@([a-zA-Z0-9._-]*)$/);
        if (match) {
            const query = match[1].toLowerCase();
            const results = mentionCandidates.filter(
                (c) =>
                    c.name.toLowerCase().includes(query) ||
                    c.email.toLowerCase().includes(query)
            );
            setMentionResults(results);
        } else {
            setMentionResults([]);
        }
    };

    const handlePickMention = (candidate) => {
        setMentionResults([]);

        setSelectedMentions((prev) => {
            const exists = prev.some((m) => m.email === candidate.email);
            return exists ? prev : [...prev, candidate];
        });

        setText((prev) =>
            prev.replace(/@([a-zA-Z0-9._-]*)$/, `@${candidate.name} `)
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error('You must be logged in to comment.');
            return;
        }
        if (!text.trim()) return;

        const payload = {
            text,
            author: {
                name: user.displayName || user.email,
                email: user.email,
                avatar: user.photoURL || '',
                role: role || 'student',
            },
            mentions: selectedMentions,
        };

        try {
            setSubmitting(true);
            const created = await createComment(itemId, payload);
            setComments((prev) => [...prev, created]);
            setText('');
            setSelectedMentions([]);
            toast.success('Comment posted');
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    // ---------- actions: like / delete / hide / edit / report ----------

    const handleToggleLike = async (commentId) => {
        if (!user) {
            toast.error('You must be logged in to like comments.');
            return;
        }

        try {
            const updated = await toggleLikeComment(commentId, user.email);

            if (!updated || !updated._id) {
                console.warn('toggleLike returned no document, refetching comments');
                const fresh = await fetchComments(itemId);
                setComments(fresh);
                return;
            }

            const updatedId = String(updated._id);

            setComments((prev) =>
                prev.map((c) => (String(c._id) === updatedId ? updated : c))
            );
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to update like');
        }
    };

    const handleDelete = async (commentId) => {
        if (!user) return;

        const result = await Swal.fire({
            title: 'Delete this comment?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#dc2626', // red
            cancelButtonColor: '#6b7280',  // gray
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            await deleteComment(commentId, user.email, role);
            setComments((prev) => prev.filter((c) => c._id !== commentId));
            toast.success('Comment deleted');
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to delete comment');
        }
    };


    const handleHide = async (commentId, hidden) => {
        try {
            const updated = await hideComment(commentId, hidden);

            // comment missing or already removed
            if (!updated) {
                const fresh = await fetchComments(itemId);
                setComments(fresh);
                toast.info("Comment was already removed.");
                return;
            }

            if (updated.hidden) {
                // remove from list when hidden
                setComments((prev) =>
                    prev.filter((c) => String(c._id) !== String(commentId))
                );
            } else {
                // unhidden: replace or append
                setComments((prev) => {
                    const idStr = String(updated._id);
                    const without = prev.filter((c) => String(c._id) !== idStr);
                    return [...without, updated];
                });
            }

            toast.success(hidden ? "Comment hidden" : "Comment unhidden");
        } catch (err) {
            console.error(err);
            toast.error(err.message || "Failed to update comment visibility");
        }
    };

    const startEdit = (comment) => {
        if (!user || user.email !== comment.author?.email) return;
        setEditingCommentId(comment._id);
        setEditText(comment.text || '');
    };

    const cancelEdit = () => {
        setEditingCommentId(null);
        setEditText('');
    };

    const saveEdit = async (commentId) => {
        if (!user) return;
        const trimmed = (editText || '').trim();
        if (!trimmed) {
            toast.error('Comment text cannot be empty.');
            return;
        }

        try {
            const updated = await updateComment(commentId, {
                userEmail: user.email,
                userRole: role,
                text: trimmed,
            });

            setComments((prev) =>
                prev.map((c) => (String(c._id) === String(updated._id) ? updated : c))
            );
            setEditingCommentId(null);
            setEditText('');
            toast.success('Comment updated');
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to update comment');
        }
    };

    // ---------- report comment ----------

    const openReportModalForComment = (comment) => {
        if (!user) {
            toast.error('You must be logged in to report comments.');
            return;
        }
        setReportingCommentId(comment._id);
        setReportReason('');
        setReportDetails('');
    };

    const closeReportModal = () => {
        setReportingCommentId(null);
        setReportReason('');
        setReportDetails('');
    };

    const handleSubmitCommentReport = async () => {
        if (!user || !reportingCommentId) return;

        if (!reportReason.trim()) {
            toast.error('Please provide a reason for your report.');
            return;
        }

        try {
            setReportSubmitting(true);
            await createReport({
                targetType: 'comment',
                targetId: reportingCommentId,
                reason: reportReason.trim(),
                details: reportDetails.trim(),
                reporter: {
                    email: user.email,
                    name: user.displayName || user.email,
                    role: role || 'student',
                },
            });
            toast.success('Report submitted to moderators.');
            closeReportModal();
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Failed to submit report');
        } finally {
            setReportSubmitting(false);
        }
    };

    // ---------- render ----------

    return (
        <div className="mt-10 border-t pt-6">
            <h3 className="text-xl font-semibold mb-4">Discussion</h3>

            {/* comment form */}
            {user ? (
                <form onSubmit={handleSubmit} className="mb-6 space-y-2">
                    <textarea
                        value={text}
                        onChange={handleChangeText}
                        rows={3}
                        placeholder="Write a comment... Use @ to mention someone"
                        className="textarea textarea-bordered w-full"
                    />

                    {/* mention suggestions */}
                    {mentionResults.length > 0 && (
                        <div className="bg-base-100 border rounded-lg shadow-sm p-2 max-h-40 overflow-y-auto text-sm">
                            {mentionResults.map((c) => (
                                <button
                                    key={c.email}
                                    type="button"
                                    className="flex justify-between w-full text-left px-2 py-1 hover:bg-base-200 rounded"
                                    onClick={() => handlePickMention(c)}
                                >
                                    <span>{c.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <div>
                            {selectedMentions.length > 0 && (
                                <span>
                                    Mentioning:{' '}
                                    {selectedMentions.map((m) => m.name).join(', ')}
                                </span>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={submitting || !text.trim()}
                        >
                            {submitting ? 'Posting...' : 'Post Comment'}
                        </button>
                    </div>
                </form>
            ) : (
                <p className="mb-4 text-sm text-gray-500">
                    Login to join the discussion.
                </p>
            )}

            {/* comments list */}
            {loading ? (
                <div className="flex justify-center py-4">
                    <span className="loading loading-spinner"></span>
                </div>
            ) : comments.length === 0 ? (
                <p className="text-sm text-gray-500">
                    No comments yet. Be the first!
                </p>
            ) : (
                <ul className="space-y-4">
                    {comments.map((c) => {
                        // Safe date formatting (never throw)
                        let createdAtLabel = '';
                        if (c.createdAt) {
                            try {
                                const d = new Date(c.createdAt);
                                if (!isNaN(d.getTime())) {
                                    createdAtLabel = format(
                                        d,
                                        'MMM dd, yyyy • hh:mm a'
                                    );
                                }
                            } catch {
                                createdAtLabel = '';
                            }
                        }

                        const likedByUser = (c.likes || []).includes(userEmail);
                        const isOwner = c.author?.email === userEmail;

                        const hasDropdownActions =
                            isOwner || isStaffOrAdmin || !!user;

                        return (
                            <li key={c._id} className="p-3 rounded-lg bg-base-200">
                                <div className="flex items-start gap-3">
                                    <div className="avatar">
                                        <div className="w-8 rounded-full">
                                            <img
                                                src={c.author?.avatar || '/default-avatar.png'}
                                                alt={c.author?.name}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-sm">
                                                    {c.author?.name}
                                                    {c.author?.role && (
                                                        <span className="ml-2 badge badge-open text-xs">
                                                            {c.author.role}
                                                        </span>
                                                    )}
                                                </p>
                                                {createdAtLabel && (
                                                    <p className="text-xs text-gray-500">
                                                        {createdAtLabel}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleLike(c._id)}
                                                    className="btn btn-ghost btn-xs px-2"
                                                >
                                                    {likedByUser ? '♥' : '♡'}{' '}
                                                    <span className="ml-1">
                                                        {c.likesCount}
                                                    </span>
                                                </button>

                                                {/* 3-dots options menu */}
                                                {hasDropdownActions && (
                                                    <div className="dropdown dropdown-end">
                                                        <button
                                                            type="button"
                                                            tabIndex={0}
                                                            className="btn btn-ghost btn-xs px-2"
                                                        >
                                                            ⋯
                                                        </button>
                                                        <ul
                                                            tabIndex={0}
                                                            className="dropdown-content menu menu-xs bg-base-100 shadow rounded-box w-40 z-[1000]"
                                                        >
                                                            {/* Edit → only author */}
                                                            {isOwner && (
                                                                <li>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            startEdit(c)
                                                                        }
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                </li>
                                                            )}

                                                            {/* Delete → author OR staff/admin */}
                                                            {(isOwner || isStaffOrAdmin) && (
                                                                <li>
                                                                    <button
                                                                        type="button"
                                                                        className="text-error"
                                                                        onClick={() =>
                                                                            handleDelete(c._id)
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </li>
                                                            )}

                                                            {/* Hide → only staff/admin */}
                                                            {isStaffOrAdmin && (
                                                                <li>
                                                                    <button
                                                                        type="button"
                                                                        className="text-warning"
                                                                        onClick={() =>
                                                                            handleHide(c._id, true)
                                                                        }
                                                                    >
                                                                        Hide
                                                                    </button>
                                                                </li>
                                                            )}

                                                            {/* Report → any logged-in user */}
                                                            {user && (
                                                                <li>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openReportModalForComment(
                                                                                c
                                                                            )
                                                                        }
                                                                    >
                                                                        Report
                                                                    </button>
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* comment body or edit textarea */}
                                        {editingCommentId === c._id ? (
                                            <div className="mt-2 space-y-2">
                                                <textarea
                                                    className="textarea textarea-bordered textarea-sm w-full"
                                                    rows={3}
                                                    value={editText}
                                                    onChange={(e) =>
                                                        setEditText(e.target.value)
                                                    }
                                                />
                                                <div className="flex justify-end gap-2 text-xs">
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost btn-xs"
                                                        onClick={cancelEdit}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-xs"
                                                        onClick={() => saveEdit(c._id)}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="mt-2 text-sm whitespace-pre-line">
                                                {c.text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* REPORT COMMENT MODAL */}
            {reportingCommentId && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-md relative">
                        <button
                            type="button"
                            className="btn btn-sm btn-circle btn-error absolute right-2 top-2"
                            onClick={closeReportModal}
                        >
                            ✕
                        </button>

                        <h3 className="font-bold text-lg mb-2">Report comment</h3>
                        <p className="text-xs text-gray-500 mb-3">
                            This will send the comment to the moderation team. Please
                            explain what is wrong with it.
                        </p>

                        <div className="form-control flex flex-col mb-3 w-full">
                            <label className="label">
                                <span className="label-text text-sm font-semibold pb-1">
                                    Reason*
                                </span>
                            </label>
                            <input
                                type="text"
                                className="input input-bordered input-sm w-full"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="e.g. spam / abusive / misleading"
                            />
                        </div>

                        <div className="form-control  flex flex-col mb-4 w-full">
                            <label className="label">
                                <span className="label-text text-sm font-semibold pb-1">
                                    Details (optional)
                                </span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered textarea-sm w-full"
                                rows={3}
                                value={reportDetails}
                                onChange={(e) => setReportDetails(e.target.value)}
                                placeholder="Any extra context for moderators..."
                            />
                        </div>

                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn btn-error btn-sm"
                                onClick={handleSubmitCommentReport}
                                disabled={reportSubmitting || !reportReason.trim()}
                            >
                                {reportSubmitting ? 'Sending...' : 'Submit report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentsSection;
