import { useEffect, useState, useRef, useCallback } from 'react';
import { Download, Trash2, FileText, Image as ImageIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { resolveFileUrl } from '../../utils/api';

function formatSize(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export default function TaskAttachments({ taskId }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const load = useCallback(
    () => api.get(`/tasks/${taskId}/attachments`).then((res) => setFiles(res.data.data)),
    [taskId]
  );

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      await api.post(`/tasks/${taskId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('File uploaded');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this file?')) return;
    await api.delete(`/attachments/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-ink-700 dark:text-ink-100">Attachments</h3>
        <label className="btn-ghost !px-2 !py-1 text-xs cursor-pointer">
          <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload'}
          <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {files.length === 0 && <p className="text-sm text-ink-300">No files attached yet.</p>}

      <ul className="space-y-1.5">
        {files.map((f) => (
          <li key={f.id} className="flex items-center gap-2.5 rounded-lg border border-ink-100 dark:border-ink-700 px-3 py-2 group">
            {f.file_type?.startsWith('image/') ? <ImageIcon size={16} className="text-ink-400 shrink-0" /> : <FileText size={16} className="text-ink-400 shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-700 dark:text-ink-200 truncate">{f.file_name}</p>
              <p className="text-[11px] text-ink-300">{formatSize(f.file_size)} · {f.uploaded_by_name}</p>
            </div>
            <a href={resolveFileUrl(f.file_url)} target="_blank" rel="noreferrer" download className="text-ink-300 hover:text-signal-500">
              <Download size={14} />
            </a>
            <button onClick={() => handleDelete(f.id)} className="text-ink-300 hover:text-priority-critical opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
