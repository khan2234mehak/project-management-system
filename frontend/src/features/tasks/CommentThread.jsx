import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { Send, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Avatar from '../../components/common/Avatar';
import { getSocket } from '../../hooks/useSocket';

export default function CommentThread({ taskId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/tasks/${taskId}/comments`).then((res) => setComments(res.data.data));
  }, [taskId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('task:join', taskId);

    const onNew = (comment) => setComments((prev) => [...prev, comment]);
    const onUpdated = ({ id, content: newContent }) =>
      setComments((prev) => prev.map((c) => (c.id === id ? { ...c, content: newContent, is_edited: 1 } : c)));
    const onDeleted = ({ id }) => setComments((prev) => prev.filter((c) => c.id !== id));

    socket.on('comment:new', onNew);
    socket.on('comment:updated', onUpdated);
    socket.on('comment:deleted', onDeleted);

    return () => {
      socket.emit('task:leave', taskId);
      socket.off('comment:new', onNew);
      socket.off('comment:updated', onUpdated);
      socket.off('comment:deleted', onDeleted);
    };
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await api.post(`/tasks/${taskId}/comments`, { content: content.trim() });
      setContent('');
      // Note: the new comment arrives via the socket event for everyone,
      // including this client, so we don't need to append it manually here.
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSending(false);
    }
  };

  const startEdit = (c) => { setEditingId(c.id); setEditContent(c.content); };

  const saveEdit = async (id) => {
    if (!editContent.trim()) return;
    await api.put(`/comments/${id}`, { content: editContent.trim() });
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return;
    await api.delete(`/comments/${id}`);
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-semibold text-ink-700 dark:text-ink-100 mb-3">Comments</h3>

      <div className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-80">
        {comments.length === 0 && <p className="text-sm text-ink-300 text-center py-6">No comments yet. Start the discussion.</p>}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-2.5 group">
            <Avatar name={c.user_name} src={c.user_avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-ink-800 dark:text-ink-100">{c.user_name}</span>
                <span className="text-[11px] text-ink-300">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                  {c.is_edited ? ' · edited' : ''}
                </span>
              </div>

              {editingId === c.id ? (
                <div className="flex gap-2 mt-1">
                  <input className="input !py-1 text-sm" value={editContent} onChange={(e) => setEditContent(e.target.value)} autoFocus />
                  <button onClick={() => saveEdit(c.id)} className="btn-secondary !px-2 !py-1 text-xs">Save</button>
                  <button onClick={() => setEditingId(null)} className="btn-ghost !px-2 !py-1 text-xs">Cancel</button>
                </div>
              ) : (
                <p className="text-sm text-ink-600 dark:text-ink-300 break-words">{c.content}</p>
              )}
            </div>

            {c.user_id === user?.id && editingId !== c.id && (
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity shrink-0">
                <button onClick={() => startEdit(c)} className="text-ink-300 hover:text-signal-500"><Pencil size={13} /></button>
                <button onClick={() => handleDelete(c.id)} className="text-ink-300 hover:text-priority-critical"><Trash2 size={13} /></button>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2 mt-auto">
        <input
          className="input !py-2 text-sm"
          placeholder="Write a comment… use @name to mention"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button type="submit" disabled={sending || !content.trim()} className="btn-primary !px-3">
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
