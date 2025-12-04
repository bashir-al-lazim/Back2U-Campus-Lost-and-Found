import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { fetchLostReports } from '../../../lost_reports/api/lostReportsApi';
import LinkToItemModal from '../../components/LinkToItemModal';

export default function AuthorityLostReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [linkingReport, setLinkingReport] = useState(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await fetchLostReports(); // Get all reports for staff
      setReports(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lost reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === 'All' || report.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleLinkSuccess = () => {
    setLinkingReport(null);
    loadReports(); // Reload to show updated linked status
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-4">Lost Reports (Staff View)</h2>

      {/* Filters */}
      <div className="mb-4 space-y-3">
        <input
          type="text"
          placeholder="Search by title, description, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="All">All Categories</option>
          <option value="Books">Books</option>
          <option value="Electronics">Electronics</option>
          <option value="ID Card">ID Card</option>
          <option value="Clothing">Clothing</option>
          <option value="Accessories">Accessories</option>
          <option value="Others">Others</option>
        </select>
      </div>

      {/* Results count */}
      <div className="mb-3 text-sm text-gray-600">
        Showing {filteredReports.length} of {reports.length} reports
      </div>

      {/* Reports list */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded">
          <p className="text-gray-500">No reports found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="border border-gray-200 rounded p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{report.title}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    <div>Reported by: {report.userEmail}</div>
                    <div>Category: {report.category}</div>
                    <div>Lost at: {report.locationLost}</div>
                    {report.dateLost && (
                      <div>
                        Date: {format(new Date(report.dateLost), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
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
                  {report.linkedItemId && (
                    <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                      🔗 Linked
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">{report.description}</p>

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
                {!report.linkedItemId ? (
                  <button
                    onClick={() => setLinkingReport(report)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                  >
                    Link to Item
                  </button>
                ) : (
                  <div className="text-sm text-gray-600">
                    Already linked to an item
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link Modal */}
      {linkingReport && (
        <LinkToItemModal
          report={linkingReport}
          onClose={() => setLinkingReport(null)}
          onSuccess={handleLinkSuccess}
        />
      )}
    </div>
  );
}
