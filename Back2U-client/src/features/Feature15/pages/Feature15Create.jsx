import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const Feature15Create = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [studentID, setStudentID] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(""); // new
  const [dateFound, setDateFound] = useState(""); // new
  const [loading, setLoading] = useState(false);
  
  
  const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !description || !studentID || !studentEmail || !location || !dateFound) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!photo) {
      toast.error("Please upload a photo");
      return;
    }

    setLoading(true);

    try {
      const photoBase64 = await fileToBase64(photo);

      //const formData = new FormData();
      //formData.append("title", title);
      //formData.append("description", description);
      //formData.append("category", category);
      //formData.append("studentID", studentID);
      //formData.append("studentEmail", studentEmail);
      //formData.append("photo", photo);
      //formData.append("location", location); // new
      //formData.append("dateFound", dateFound); // new

      //const res = await axios.post(
        //"http://localhost:5000/feature15/item",
        //formData,
        //{ headers: { "Content-Type": "multipart/form-data" } }
      //);

 const res = await axios.post("http://localhost:5000/feature15/item", {
  title,
  description,
  category,
  studentID,
  studentEmail,
  location,
  dateFound,
  photoBase64,
});


      if (res.data.success) {
        toast.success("Item posted successfully!");
        setTitle("");
        setDescription("");
        setCategory("");
        setStudentID("");
        setStudentEmail("");
        setPhoto(null);
        setLocation("");
        setDateFound("");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to post item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-4 max-w-md mx-auto bg-white rounded shadow"
      >
        <h2 className="text-xl font-semibold mb-4">Create Peer-Held Item</h2>

        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="input input-bordered w-full" required />

        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="textarea textarea-bordered w-full" required />

        <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="input input-bordered w-full" />

        <input type="text" placeholder="Student ID" value={studentID} onChange={(e) => setStudentID(e.target.value)} className="input input-bordered w-full" required />

        <input type="email" placeholder="Student Email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="input input-bordered w-full" required />

        <input type="text" placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} className="input input-bordered w-full" required />

        <input type="date" placeholder="Date Found" value={dateFound} onChange={(e) => setDateFound(e.target.value)} className="input input-bordered w-full" required />

        {/* Upload Photo */}
        <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} className="file-input file-input-bordered w-full" required />
        {photo && <p className="text-sm text-gray-600">Selected: {photo.name}</p>}

        <button type="submit" className={`btn btn-primary w-full ${loading ? "loading" : ""}`} disabled={loading}>
          {loading ? "Posting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default Feature15Create;
