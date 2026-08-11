import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import CaseTimeline from '../components/CaseTimeline';
import DocumentList from '../components/DocumentList';
import CommentStream from '../components/CommentStream';
import AuditLogList from '../components/AuditLogList';
import {
  ArrowLeft,
  Calendar,
  Briefcase,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Send,
  History,
  FileText,
  MessageSquare,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import api from '../services/api';

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isManager } = useAuth();

  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [comments, setComments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [agents, setAgents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'comments' | 'audit'

  // Manager Assignment State
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchCaseDetails = useCallback(async () => {
    try {
      const [caseRes, docsRes, commsRes, auditRes] = await Promise.all([
        api.get(`/cases/${id}`),
        api.get(`/cases/${id}/documents`),
        api.get(`/cases/${id}/comments`),
        api.get(`/cases/${id}/audit-logs`),
      ]);

      setCaseData(caseRes.data);
      setDocuments(docsRes.data);
      setComments(commsRes.data);
      setAuditLogs(auditRes.data);
      if (caseRes.data.assignedTo) {
        setSelectedAgentId(caseRes.data.assignedTo._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load case details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCaseDetails();
  }, [fetchCaseDetails]);

  useEffect(() => {
    if (isManager()) {
      api.get('/auth/agents')
        .then((res) => setAgents(res.data))
        .catch((err) => console.error(err));
    }
  }, [isManager]);

  // Handle status update
  const handleStatusTransition = async (newStatus, note = '') => {
    setActionLoading(true);
    setError('');

    try {
      await api.put(`/cases/${id}/status`, { newStatus, note });
      await fetchCaseDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update case status');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Manager Assignment
  const handleAssignAgentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgentId) return;

    setAssigning(true);
    setError('');

    try {
      await api.put(`/cases/${id}/assign`, { agentId: selectedAgentId });
      await fetchCaseDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign agent');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <span className="text-xs font-semibold">Loading case records...</span>
        </div>
      </div>
    );
  }

  if (error && !caseData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Access Restricted or Not Found</h3>
            <p className="text-xs text-slate-400 mb-6">{error}</p>
            <Link
              to="/"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isAssignedAgent =
    caseData.assignedTo && caseData.assignedTo._id === user?._id;
  const canUploadOrEdit = isManager() || isAssignedAgent;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="text-xs font-mono text-slate-500">
            Case ID: {caseData._id}
          </div>
        </div>

        {/* Server Error Alert Banner */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-xs font-semibold text-rose-400">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Case Header Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StatusBadge status={caseData.status} size="large" />
                <span className="text-xs font-semibold text-slate-400 bg-slate-800/60 border border-slate-700 px-3 py-1 rounded-full">
                  {caseData.caseType}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {caseData.clientName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-400">
                <div className="flex items-center gap-1.5 font-medium text-slate-300">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <span>Subject: <strong className="text-white">{caseData.subjectName}</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5 font-mono">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Due: {new Date(caseData.dueDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
                </div>
              </div>
            </div>

            {/* Action Bar based on Role & State Machine */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 min-w-[280px]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Transition Controls ({user?.role})
              </p>

              {/* Manager Actions */}
              {isManager() && (
                <div className="space-y-3">
                  {/* Assignment Form */}
                  {(caseData.status === 'New' || caseData.status === 'Assigned') && (
                    <form onSubmit={handleAssignAgentSubmit} className="flex gap-2">
                      <select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">-- Select Agent --</option>
                        {agents.map((ag) => (
                          <option key={ag._id} value={ag._id}>
                            {ag.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={assigning || !selectedAgentId}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl disabled:opacity-40 transition-all shrink-0"
                      >
                        {assigning ? '...' : 'Assign'}
                      </button>
                    </form>
                  )}

                  {/* Submission Review Controls */}
                  {caseData.status === 'Submitted' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleStatusTransition('Cleared', 'Manager approved report')}
                        disabled={actionLoading}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Mark Cleared</span>
                      </button>

                      <button
                        onClick={() => handleStatusTransition('Discrepant', 'Manager identified discrepancies')}
                        disabled={actionLoading}
                        className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Discrepant</span>
                      </button>
                    </div>
                  )}

                  {['Cleared', 'Discrepant'].includes(caseData.status) && (
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs font-semibold text-slate-400">
                      Final State Reached ({caseData.status})
                    </div>
                  )}
                </div>
              )}

              {/* Agent Actions */}
              {!isManager() && (
                <div className="space-y-2">
                  {caseData.status === 'Assigned' && (
                    <button
                      onClick={() => handleStatusTransition('In Progress', 'Agent started field investigation')}
                      disabled={actionLoading}
                      className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      <span>Start Work (In Progress)</span>
                    </button>
                  )}

                  {caseData.status === 'In Progress' && (
                    <button
                      onClick={() => handleStatusTransition('Submitted', 'Agent submitted evidence documents')}
                      disabled={actionLoading}
                      className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>Submit Case for Review</span>
                    </button>
                  )}

                  {['Submitted', 'Cleared', 'Discrepant'].includes(caseData.status) && (
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-center text-xs font-semibold text-slate-400">
                      Case Submitted / Under Manager Review
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Milestone Timeline */}
          <CaseTimeline currentStatus={caseData.status} />
        </div>

        {/* Detailed Tabs (Documents, Comments, Audit Logs) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          {/* Tab Selection Headers */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'documents'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Supporting Files ({documents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'comments'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Investigation Notes ({comments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'audit'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail Log ({auditLogs.length})</span>
            </button>
          </div>

          {/* Tab Content Panes */}
          {activeTab === 'documents' && (
            <DocumentList
              caseId={caseData._id}
              documents={documents}
              onDocumentUploaded={fetchCaseDetails}
              canUpload={canUploadOrEdit && caseData.status !== 'Cleared' && caseData.status !== 'Discrepant'}
            />
          )}

          {activeTab === 'comments' && (
            <CommentStream
              caseId={caseData._id}
              comments={comments}
              onCommentAdded={fetchCaseDetails}
            />
          )}

          {activeTab === 'audit' && <AuditLogList logs={auditLogs} />}
        </div>
      </main>
    </div>
  );
}
