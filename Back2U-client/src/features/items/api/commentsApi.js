// src/features/items/api/commentsApi.js
const BASE_URL = 'http://localhost:5000';

// helpers: normalize Mongo ObjectId + Dates coming from backend
const normalizeId = (id) => {
    if (!id) return id;
    // ObjectId from Mongo when JSONified -> { "$oid": "..." }
    if (typeof id === 'object' && id.$oid) return id.$oid;
    return id; // already string
};

const normalizeComment = (raw) => {
    if (!raw) return raw;
    return {
        ...raw,
        _id: normalizeId(raw._id),
        itemId: normalizeId(raw.itemId),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        likes: raw.likes || [],
        likesCount:
            typeof raw.likesCount === 'number'
                ? raw.likesCount
                : (raw.likes || []).length,
        hidden: !!raw.hidden,
    };
};

export async function fetchComments(itemId) {
    const res = await fetch(`${BASE_URL}/api/items/${itemId}/comments`);
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch comments');
    }
    return (data.data || []).map(normalizeComment);
}

export async function createComment(itemId, payload) {
    const res = await fetch(`${BASE_URL}/api/items/${itemId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to create comment');
    }
    return normalizeComment(data.data);
}

export async function toggleLikeComment(commentId, userEmail) {
    const res = await fetch(`${BASE_URL}/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to toggle like');
    }
    return normalizeComment(data.data);
}

export async function deleteComment(commentId, userEmail, userRole) {
    const res = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, userRole }),
    });

    // May or may not have body; keep it safe
    let data = {};
    try {
        data = await res.json();
    } catch (_) {
        // ignore
    }

    if (!res.ok || data.success === false) {
        throw new Error((data && data.message) || 'Failed to delete comment');
    }
    return true;
}

// src/features/items/api/commentsApi.js
export async function hideComment(commentId, hidden) {
    const res = await fetch(`${BASE_URL}/api/comments/${commentId}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden }),
    });

    let data = {};
    try {
        data = await res.json();
    } catch (_) {
        // backend might send empty body – ignore
    }

    if (!res.ok || data.success === false) {
        const err = new Error(
            (data && data.message) || 'Failed to hide/unhide comment'
        );
        err.status = res.status;
        throw err;
    }

    return normalizeComment(data.data);
}


// NEW: edit comment text
export async function updateComment(commentId, payload) {
    const res = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // { userEmail, userRole, text }
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update comment');
    }
    return normalizeComment(data.data);
}
