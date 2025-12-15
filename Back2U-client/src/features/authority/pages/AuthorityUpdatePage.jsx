import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { fetchItems, updateItem } from '../api/itemsApi';
import { unlinkReportFromItem, getLinkedReport } from '../api/linkingApi';
import AuthorityItemForm from '../components/AuthorityItemForm';

const emptyForm = {
  title: '',
  category: '',
  description: '',
  locationText: '',
  photoUrl: '',
  internalTag: '',
};

export default function AuthorityUpdatePage() {
  const [formValues, setFormValues] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [linkedReport, setLinkedReport] = useState(null);
  const [unlinking, setUnlinking] = useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  const loadItemAndLinkedReport = async () => {
    setLoading(true);
    try {
      const items = await fetchItems();
      const item = items.find((i) => i.id === id);
      if (!item) {
        toast.error('Item not found');
        navigate('/dashboard/items');
        return;
      }
      setFormValues({
        title: item.title || '',
        category: item.category || '',
        description: item.description || '',
        locationText: item.locationText || '',
        photoUrl: item.photoUrl || '',
        internalTag: item.internalTag || '',
      });

      // Load linked report if exists
      if (item.linkedReportId) {
        const report = await getLinkedReport(id);
        setLinkedReport(report);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load item');
      navigate('/dashboard/items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItemAndLinkedReport();
  }, [id, navigate]);

  const handleUnlink = async () => {
    if (!linkedReport) return;

    const result = await Swal.fire({
      title: 'Unlink this report?',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>Report:</strong> ${linkedReport.title}</p>
          <p>This will remove the link between the report and this item.</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, unlink',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    try {
      setUnlinking(true);
      await unlinkReportFromItem(linkedReport.id, id);
      toast.success('Successfully unlinked');
      setLinkedReport(null);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to unlink');
    } finally {
      setUnlinking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: 'Update item?',
      text: 'Changes will be saved.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      await updateItem(id, formValues);
      toast.success('Item updated');
      navigate('/dashboard/items');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update item');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p>Loading item...</p>;
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Edit item</h2>
      
      {/* Linked Report Section */}
      {linkedReport && (
        <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                🔗 Linked to Lost Report
              </h3>
              <div className="text-sm text-blue-800">
                <div><strong>Title:</strong> {linkedReport.title}</div>
                <div><strong>Category:</strong> {linkedReport.category}</div>
                <div><strong>Reported by:</strong> {linkedReport.userEmail}</div>
                <div><strong>Description:</strong> {linkedReport.description}</div>
              </div>
            </div>
            <button
              onClick={handleUnlink}
              disabled={unlinking}
              className={`px-3 py-1.5 rounded text-sm ${
                unlinking
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {unlinking ? 'Unlinking...' : 'Unlink'}
            </button>
          </div>
        </div>
      )}

      <AuthorityItemForm
        values={formValues}
        setValues={setFormValues}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Update item"
      />
    </div>
  );
}