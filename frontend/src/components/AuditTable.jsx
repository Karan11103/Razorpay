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
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#101726] text-blue-400 border border-[#1E283D]">
            system
          </span>
        );
      case 'human':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1A1408] text-amber-400 border border-amber-900/50">
            human
          </span>
        );
      case 'llm':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#121620] text-slate-300 border border-[#1E2538]">
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
    <div className="bg-[#0D111A] rounded-lg border border-[#182030] overflow-hidden">
      
      {/* Top Header & Export */}
      <div className="p-4 border-b border-[#182030] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-semibold text-[#FBF7EE] tracking-tight">Compliance Audit Trail</h3>
            <span className="text-xs text-slate-500 font-mono">({totalRecords} entries)</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable, append-only financial audit trail for compliance verification
          </p>
        </div>

        <a
          href={getAuditExportUrl()}
          download="ghost_detector_audit_trail.csv"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#FBF7EE] text-[#07090E] hover:bg-[#E5DFD1] transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </a>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="p-3 bg-[#07090E] border-b border-[#182030] flex flex-wrap items-center gap-2.5">
        
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={orderIdSearch}
            onChange={(e) => setOrderIdSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#0D111A] border border-[#182030] rounded text-xs text-[#FBF7EE] placeholder-slate-500 focus:outline-none focus:border-slate-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={actorFilter}
            onChange={(e) => {
              setActorFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#0D111A] border border-[#182030] rounded px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-slate-500 font-mono"
          >
            <option value="">All Actors</option>
            <option value="system">System (Gate/Poller)</option>
            <option value="human">Human (Merchant Ops)</option>
            <option value="llm">LLM (Advisory)</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-3.5 py-1.5 rounded bg-[#182030] hover:bg-[#222D42] text-slate-200 font-medium text-xs transition-colors"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#07090E] text-slate-400 uppercase font-mono text-[10px] border-b border-[#182030]">
            <tr>
              <th className="py-2.5 px-4 font-semibold">Timestamp (UTC)</th>
              <th className="py-2.5 px-4 font-semibold">Actor</th>
              <th className="py-2.5 px-4 font-semibold">Action</th>
              <th className="py-2.5 px-4 font-semibold">Order Reference</th>
              <th className="py-2.5 px-4 font-semibold text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#182030] text-slate-300">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-500 font-mono">
                  {isLoading ? '/ Loading records...' : '/ No audit entries found matching criteria.'}
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
                    <tr className="hover:bg-[#0E1420] transition-colors">
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
                      <td className="py-3 px-4 font-mono text-[#FBF7EE] font-semibold">
                        {log.order_id || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="text-[11px] font-mono text-slate-400 hover:text-[#FBF7EE]"
                        >
                          {isExpanded ? 'Collapse' : 'Inspect Payload'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#07090E]">
                        <td colSpan="5" className="p-4">
                          <pre className="text-[11px] font-mono bg-[#0D111A] p-3 rounded border border-[#182030] text-slate-300 overflow-x-auto max-h-48">
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

      {/* Pagination */}
      <div className="p-3 border-t border-[#182030] bg-[#07090E] flex items-center justify-between text-xs text-slate-400">
        <div className="font-mono text-[11px]">
          Page <span className="font-semibold text-[#FBF7EE]">{page}</span> of{' '}
          <span className="font-semibold text-[#FBF7EE]">{totalPages}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="p-1.5 rounded bg-[#0D111A] hover:bg-[#182030] border border-[#182030] disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isLoading}
            className="p-1.5 rounded bg-[#0D111A] hover:bg-[#182030] border border-[#182030] disabled:opacity-40 disabled:cursor-not-allowed text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
