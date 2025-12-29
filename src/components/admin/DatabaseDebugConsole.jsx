import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  getDebugLogs, 
  clearDebugLogs, 
  exportDebugLogs, 
  analyzeDebugLogs,
  printDebugSummary 
} from '@/lib/databaseDebugHelper';
import { ChevronDown, ChevronUp, Download, Trash2, AlertCircle, CheckCircle } from 'lucide-react';

const DatabaseDebugConsole = ({ maxLogs = 50 }) => {
  const [logs, setLogs] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const refreshLogs = () => {
      setLogs(getDebugLogs());
    };

    refreshLogs();
    const interval = autoRefresh ? setInterval(refreshLogs, 1000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const filteredLogs = logs
    .filter(log => {
      if (filter === 'all') return true;
      if (filter === 'errors') return log.status === 'failed';
      if (filter === 'success') return log.status === 'success';
      return log.method === filter;
    })
    .slice(-maxLogs);

  const toggleExpanded = (id) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExport = () => {
    const data = exportDebugLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `db-debug-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleClear = () => {
    if (confirm('Clear all debug logs?')) {
      clearDebugLogs();
      setLogs([]);
    }
  };

  const handleAnalyze = () => {
    const analysis = analyzeDebugLogs();
    console.group('📊 Database Debug Analysis');
    console.table(analysis);
    console.groupEnd();
    printDebugSummary();
  };

  const analysis = analyzeDebugLogs();
  const errorCount = analysis.errors.length;
  const successCount = filteredLogs.filter(log => log.status === 'success').length;

  return (
    <Card className="w-full bg-slate-900 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>🗄️  Database Debug Console</span>
            <span className="text-xs bg-slate-700 px-2 py-1 rounded">
              {logs.length} logs
            </span>
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`text-xs px-2 py-1 rounded ${
                autoRefresh
                  ? 'bg-green-900 text-green-200'
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {autoRefresh ? '● Live' : '○ Paused'}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-800 p-3 rounded">
            <div className="text-slate-400">Total</div>
            <div className="text-xl font-bold text-white">{logs.length}</div>
          </div>
          <div className="bg-green-900 p-3 rounded">
            <div className="text-green-300">Success</div>
            <div className="text-xl font-bold text-green-200">{successCount}</div>
          </div>
          <div className="bg-red-900 p-3 rounded">
            <div className="text-red-300">Errors</div>
            <div className="text-xl font-bold text-red-200">{errorCount}</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'success', 'errors', 'select', 'insert', 'update', 'delete'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleAnalyze}
            size="sm"
            className="text-xs bg-slate-700 hover:bg-slate-600"
          >
            📊 Analyze
          </Button>
          <Button
            onClick={handleExport}
            size="sm"
            className="text-xs bg-slate-700 hover:bg-slate-600"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button
            onClick={handleClear}
            size="sm"
            variant="destructive"
            className="text-xs ml-auto"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>

        {/* Logs List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-slate-400 py-4">No logs to display</div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div
                key={idx}
                className={`border rounded p-2 cursor-pointer transition-colors ${
                  log.status === 'failed'
                    ? 'bg-red-900 border-red-700 hover:bg-red-800'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                }`}
                onClick={() => toggleExpanded(idx)}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-1">
                    {expanded[idx] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      {log.status === 'failed' ? (
                        <AlertCircle className="w-3 h-3 text-red-400" />
                      ) : (
                        <CheckCircle className="w-3 h-3 text-green-400" />
                      )}
                      <span className="font-mono font-bold">
                        {log.method.toUpperCase()}
                      </span>
                      <span className="text-slate-400">{log.table}</span>
                      {log.id && <span className="text-slate-500 ml-auto">{log.id}</span>}
                    </div>
                    <div className="text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString()}
                      {log.duration && ` • ${log.duration}ms`}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded[idx] && (
                  <div className="mt-3 ml-6 space-y-2 border-t border-slate-600 pt-2 text-xs font-mono">
                    {log.payloadSent && (
                      <div>
                        <div className="text-slate-400 font-bold">Payload Sent:</div>
                        <pre className="bg-slate-900 p-2 rounded overflow-x-auto text-slate-300">
                          {JSON.stringify(log.payloadSent, null, 2)}
                        </pre>
                      </div>
                    )}

                    {log.payloadReceived && (
                      <div>
                        <div className="text-slate-400 font-bold">Payload Received:</div>
                        <pre className="bg-slate-900 p-2 rounded overflow-x-auto text-slate-300">
                          {typeof log.payloadReceived === 'object'
                            ? JSON.stringify(log.payloadReceived, null, 2)
                            : String(log.payloadReceived)}
                        </pre>
                      </div>
                    )}

                    {log.comparison && (
                      <div>
                        <div className="text-slate-400 font-bold">Changes:</div>
                        <pre className="bg-slate-900 p-2 rounded overflow-x-auto text-slate-300">
                          {JSON.stringify(log.comparison, null, 2)}
                        </pre>
                      </div>
                    )}

                    {log.error && (
                      <div>
                        <div className="text-red-400 font-bold">Error:</div>
                        <pre className="bg-slate-900 p-2 rounded overflow-x-auto text-red-300">
                          {log.error}
                        </pre>
                      </div>
                    )}

                    {log.context && (
                      <div className="text-slate-400">
                        <span className="font-bold">Context:</span> {log.context}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="text-xs text-slate-400 mt-4">
          💡 Tip: Click logs to expand, use filters to find specific operations, export for analysis
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseDebugConsole;
