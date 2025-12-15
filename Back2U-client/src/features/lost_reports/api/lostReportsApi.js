const BASE_URL = 'http://localhost:5000';

const normalizeReport = (report) => ({
  ...report,
  id:
    typeof report._id === 'object' && report._id && '$oid' in report._id
      ? report._id.$oid
      : String(report._id || report.id || ''),
});

export async function fetchLostReports(userEmail) {
  const url = userEmail 
    ? `${BASE_URL}/lostreports?userEmail=${encodeURIComponent(userEmail)}`
    : `${BASE_URL}/lostreports`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load lost reports');
  const data = await res.json();
  return data.map(normalizeReport);
}

export async function fetchLostReportById(id) {
  const res = await fetch(`${BASE_URL}/lostreports/${id}`);
  if (!res.ok) throw new Error('Failed to load lost report');
  const data = await res.json();
  return normalizeReport(data);
}

export async function createLostReport(payload) {
  const res = await fetch(`${BASE_URL}/lostreports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create lost report');
  const data = await res.json();
  return normalizeReport(data);
}

export async function updateLostReport(id, payload) {
  const res = await fetch(`${BASE_URL}/lostreports/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update lost report');
  const data = await res.json();
  return normalizeReport(data);
}

export async function deleteLostReport(id) {
  const res = await fetch(`${BASE_URL}/lostreports/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete lost report');
  return true;
}
