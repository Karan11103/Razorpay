import React, { useState, useEffect } from 'react';
import { Download, Search, ChevronLeft, ChevronRight, Filter, Clock } from 'lucide-react';
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
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-950/60 text-blue-400 border border-blue-800/40">
            system
          </span>
        );
      case 'human':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-950/60 text-amber-400 border border-amber-800/40">
            human
          </span>
        );
      case 'llm':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            llm
          </span>
        );
      default:
        return <span className="text-slate-400 text-xs font-mono">{actor}</span>;
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
    <div className="bg-[#0F1626] rounded-lg border border-slate-800 shadow-sm overflow-hidden">
      
      {/* Top Header & Export */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-white tracking-tight">Compliance Audit Trail</h3>
            <span className="text-xs text-slate-400 font-mono">({totalRecords} immutable entries)</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only financial record of reconciliation events, state transitions, and actor decisions
          </p>
        </div>

        <a
          href={getAuditExportUrl()}
          download="ghost_detector_audit_trail.csv"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export CSV</span>
        </a>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="p-3 bg-slate-900/50 border-b border-slate-800 flex flex-wrap items-center gap-2.5">
        
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={orderIdSearch}
            onChange={(e) => setOrderIdSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#090D16] border border-slate-700 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={actorFilter}
            onChange={(e) => {
              setActorFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#090D16] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="">All Actors</option>
            <option value="system">System (Gate/Poller)</option>
            <option value="human">Human (Merchant Ops)</option>
            <option value="llm">LLM (Advisory)</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-3.5 py-1.5 rounded bg-[#0C66E4] hover:bg-[#0052CC] text-white font-medium text-xs transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#090D16] text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Timestamp (UTC)</th>
              <th className="py-2.5 px-4 font-semibold">Actor</th>
              <th className="py-2.5 px-4 font-semibold">Action</th>
              <th className="py-2.5 px-4 font-semibold">Order Reference</th>
              <th className="py-2.5 px-4 font-semibold text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500">
                  {isLoading ? 'Loading records...' : 'No audit entries found matching criteria.'}
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
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 font-semibold">
                        {log.order_id || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="text-[11px] font-mono text-blue-400 hover:text-blue-300"
                        >
                          {isExpanded ? 'Collapse' : 'Inspect Payload'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#090D16]">
                        <td colSpan="5" className="p-4">
                          <pre className="text-[11px] font-mono bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 overflow-x-auto max-h-48">
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
      <div className="p-3 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between text-xs text-slate-400">
        <div>
          Page <span className="font-semibold text-white">{page}</span> of{' '}
          <span className="font-semibold text-white">{totalPages}</span>
        </div>
        <div className="flex items-center space-x-1.5">
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
