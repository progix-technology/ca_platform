import React, { useState } from 'react';

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'file', label: 'File' },
  { value: 'select', label: 'Select (Dropdown)' },
];

export default function FormBuilder({ value = { fields: [] }, onChange }) {
  const [fields, setFields] = useState(value.fields || []);
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    options: '', // comma separated for select
  });

  const handleAddField = () => {
    if (!newField.name.trim() || !newField.label.trim()) return;
    let field = { ...newField };
    if (field.type === 'select') {
      field.options = field.options.split(',').map(opt => opt.trim()).filter(Boolean);
    } else {
      delete field.options;
    }
    setFields([...fields, field]);
    setNewField({ name: '', label: '', type: 'text', required: false, options: '' });
    onChange && onChange({ fields: [...fields, field] });
  };

  const handleDeleteField = (idx) => {
    const updated = fields.filter((_, i) => i !== idx);
    setFields(updated);
    onChange && onChange({ fields: updated });
  };

  const handleFieldChange = (idx, key, val) => {
    const updated = fields.map((f, i) =>
      i === idx ? { ...f, [key]: key === 'required' ? val.target.checked : val.target.value } : f
    );
    setFields(updated);
    onChange && onChange({ fields: updated });
  };

  return (
    <div className="space-y-4">
      <div className="p-3 border rounded bg-slate-50">
        <div className="font-semibold mb-2 text-slate-700">Add New Field</div>
        <div className="flex flex-wrap gap-2 items-end">
          <input
            className="input-field"
            placeholder="Field Name (e.g. pan)"
            value={newField.name}
            onChange={e => setNewField(f => ({ ...f, name: e.target.value }))}
          />
          <input
            className="input-field"
            placeholder="Label (e.g. PAN Number)"
            value={newField.label}
            onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
          />
          <select
            className="input-field"
            value={newField.type}
            onChange={e => setNewField(f => ({ ...f, type: e.target.value, options: '' }))}
          >
            {FIELD_TYPES.map(ft => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
          </select>
          {newField.type === 'select' && (
            <input
              className="input-field"
              placeholder="Options (comma separated)"
              value={newField.options}
              onChange={e => setNewField(f => ({ ...f, options: e.target.value }))}
            />
          )}
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={newField.required}
              onChange={e => setNewField(f => ({ ...f, required: e.target.checked }))}
            />
            Required
          </label>
          <button type="button" className="btn btn-primary px-3 py-1 text-xs" onClick={handleAddField}>
            Add Field
          </button>
        </div>
      </div>
      <div>
        <div className="font-semibold mb-2 text-slate-700">Fields</div>
        {fields.length === 0 ? (
          <div className="text-slate-400 text-sm">No fields added yet.</div>
        ) : (
          <table className="w-full text-xs border">
            <thead>
              <tr className="bg-slate-100">
                <th>Name</th>
                <th>Label</th>
                <th>Type</th>
                <th>Required</th>
                <th>Options</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, idx) => (
                <tr key={idx}>
                  <td>{f.name}</td>
                  <td>{f.label}</td>
                  <td>{f.type}</td>
                  <td>{f.required ? 'Yes' : 'No'}</td>
                  <td>{Array.isArray(f.options) ? f.options.join(', ') : ''}</td>
                  <td>
                    <button type="button" className="btn btn-danger btn-xs" onClick={() => handleDeleteField(idx)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
