import React, { useState, useEffect } from 'react';

// If value/onChange are provided, act as controlled; else, manage own state
export default function DynamicForm({ schema = {}, value, onChange, hideSubmit, onSubmit }) {
  const [formData, setFormData] = useState(value || {});

  useEffect(() => {
    if (value) setFormData(value);
  }, [value]);

  if (!schema.fields || !Array.isArray(schema.fields)) {
    return <div>No form defined for this service.</div>;
  }

  const handleChange = (name, val) => {
    const updated = { ...formData, [name]: val };
    setFormData(updated);
    if (onChange) onChange(updated);
  };

  const handleFileChange = (name, files) => {
    const updated = { ...formData, [name]: files[0] };
    setFormData(updated);
    if (onChange) onChange(updated);
  };

  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (onSubmit) onSubmit(formData);
  };

  const fields = schema.fields.map((field) => {
    if (field.type === 'text' || field.type === 'number') {
      return (
        <div key={field.name}>
          <label className="label">{field.label}</label>
          <input
            type={field.type}
            className="input-field"
            required={field.required}
            value={formData[field.name] || ''}
            onChange={e => handleChange(field.name, e.target.value)}
          />
        </div>
      );
    }
    if (field.type === 'select') {
      return (
        <div key={field.name}>
          <label className="label">{field.label}</label>
          <select
            className="input-field"
            required={field.required}
            value={formData[field.name] || ''}
            onChange={e => handleChange(field.name, e.target.value)}
          >
            <option value="">Select</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }
    if (field.type === 'file') {
      return (
        <div key={field.name}>
          <label className="label">{field.label}</label>
          <input
            type="file"
            className="input-field"
            required={field.required}
            onChange={e => handleFileChange(field.name, e.target.files)}
          />
        </div>
      );
    }
    // timerange field removed
    return null;
  });

  if (onChange || hideSubmit) {
    // Controlled usage, no submit button
    return <div className="space-y-4">{fields}</div>;
  }

  // Uncontrolled usage, has submit button
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields}
      <button type="submit" className="btn btn-primary">Submit</button>
    </form>
  );
}