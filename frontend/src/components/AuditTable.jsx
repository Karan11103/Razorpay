import React, { useState, useEffect } from 'react';
import { Download, Search, ChevronLeft, ChevronRight, Filter, Shield, User, Bot, Clock } from 'lucide-react';
import { fetchAuditLogs, getAuditExportUrl } from '../services/api';

export default function AuditTable() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(15);
  const [actorFilter, setActorFilter] = useState('');
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [actionSearch, setActionSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        page_size: pageSize
      };
      if (actorFilter) params.actor = actorFilter;
      if (orderIdSearch.trim()) params.order_id = orderIdSearch.trim();
      if (actionSearch.trim()) params.action = actionSearch.trim();

      const data = await fetchAuditLogs(params);
      setLogs(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotalRecords(data.total_records || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, actorFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const getActorBadge = (actor) => {
    switch (actor) {
      case 'system':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            <Shield className="w-3 h-3" />
            <span>system</span>
          </span>
        );
      case 'human':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <User className="w-3 h-3" />
            <span>human</span>
          </span>
        );
      case 'llm':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-950/80 text-blue-400 border border-blue-800/60">
            <Bot className="w-3 h-3" />
            <span>llm</span>
          </span>
        );
      default:
        return <span className="text-slate-400 text-xs">{actor}</span>;
    }
  };

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-[#0e1424] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
      
      {/* Top Header & Export */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/40">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-white">Append-Only Audit Trail</h2>
            <span className="text-xs text-slate-400 font-mono">({totalRecords} total events)</span>
          </div>
          <p className="text-xs text-slate-400">
            Immutable, cryptographically ordered record of all reconciliation state transitions and actions
          </p>
        </div>

        <a
          href={getAuditExportUrl()}
          download="ghost_detector_audit_trail.csv"
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export CSV</span>
        </a>
      </div>

      {/* Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="p-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center gap-3">
        
        {/* Search Order ID */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order ID (e.g. order_)..."
            value={orderIdSearch}
            onChange={(e) => setOrderIdSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Actor Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={actorFilter}
            onChange={(e) => {
              setActorFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Actors</option>
            <option value="system">system (gate/poller)</option>
            <option value="human">human (ops)</option>
            <option value="llm">llm (explainer)</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs transition-colors"
        >
          Search
        </button>
      </form>

      {/* Audit Log Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Timestamp (UTC)</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500">
                  {isLoading ? 'Loading audit records...' : 'No audit records match the selected filters.'}
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedId === log.id;
                let parsedDetail = null;
                try {
                  parsedDetail = JSON.parse(log.detail_json);
                } catch {
                  parsedDetail = log.detail_json;
                }

                return (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatTime(log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{getActorBadge(log.actor)}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-400 font-semibold">
                        {log.order_id || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline"
                        >
                          {isExpanded ? 'Collapse' : 'Inspect JSON'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-950/80">
                        <td colSpan="5" className="p-4">
                          <pre className="text-[11px] font-mono bg-slate-900 p-3 rounded-lg border border-slate-800 text-slate-300 overflow-x-auto max-h-48">
                            {JSON.stringify(parsedDetail, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing page <span className="font-bold text-white">{page}</span> of{' '}
          <span className="font-bold text-white">{totalPages}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
