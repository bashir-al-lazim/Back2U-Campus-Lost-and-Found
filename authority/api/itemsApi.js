const BASE_URL = 'http://localhost:5000';

const normalizeItem = (item) => ({
  ...item,
  id:
    typeof item._id === 'object' && item._id && '$oid' in item._id
      ? item._id.$oid
      : String(item._id || item.id || ''),
});

export async function fetchItems() {
  const res = await fetch(`${BASE_URL}/items`);
  if (!res.ok) throw new Error('Failed to load items');
  const data = await res.json();
  return data.map(normalizeItem);
}

export async function createItem(payload) {
  const res = await fetch(`${BASE_URL}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create item');
  const data = await res.json();
  return normalizeItem(data);
}

export async function updateItem(id, payload) {
  const res = await fetch(`${BASE_URL}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update item');
  const data = await res.json();
  return normalizeItem(data);
}

export async function deleteItem(id) {
  const res = await fetch(`${BASE_URL}/items/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete item');
  return true;
}

