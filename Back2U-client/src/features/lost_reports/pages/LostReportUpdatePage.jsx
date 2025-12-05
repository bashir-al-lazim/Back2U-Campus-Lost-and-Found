import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { AuthContext } from '../../../app/providers/createProvider';
import { fetchLostReportById, updateLostReport } from '../api/lostReportsApi';
import LostReportForm from '../components/LostReportForm';

export default function LostReportUpdatePage() {
  const [formValues, setFormValues] = useState({
    title: '',
    category: '',
    description: '',
    locationLost: '',
    dateLost: '',
    attachmentUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const loadReport = async () => {
      try {
        const report = await fetchLostReportById(id);
        
        // Check if user owns this report
        if (report.userEmail !== user?.email) {
          toast.error('You can only edit your own reports');
          navigate('/app/lost-reports');
          return;
        }

        // Format date for input field
        const dateLost = report.dateLost 
          ? new Date(report.dateLost).toISOString().split('T')[0]
          : '';

        setFormValues({
          title: report.title || '',
          category: report.category || '',
          description: report.description || '',
          locationLost: report.locationLost || '',
          dateLost: dateLost,
          attachmentUrl: report.attachmentUrl || '',
        });
      } catch (err) {
        console.error(err);
        toast.error('Failed to load lost report');
        navigate('/app/lost-reports');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [id, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: 'Update lost report?',
      text: 'This will save your changes.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, update',
    });

    if (!result.isConfirmed) return;

    try {
      setSubmitting(true);
      await updateLostReport(id, formValues);
      toast.success('Lost report updated successfully');
      navigate('/app/lost-reports');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update lost report');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-6">Edit Lost Report</h2>
      <div className="bg-white p-6 rounded-lg shadow">
        <LostReportForm
          values={formValues}
          setValues={setFormValues}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitLabel="Update Report"
        />
      </div>
    </div>
  );
}
