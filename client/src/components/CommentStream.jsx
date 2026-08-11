import React, { useState } from 'react';
import { Send, MessageSquare, User, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function CommentStream({ caseId, comments, onCommentAdded }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');

    try {
      await api.post(`/cases/${caseId}/comments`, { text });
      setText('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Comment Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add case investigation note, update, or feedback..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
        />

        {error && (
          <p className="text-xs font-medium text-rose-400 mt-1">{error}</p>
        )}

        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Post Note</span>
          </button>
        </div>
      </form>

      {/* Comment Stream */}
      {comments.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm bg-slate-900/40 rounded-xl border border-slate-800/50">
          No case notes added yet.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const formattedDate = new Date(comment.createdAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
            });
            const isManager = comment.author?.role === 'Manager';

            return (
              <div
                key={comment._id}
                className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 border border-slate-700 text-xs font-bold">
                      {comment.author?.name ? comment.author.name[0] : 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-200">
                      {comment.author?.name || 'User'}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                        isManager
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}
                    >
                      {comment.author?.role || 'Agent'}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    {formattedDate}
                  </span>
                </div>

                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {comment.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
