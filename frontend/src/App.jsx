import { useState, useRef } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/upload";

function App() {
  const [files, setFiles] = useState([]);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState([]);
  const cancelTokenRef = useRef(null);

  const allowedTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  const validateFiles = (selectedFiles) => {
    if (selectedFiles.length > 5) {
      alert("❌ Max 5 files allowed");
      return false;
    }

    for (let file of selectedFiles) {
      if (!allowedTypes.includes(file.type)) {
        alert("❌ Only CSV or Excel files allowed");
        return false;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert("❌ File size exceeds 50MB");
        return false;
      }
    }
    return true;
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (validateFiles(selected)) {
      setFiles(selected);
      setProgress(0);
      setMessage("");
      setPreview([]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    if (validateFiles(dropped)) {
      setFiles(dropped);
      setProgress(0);
      setMessage("");
      setPreview([]);
    }
  };

  const uploadFiles = async () => {
    if (!files.length) {
      alert("Select files first");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    cancelTokenRef.current = axios.CancelToken.source();

    try {
      const response = await axios.post(API_URL, formData, {
        cancelToken: cancelTokenRef.current.token,
        onUploadProgress: (e) => {
          const percent = Math.round((e.loaded * 100) / e.total);
          setProgress(percent);
        },
      });

      setMessage("✅ Files uploaded successfully");
      setPreview(response.data.preview);
    } catch (error) {
      if (axios.isCancel(error)) {
        setMessage("⛔ Upload cancelled");
      } else {
        setMessage("❌ Upload failed");
      }
    }
  };

  const cancelUpload = () => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel();
      setProgress(0);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
      <h1>CSV / Excel Upload</h1>

      {/* Drag & Drop */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: "2px dashed #888",
          padding: 30,
          marginBottom: 20,
          cursor: "pointer",
        }}
      >
        Drag & Drop files here
        <br />
        OR
        <br />
        <input
          type="file"
          multiple
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
        />
      </div>

      <p>{files.length} file(s) selected</p>

      <button onClick={uploadFiles}>Upload</button>
      <button onClick={cancelUpload} style={{ marginLeft: 10 }}>
        Cancel
      </button>

      {progress > 0 && <p>Uploading: {progress}%</p>}
      <p>{message}</p>

      {/* Preview */}
      {preview.map((file, index) => (
        <div
          key={index}
          style={{ marginTop: 20, borderTop: "1px solid #ccc" }}
        >
          <h4>{file.filename}</h4>
          <p>Rows: {file.rows}</p>
          <p>Columns: {file.columns.join(", ")}</p>
        </div>
      ))}
    </div>
  );
}

export default App;




