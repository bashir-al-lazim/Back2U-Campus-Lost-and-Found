import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

import { fetchItems, updateItem } from '../api/itemsApi';
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
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetchItems()
      .then((items) => {
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
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load item');
        navigate('/dashboard/items');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

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