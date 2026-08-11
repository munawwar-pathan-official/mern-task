import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import CreateCaseModal from '../components/CreateCaseModal';
import {
  Search,
  Plus,
  Filter,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  FileCheck,
  Clock,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import api from '../services/api';

export default function CaseListPage() {
  const { user, isManager } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalCases, setTotalCases] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('');
  const [agents, setAgents] = useState([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 8,
        search,
        status: statusFilter,
        agent: agentFilter,
      };
      const res = await api.get('/cases', { params });
      setCases(res.data.cases);
      setPages(res.data.pages);
      setTotalCases(res.data.totalCases);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, agentFilter]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  useEffect(() => {
    if (isManager()) {
      const fetchAgents = async () => {
        try {
          const res = await api.get('/auth/agents');
          setAgents(res.data);
        } catch (err) {
          console.error('Failed to load agents:', err);
        }
      };
      fetchAgents();
    }
  }, [isManager]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleAgentFilterChange = (e) => {
    setAgentFilter(e.target.value);
    setPage(1);
  };

  // Metrics summary count calculations (for visible dashboard summary)
  const submittedCount = cases.filter((c) => c.status === 'Submitted').length;
  const inProgressCount = cases.filter((c) => c.status === 'In Progress').length;
  const clearedCount = cases.filter((c) => c.status === 'Cleared').length;
  const discrepantCount = cases.filter((c) => c.status === 'Discrepant').length;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">
              <span>Overview & Cases</span>
              <span>•</span>
              <span className="text-slate-400">
                {isManager() ? 'Manager Operations' : 'Assigned Agent Workspace'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Case Workflow Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {isManager()
                ? 'Create cases, assign agents, and review submitted verification reports'
                : 'Manage your assigned cases, upload evidence documents, and submit notes'}
            </p>
          </div>

          {isManager() && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Case</span>
            </button>
          )}
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Listed
              </p>
              <p className="text-xl font-black text-white">{totalCases}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                In Progress
              </p>
              <p className="text-xl font-black text-white">{inProgressCount}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pending Review
              </p>
              <p className="text-xl font-black text-white">{submittedCount}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Cleared / Discrepant
              </p>
              <p className="text-xl font-black text-white">
                {clearedCount} <span className="text-slate-500 font-normal text-xs">/</span>{' '}
                <span className="text-rose-400">{discrepantCount}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xl">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search client, subject, case type..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-slate-900 text-white">All Statuses</option>
                <option value="New" className="bg-slate-900 text-white">New</option>
                <option value="Assigned" className="bg-slate-900 text-white">Assigned</option>
                <option value="In Progress" className="bg-slate-900 text-white">In Progress</option>
                <option value="Submitted" className="bg-slate-900 text-white">Submitted</option>
                <option value="Cleared" className="bg-slate-900 text-white">Cleared</option>
                <option value="Discrepant" className="bg-slate-900 text-white">Discrepant</option>
              </select>
            </div>

            {/* Agent Filter (Manager view) */}
            {isManager() && (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-400">Agent:</span>
                <select
                  value={agentFilter}
                  onChange={handleAgentFilterChange}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="" className="bg-slate-900 text-white">All Agents</option>
                  {agents.map((ag) => (
                    <option key={ag._id} value={ag._id} className="bg-slate-900 text-white">
                      {ag.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Cases Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs font-semibold">Loading cases database...</span>
            </div>
          ) : cases.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <FolderKanban className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No cases match your filters</p>
              <p className="text-xs text-slate-600 mt-1">
                Try clearing search terms or status filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Client / Case Type</th>
                    <th className="py-3.5 px-5">Subject Name</th>
                    <th className="py-3.5 px-5">Assigned Agent</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Due Date</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {cases.map((c) => {
                    const formattedDueDate = new Date(c.dueDate).toLocaleDateString(undefined, {
                      dateStyle: 'medium',
                    });
                    const isOverdue =
                      new Date(c.dueDate) < new Date() && !['Cleared', 'Discrepant'].includes(c.status);

                    return (
                      <tr
                        key={c._id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        <td className="py-4 px-5">
                          <div className="font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                            {c.clientName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{c.caseType}</div>
                        </td>
                        <td className="py-4 px-5 font-semibold text-slate-300">
                          {c.subjectName}
                        </td>
                        <td className="py-4 px-5">
                          {c.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-[10px]">
                                {c.assignedTo.name[0]}
                              </div>
                              <span className="text-slate-300 font-medium">
                                {c.assignedTo.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-5">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-4 px-5 font-mono text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span className={isOverdue ? 'text-rose-400 font-bold' : ''}>
                              {formattedDueDate}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <Link
                            to={`/cases/${c._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-lg text-xs font-semibold transition-all"
                          >
                            <span>View Case</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {pages > 1 && (
            <div className="bg-slate-900/80 border-t border-slate-800 px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Page <span className="font-bold text-white">{page}</span> of{' '}
                <span className="font-bold text-white">{pages}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(p + 1, pages))}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <CreateCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCaseCreated={fetchCases}
      />
    </div>
  );
}
