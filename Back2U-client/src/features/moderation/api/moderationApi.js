// src/features/moderation/api/moderationApi.js
const BASE_URL = "http://localhost:5000";

const normalizeId = (id) => {
    if (!id) return id;
    if (typeof id === "object" && id.$oid) return id.$oid;
    return id;
};

const normalizeReport = (r) => {
    if (!r) return r;
    return {
        ...r,
        _id: normalizeId(r._id),
        targetId: normalizeId(r.targetId),
        targetItemId: normalizeId(r.targetItemId),
    };
};

const normalizeItemForModeration = (raw) => {
    if (!raw) return raw;
    return {
        ...raw,
        _id: normalizeId(raw._id),
    };
};

const normalizeCommentForModeration = (raw) => {
    if (!raw) return raw;
    return {
        ...raw,
        _id: normalizeId(raw._id),
        itemId: normalizeId(raw.itemId),
    };
};

const normalizeLostReportForModeration = (raw) => {
    if (!raw) return raw;
    return {
        ...raw,
        _id: normalizeId(raw._id),
    };
};


export async function createReport(payload) {
    const res = await fetch(`${BASE_URL}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create report");
    }
    return normalizeReport(data.data);
}

// default: ALL reports
export async function fetchReports(status = "all") {
    const params = new URLSearchParams();
    if (status) params.append("status", status);

    const res = await fetch(`${BASE_URL}/api/reports?${params.toString()}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch reports");
    }
    return {
        reports: (data.data || []).map(normalizeReport),
        pagination: data.pagination,
    };
}

// still here in case you use it elsewhere – tolerant to 404
export async function updateReport(reportId, payload) {
    const res = await fetch(`${BASE_URL}/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    let data = {};
    try {
        data = await res.json();
    } catch (_) {
        // ignore
    }

    if (res.status === 404) {
        console.warn(
            "Report not found while updating; treating as already handled:",
            reportId
        );
        return null;
    }

    if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update report");
    }

    return data.data ? normalizeReport(data.data) : null;
}

export async function warnUser(email, reason, reportId, staff) {
    const res = await fetch(`${BASE_URL}/api/moderation/warn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason, reportId, staff }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to issue warning");
    }
    return data.data;
}

export async function getUserStatus(email) {
    const res = await fetch(
        `${BASE_URL}/api/moderation/user-status/${encodeURIComponent(email)}`
    );
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch user status");
    }
    return data.data;
}

// Hide / unhide item for moderation
export async function hideItem(itemId, hidden = true) {
    const res = await fetch(`${BASE_URL}/api/items/${itemId}/hide`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden }),
    });

    let data = {};
    try {
        data = await res.json();
    } catch (_) {
        // backend might send empty body – ignore
    }

    // True "missing" case: item is gone from DB
    if (res.status === 404) {
        console.warn("Item to hide/unhide not found:", itemId);
        return null; // <-- this is the ONLY time we return null
    }

    // Any other error → throw, so caller sees a real failure
    if (!res.ok || data.success === false) {
        const err = new Error(
            (data && data.message) || "Failed to hide/unhide item"
        );
        err.status = res.status;
        throw err;
    }

    // Normal case: backend returns the updated item
    if (data && data.data) {
        return data.data;
    }

    // Fallback: assume success but backend didn't include the item.
    // We still need a truthy object so ModerationQueuePage does NOT think it's "removed".
    return {
        _id: itemId,
        hidden: !!hidden,
    };
}

// Hide / unhide lost report for moderation
export async function hideLostReport(lostReportId, hidden = true) {
    const res = await fetch(
        `${BASE_URL}/api/lostreports/${lostReportId}/hide`,
        {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hidden }),
        }
    );

    let data = {};
    try {
        data = await res.json();
    } catch (_) {
        // backend might send empty body – ignore
    }

    // True "missing in DB" case
    if (res.status === 404) {
        console.warn("Lost report not found for hide/unhide:", lostReportId);
        return null; // let caller treat as "already removed"
    }

    if (!res.ok || data.success === false) {
        const err = new Error(
            (data && data.message) || "Failed to hide/unhide lost report"
        );
        err.status = res.status;
        throw err;
    }

    // Normal case: backend returns the updated lost report
    if (data && data.data) {
        return data.data;
    }

    // Fallback: assume success but backend didn't include the doc
    return {
        _id: lostReportId,
        hidden: !!hidden,
    };
}


// Get comment status for moderation (exists + hidden flag)
export async function fetchCommentModerationStatus(commentId) {
    const res = await fetch(
        `${BASE_URL}/api/moderation/comments/${commentId}`
    );

    let data = {};
    try {
        data = await res.json();
    } catch (_) {
        // ignore
    }

    if (res.status === 404) {
        console.warn("Comment not found for moderation status:", commentId);
        return null;
    }

    if (!res.ok || data.success === false) {
        throw new Error(
            (data && data.message) || "Failed to fetch comment status"
        );
    }

    return data.data; // full raw comment doc
}


// Hide / unhide comment specifically for moderation
export async function hideCommentModeration(commentId, hidden) {
    const res = await fetch(`${BASE_URL}/api/comments/${commentId}/hide`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden }),
    });

    let data = {};
    try {
        data = await res.json();
    } catch (_) {
        // backend might send empty body – ignore
    }

    // True "missing in DB" case
    if (res.status === 404) {
        const err = new Error("Comment not found");
        err.status = 404;
        throw err;
    }

    if (!res.ok || data.success === false) {
        const err = new Error(
            (data && data.message) || "Failed to hide/unhide comment"
        );
        err.status = res.status;
        throw err;
    }

    // Normal case: backend returns the updated comment
    if (data && data.data) {
        return data.data;
    }

    // Fallback: assume success but backend didn't include the comment
    // → still return a truthy object so caller knows it's NOT missing
    return {
        _id: commentId,
        hidden: !!hidden,
    };
}


export async function fetchHiddenItems(page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const res = await fetch(
        `${BASE_URL}/api/moderation/hidden-items?${params.toString()}`
    );
    const data = await res.json();

    if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to fetch hidden items');
    }

    return {
        items: (data.data || []).map(normalizeItemForModeration),
        pagination: data.pagination,
    };
}

export async function fetchHiddenComments(page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const res = await fetch(
        `${BASE_URL}/api/moderation/hidden-comments?${params.toString()}`
    );
    const data = await res.json();

    if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to fetch hidden comments');
    }

    return {
        comments: (data.data || []).map(normalizeCommentForModeration),
        pagination: data.pagination,
    };
}

export async function fetchHiddenLostReports(page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (limit) params.append("limit", limit);

    const res = await fetch(
        `${BASE_URL}/api/moderation/hidden-lostreports?${params.toString()}`
    );
    const data = await res.json();

    if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to fetch hidden lost reports");
    }

    return {
        lostReports: (data.data || []).map(normalizeLostReportForModeration),
        pagination: data.pagination,
    };
}




// NEW: delete a report after moderator action
export async function deleteReport(reportId) {
    const res = await fetch(`${BASE_URL}/api/reports/${reportId}`, {
        method: "DELETE",
    });

    let data = {};
    try {
        data = await res.json();
    } catch (_) {
        // ignore
    }

    // Treat "already gone" as success
    if (res.status === 404) {
        console.warn("Report already deleted:", reportId);
        return true;
    }

    if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete report");
    }

    return true;
}
