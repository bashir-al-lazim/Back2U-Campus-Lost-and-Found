import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

import { createItem } from '../API/itemsApi';
import AuthorityItemForm from '../components/AuthorityItemForm';

const emptyForm = {
  title: '',
  category: '',
  description: '',
  locationText: '',
  photoUrl: '',
  internalTag: '',
};

export default function AuthorityCreatePage() {
  const [formValues, setFormValues] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: 'Create item?',
      text: 'This will add a new item to the catalog.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, create',
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      await createItem(formValues);
      toast.success('Item created');
      setFormValues(emptyForm);
      navigate('/dashboard/items');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Create new item</h2>
      <AuthorityItemForm
        values={formValues}
        setValues={setFormValues}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Create item"
      />
    </div>
  );
}
