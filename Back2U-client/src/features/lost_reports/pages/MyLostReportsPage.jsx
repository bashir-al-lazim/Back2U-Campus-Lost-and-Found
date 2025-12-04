import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { format } from 'date-fns';
import { AuthContext } from '../../../app/providers/createProvider';
import { fetchLostReports, deleteLostReport } from '../api/lostReportsApi';

export default function MyLostReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await fetchLostReports(user?.email);
      setReports(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lost reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      loadReports();
    }
  }, [user]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete this report?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    try {
      await deleteLostReport(id);
      toast.success('Report deleted successfully');
      loadReports();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete report');
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Lost Reports</h2>
        <Link
          to="/app/lost-reports/create"
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          + New Report
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">You haven't filed any lost reports yet.</p>
          <Link
            to="/app/lost-reports/create"
            className="text-blue-600 hover:underline"
          >
            Create your first report
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => (
            <div
              key={report.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{report.title}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    report.status === 'Active'
                      ? 'bg-green-100 text-green-800'
                      : report.status === 'Resolved'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Category:</span> {report.category}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Lost at:</span> {report.locationLost}
                </div>
                {report.dateLost && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Date:</span>{' '}
                    {format(new Date(report.dateLost), 'MMM dd, yyyy')}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                {report.description}
              </p>

              {report.attachmentUrl && (
                <div className="mb-3">
                  <a
                    href={report.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View attachment
                  </a>
                </div>
              )}

              <div className="flex gap-2">
                <Link
                  to={`/app/lost-reports/update/${report.id}`}
                  className="flex-1 text-center bg-gray-100 text-gray-800 px-3 py-1.5 rounded text-sm hover:bg-gray-200"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(report.id)}
                  className="flex-1 bg-red-100 text-red-800 px-3 py-1.5 rounded text-sm hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
