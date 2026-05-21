
import React, { useState } from 'react';

const DynamicDocumentUpload = ({ onChange }) => {
  const [documents, setDocuments] = useState([
    { name: '', file: null }
  ]);

  const handleNameChange = (idx, value) => {
    const updated = [...documents];
    updated[idx].name = value;
    setDocuments(updated);
    onChange && onChange(updated);
  };

  const handleFileChange = (idx, file) => {
    const updated = [...documents];
    updated[idx].file = file;
    setDocuments(updated);
    onChange && onChange(updated);
  };

  const addDocument = () => {
    setDocuments([...documents, { name: '', file: null }]);
  };

  const removeDocument = (idx) => {
    const updated = documents.filter((_, i) => i !== idx);
    setDocuments(updated);
    onChange && onChange(updated);
  };

  return (
    <div>
      {documents.map((doc, idx) => (
        <div className="dashboard-doc-upload-group" key={idx}>
          <label className="dashboard-doc-upload-label" style={{marginBottom: 0}}>
            Document Name
            <input
              type="text"
              className="dashboard-doc-upload-input"
              value={doc.name}
              onChange={e => handleNameChange(idx, e.target.value)}
              placeholder="Enter document name"
              required
              style={{marginTop: 4}}
            />
          </label>
          <label className="dashboard-doc-upload-label" style={{marginTop: 8, marginBottom: 0}}>
            <span style={{display: 'block', marginBottom: 2}}>Choose Document</span>
            <input
              type="file"
              className="dashboard-doc-upload-input"
              onChange={e => handleFileChange(idx, e.target.files[0])}
              required
              style={{marginTop: 2}}
            />
          </label>
          {documents.length > 1 && (
            <button type="button" onClick={() => removeDocument(idx)} style={{marginTop: 4, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.92rem', padding: 0}}>
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addDocument}
        style={{
          marginBottom: 12,
          color: '#2563eb',
          background: 'none',
          border: 'none',
          borderRadius: 0,
          padding: 0,
          cursor: 'pointer',
          textDecoration: 'underline',
          fontSize: '0.98rem',
          fontWeight: 600
        }}
      >
        + Add another document
      </button>
    </div>
  );
};

export default DynamicDocumentUpload;
