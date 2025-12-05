const BASE_URL = 'http://localhost:5000';

/**
 * Link a lost report to a found item
 */
export async function linkReportToItem(reportId, itemId) {
  const res = await fetch(`${BASE_URL}/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId, itemId }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to link report to item');
  }
  return await res.json();
}

/**
 * Unlink a lost report from a found item
 */
export async function unlinkReportFromItem(reportId, itemId) {
  const res = await fetch(`${BASE_URL}/unlink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportId, itemId }),
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to unlink report from item');
  }
  return await res.json();
}

/**
 * Get the linked item for a report
 */
export async function getLinkedItem(reportId) {
  const res = await fetch(`${BASE_URL}/lostreports/${reportId}/linked-item`);
  if (!res.ok) throw new Error('Failed to fetch linked item');
  return await res.json();
}

/**
 * Get the linked report for an item
 */
export async function getLinkedReport(itemId) {
  const res = await fetch(`${BASE_URL}/items/${itemId}/linked-report`);
  if (!res.ok) throw new Error('Failed to fetch linked report');
  return await res.json();
}
