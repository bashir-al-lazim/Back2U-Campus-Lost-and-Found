import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { fetchItems } from '../api/itemsApi';
import { linkReportToItem } from '../api/linkingApi';

export default function LinkToItemModal({ report, onClose, onSuccess }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await fetchItems();
        // Filter out already linked items
        const availableItems = data.filter(item => !item.linkedReportId);
        setItems(availableItems);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load items');
      } finally {
        setLoading(false);
      }
    };
    loadItems();
  }, []);

  const filteredItems = items.filter((item) =>
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLink = async (item) => {
    const result = await Swal.fire({
      title: 'Link this item?',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Report:</strong> ${report.title}</p>
          <p><strong>Item:</strong> ${item.title}</p>
        </div>
      `,
      text: 'This will link the lost report to the found item.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, link them',
    });

    if (!result.isConfirmed) return;

    try {
      setLinking(true);
      await linkReportToItem(report.id, item.id);
      toast.success('Successfully linked report to item');
      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to link report to item');
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            Link Report: {report.title}
          </h3>
          <button
            onClick={onClose}
            disabled={linking}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search items by title, description, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm
                ? 'No items match your search'
                : 'No available items to link'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold">{item.title}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>Category: {item.category}</div>
                        <div>Location: {item.locationText || item.location}</div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">
                        {item.description}
                      </p>
                    </div>
                    <button
                      onClick={() => handleLink(item)}
                      disabled={linking}
                      className={`ml-3 px-3 py-1.5 rounded text-sm ${
                        linking
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {linking ? 'Linking...' : 'Link'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            disabled={linking}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
