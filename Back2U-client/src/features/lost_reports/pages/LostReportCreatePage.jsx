import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { AuthContext } from '../../../app/providers/createProvider';
import { createLostReport } from '../api/lostReportsApi';
import LostReportForm from '../components/LostReportForm';

const emptyForm = {
  title: '',
  category: '',
  description: '',
  locationLost: '',
  dateLost: '',
  attachmentUrl: '',
};

export default function LostReportCreatePage() {
  const [formValues, setFormValues] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: 'Submit lost report?',
      text: 'This will create a report for your lost item.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit',
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      const payload = {
        ...formValues,
        userEmail: user?.email,
      };
      await createLostReport(payload);
      toast.success('Lost report submitted successfully');
      setFormValues(emptyForm);
      navigate('/app/lost-reports');
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit lost report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-6">Report a Lost Item</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <LostReportForm
          values={formValues}
          setValues={setFormValues}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Submit Report"
        />
      </div>
    </div>
  );
}
