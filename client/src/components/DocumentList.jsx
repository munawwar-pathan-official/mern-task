import React, { useState } from 'react';
import { FileText, Download, UploadCloud, Image as ImageIcon, FileCheck, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function DocumentList({ caseId, documents, onDocumentUploaded, canUpload }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    setError('');

    try {
      await api.post(`/cases/${caseId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSelectedFile(null);
      if (onDocumentUploaded) onDocumentUploaded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getDownloadUrl = (pathStr) => {
    if (!pathStr) return '#';
    if (pathStr.startsWith('http')) return pathStr;
    const baseUrl = import.meta.env.VITE_API_URL || '';
    return `${baseUrl}${pathStr}`;
  };

  return (
    <div className="space-y-6">
      {/* Upload Box (Visible to assigned Agent or Manager) */}
      {canUpload && (
        <form
          onSubmit={handleUploadSubmit}
          className="bg-slate-900/80 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 transition-all group"
        >
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <label className="cursor-pointer">
              <span className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                Click to choose supporting file / photo
              </span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
              />
            </label>
            <p className="text-xs text-slate-500 mt-1">
              Supports images (JPG, PNG), PDFs, DOCX up to 10MB
            </p>

            {selectedFile && (
              <div className="mt-3 flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs text-indigo-300 font-medium">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                <span>{selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
              </div>
            )}

            {error && (
              <p className="text-xs font-medium text-rose-400 mt-2">{error}</p>
            )}

            {selectedFile && (
              <button
                type="submit"
                disabled={uploading}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Confirm & Upload File</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      )}

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm bg-slate-900/40 rounded-xl border border-slate-800/50">
          No supporting documents attached yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {documents.map((doc) => {
            const isImage = doc.mimeType?.startsWith('image/');
            const FileIcon = isImage ? ImageIcon : FileText;

            return (
              <div
                key={doc._id}
                className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3 hover:border-slate-700 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                    <FileIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {doc.originalName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span>{formatFileSize(doc.size)}</span>
                      <span>•</span>
                      <span>{doc.uploadedBy?.name || 'Agent'}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={getDownloadUrl(doc.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition-colors shrink-0"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
