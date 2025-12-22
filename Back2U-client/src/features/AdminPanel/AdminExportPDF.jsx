import axios from "axios";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";

const API = "http://localhost:5000";

export default function AdminExportPDF() {
  const auth = getAuth();

  const handleExportPDF = async () => {
    try {
      const token = await auth.currentUser.getIdToken(true);

      const response = await axios.get(
        `${API}/admin/export/resolved-items-pdf`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "resolved-items-report.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("Export PDF failed:", err);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <button
      onClick={handleExportPDF}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      Export Resolved Items (PDF)
    </button>
  );
}
