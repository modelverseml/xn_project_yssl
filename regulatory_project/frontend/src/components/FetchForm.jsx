import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DOMAIN_API } from "../config";

export default function FetchForm() {
  const navigate = useNavigate(); // <-- for navigation
  const [activeTab, setActiveTab] = useState("url"); // 'url' or 'text'
  const [url, setUrl] = useState("");
  const [textInput, setTextInput] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handlePreview = async (useText = false) => {
    setLoading(true);
    setError("");
    try {
      const payload = useText ? { text: textInput } : { url };
      const res = await axios.post(`${DOMAIN_API}/fetch-preview/`, payload);
      setPreview(res.data);
    } catch (err) {
      setError("Failed to fetch preview or summarize text");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      const payload = {
        url: preview.url,
        text: preview.text,
        title: preview.title,
      };
      const res = await axios.post(`${DOMAIN_API}/fetch/`, payload);

      // Redirect to list page after saving
      navigate("/list"); // <-- change to your list route if different
    } catch (err) {
      setError("Failed to save document");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container">
      <h3 className="text-primary mb-4">Fetch URL or Input Text</h3>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "url" ? "active" : ""}`}
            onClick={() => setActiveTab("url")}
          >
            Fetch from URL
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "text" ? "active" : ""}`}
            onClick={() => setActiveTab("text")}
          >
            Enter Text
          </button>
        </li>
      </ul>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* URL Tab */}
      {activeTab === "url" && (
        <div className="mb-3">
          <label className="form-label">Enter URL</label>
          <input
            type="text"
            className="form-control"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="btn btn-primary mt-2"
            onClick={() => handlePreview(false)}
            disabled={loading || !url}
          >
            {loading ? "Fetching..." : "Preview from URL"}
          </button>
        </div>
      )}

      {/* Text Tab */}
      {activeTab === "text" && (
        <div className="mb-3">
          <label className="form-label">Enter Text</label>
          <textarea
            className="form-control"
            placeholder="Paste text here..."
            rows={6}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
          />
          <button
            className="btn btn-secondary mt-2"
            onClick={() => handlePreview(true)}
            disabled={loading || !textInput}
          >
            {loading ? "Summarizing..." : "Preview from Text"}
          </button>
        </div>
      )}

      {/* Preview Section */}
      {preview && (
        <div className="card p-4 mt-4">
          <h5>Title: {preview.title}</h5>

          <div className="mb-3">
            <label className="form-label">Edit Summarized Text Before Saving</label>
            <textarea
              className="form-control"
              rows={10}
              value={preview.text}
              onChange={(e) =>
                setPreview((prev) => ({ ...prev, text: e.target.value }))
              }
            />
          </div>

          <div className="mb-3">
            <strong>Tags:</strong> {preview.tags.join(", ")}
          </div>
          <div className="mb-3">
            <strong>Entities:</strong> {preview.entities.join(", ")}
          </div>
          <div className="mb-3">
            <strong>Severity:</strong> {preview.severity} | <strong>Probability:</strong> {preview.probability}
          </div>

          <button
            className="btn btn-success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save to Database"}
          </button>
        </div>
      )}
    </div>
  );
}
