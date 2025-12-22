import AdminExportPDF from "./AdminExportPDF";

export default function AdminAnalytics() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <AdminExportPDF />
    </div>
  );
}
