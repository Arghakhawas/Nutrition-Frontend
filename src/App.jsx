import React, { useState } from "react";
import {
  FaFileExcel, FaImage, FaRegCommentDots, FaPaperPlane,
  FaDownload, FaSpinner
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from "xlsx";
import Dropzone from "react-dropzone";
import Modal from "react-modal";
import "./App.css";

Modal.setAppElement("#root");

export default function App() {
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileName, setExcelFileName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [logUrl, setLogUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contactsCount, setContactsCount] = useState(0);
  const [fieldMapping, setFieldMapping] = useState({ Name: false, Email: false });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const templates = [
    "Hello Sir/Mam (Name), this is your update.",
    "Dear (Name), we wanted to inform you...",
    "Hi (Name), here's what you need to know."
  ];

  const handleDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file || (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls"))) {
      toast.error("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    setExcelFile(file);
    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      setContactsCount(json.length);

      const columns = Object.keys(json[0] || {});
      setFieldMapping({
        Name: columns.includes("Name"),
        Email: columns.includes("Email"),
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!excelFile || !message.trim()) {
      toast.error("Please upload an Excel file and enter a message.");
      return;
    }

    setIsModalOpen(false);
    const formData = new FormData();
    formData.append("excel", excelFile);
    if (imageFile) formData.append("image", imageFile);
    formData.append("message", message);

    setIsLoading(true);
    setStatus("");
    try {
      const response = await fetch("https://nutrition-backend-tmt3.onrender.com/send", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.status);

      toast.success("✅ Messages sent successfully!");
      setStatus("✅ Messages sent successfully.");
      setLogUrl(data.log_url);

      setExcelFile(null);
      setExcelFileName("");
      setImageFile(null);
      setImagePreview(null);
      setMessage("");
      setContactsCount(0);
      setFieldMapping({ Name: false, Email: false });
    } catch (error) {
      toast.error(`❌ ${error.message}`);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`app-container ${isModalOpen ? "modal-open" : ""}`}>
      <ToastContainer />
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <h2>Confirm Send</h2>
        <p>Are you sure you want to send messages to {contactsCount} contacts?</p>
        <div className="modal-actions">
          <button onClick={handleSubmit}>Yes, Send</button>
          <button onClick={() => setIsModalOpen(false)}>Cancel</button>
        </div>
      </Modal>

      <div className="form-container animate-slide">
        <h1 className="title">📤 Nutrition By Argha</h1>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="input-group">
            <label htmlFor="excel-upload">
              <FaFileExcel /> Upload Excel File
            </label>
            <Dropzone onDrop={handleDrop} accept=".xlsx, .xls" multiple={false}>
              {({ getRootProps, getInputProps }) => (
                <div className="dropzone" {...getRootProps()}>
                  <input {...getInputProps()} id="excel-upload" />
                  <p>{excelFileName || "Drag & drop an Excel file here or click to select"}</p>
                </div>
              )}
            </Dropzone>
          </div>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button type="button" onClick={() => setImageFile(null)}>Remove Image</button>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="message">
              <FaRegCommentDots /> Message Content
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here"
            ></textarea>
          </div>

          <div className="action-buttons">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              disabled={isLoading || !excelFile || !message.trim()}
            >
              {isLoading ? <FaSpinner className="spin" /> : <FaPaperPlane />} Send Emails
            </button>
          </div>
        </form>

        {logUrl && (
          <div className="log">
            <a href={logUrl} target="_blank" rel="noopener noreferrer">
              <FaDownload /> Download Log
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
