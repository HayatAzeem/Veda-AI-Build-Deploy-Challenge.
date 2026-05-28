'use client';
import { useState, useRef } from 'react';
import { useAssignmentStore } from '../store/useAssignmentStore';

export default function FileUpload() {
  const { formData, setFormField } = useAssignmentStore();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
    if (allowed.includes(file.type) && file.size <= 10 * 1024 * 1024) {
      setFormField('file', file);
    }
  };

  return (
    <div>
      <div
        className={`file-upload-zone fade-in ${dragging ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
      >
        <div className="file-upload-icon-wrap">
          <div className="file-upload-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
        </div>
        <div className="file-upload-title">Click to upload or drag and drop</div>
        <div className="file-upload-sub">PDF, PNG, JPG or TXT (max. 10MB)</div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.txt"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>
      {formData.file && (
        <div className="file-selected fade-in">
          <div className="file-selected-info">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E84525" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span className="file-selected-name">{formData.file.name}</span>
          </div>
          <button
            className="btn-icon"
            onClick={e => { e.stopPropagation(); setFormField('file', null); }}
            title="Remove File"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
