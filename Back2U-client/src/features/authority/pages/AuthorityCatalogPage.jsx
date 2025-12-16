// src/features/authority/pages/AuthorityCatalogPage.jsx
// import React, { useEffect, useState } from 'react';
import React, { useEffect, useState, useContext } from 'react'; 

import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { fetchItems, deleteItem } from '../api/itemsApi';
import { AuthContext } from '../../../app/providers/createProvider'; 


export default function AuthorityCatalogPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); 


  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await fetchItems();
      setItems(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleCreate = () => navigate('/dashboard/items/create');
  const handleEdit = (id) => navigate(`/dashboard/items/update/${id}`);

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: 'Delete item?',
      text: `This will remove "${item.title}".`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;

    try {
      setDeletingId(item.id);
      await deleteItem(item.id, user?.email); 
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success('Item deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full">
      {/* Header / toolbar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Authority Intake & Cataloging (Staff)</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadItems}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="px-4 py-2 rounded bg-black text-white"
          >
            Create
          </button>
        </div>
      </div>

      {/* Loading / empty states */}
      {loading && <p className="text-sm text-gray-600">Loading…</p>}
      {!loading && items.length === 0 && (
        <div className="text-sm text-gray-600">
          No items in catalog yet.{' '}
          <button className="underline" type="button" onClick={handleCreate}>
            Create one
          </button>
          .
        </div>
      )}

      {/* Table */}
      {!loading && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Title</th>
                <th>Category</th>
                <th>Location</th>
                <th>Internal Tag</th>
                <th>Status</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <img
                      src={item.photoUrl || 'https://via.placeholder.com/48?text=Img'}
                      alt={item.title || 'photo'}
                      className="h-12 w-12 object-cover rounded border"
                      loading="lazy"
                    />
                  </td>
                  <td>{item.title}</td>
                  <td>{item.category}</td>
                  <td>{item.locationText}</td>
                  <td>{item.internalTag}</td>
                  <td>
                    {item.linkedReportId ? (
                      <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                        🔗 Linked
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Not linked</span>
                    )}
                  </td>
                  <td className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(item.id)}
                      className="btn btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="btn btn-sm btn-error"
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}