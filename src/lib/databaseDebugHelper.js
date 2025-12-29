/**
 * Database Debugging Helper
 * Provides detailed logging for all database operations
 * Helps identify issues with updates, mutations, and data inconsistencies
 */

import { supabase } from './customSupabaseClient';

const DEBUG_MODE = import.meta.env.DEV; // Only enable in development
const LOG_STORAGE_KEY = 'db_debug_logs';
const MAX_STORED_LOGS = 100;

// Store logs in memory and localStorage
let debugLogs = [];

/**
 * Log a database operation with full details
 */
export function logDatabaseOperation(operation) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    table: operation.table,
    method: operation.method, // select, insert, update, delete, upsert
    id: operation.id,
    payloadSent: operation.payloadSent,
    payloadReceived: operation.payloadReceived,
    error: operation.error,
    duration: operation.duration, // milliseconds
    status: operation.error ? 'failed' : 'success',
    context: operation.context // where the operation came from
  };

  debugLogs.push(logEntry);

  // Keep only recent logs in memory
  if (debugLogs.length > MAX_STORED_LOGS) {
    debugLogs = debugLogs.slice(-MAX_STORED_LOGS);
  }

  // Log to console in development
  if (DEBUG_MODE) {
    console.group(`🗄️  [${logEntry.method.toUpperCase()}] ${logEntry.table}`);
    console.log('Status:', logEntry.status);
    console.log('Timestamp:', logEntry.timestamp);
    if (logEntry.payloadSent) {
      console.log('Payload Sent:', logEntry.payloadSent);
    }
    if (logEntry.payloadReceived) {
      console.log('Payload Received:', logEntry.payloadReceived);
    }
    if (logEntry.error) {
      console.error('Error:', logEntry.error);
    }
    if (logEntry.duration) {
      console.log(`Duration: ${logEntry.duration}ms`);
    }
    if (logEntry.context) {
      console.log('Context:', logEntry.context);
    }
    console.groupEnd();
  }

  return logEntry;
}

/**
 * Wrapper for Supabase SELECT operations
 */
export async function debugSelect(table, options = {}) {
  const startTime = performance.now();
  const context = options.context || 'select-operation';

  try {
    let query = supabase.from(table).select(options.select || '*');

    // Apply filters if provided
    if (options.filters) {
      for (const [column, value, operator = 'eq'] of options.filters) {
        query = query[operator](column, value);
      }
    }

    // Apply ordering if provided
    if (options.orderBy) {
      const [column, ascending = false] = options.orderBy;
      query = query.order(column, { ascending });
    }

    // Apply limits if provided
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    const duration = performance.now() - startTime;

    logDatabaseOperation({
      table,
      method: 'select',
      payloadReceived: { count: data?.length || 0, data: DEBUG_MODE ? data : undefined },
      error: error?.message,
      duration,
      context
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`[DEBUG SELECT] Error in ${table}:`, error);
    throw error;
  }
}

/**
 * Wrapper for Supabase UPDATE operations
 * Provides before/after comparison
 */
export async function debugUpdate(table, id, updates, options = {}) {
  const startTime = performance.now();
  const context = options.context || `update-${table}-${id}`;
  const idField = options.idField || 'id';

  try {
    // Fetch current data before update
    let currentData = null;
    try {
      const { data } = await supabase
        .from(table)
        .select('*')
        .eq(idField, id)
        .single();
      currentData = data;
    } catch (e) {
      console.warn(`[DEBUG] Could not fetch current data for comparison: ${e.message}`);
    }

    // Sanitize payload
    const sanitizedUpdates = sanitizePayload(updates);

    // Perform the update
    const { data, error } = await supabase
      .from(table)
      .update(sanitizedUpdates)
      .eq(idField, id)
      .select()
      .single();

    const duration = performance.now() - startTime;

    // Create comparison object
    const comparison = currentData ? createComparison(currentData, sanitizedUpdates, data) : null;

    logDatabaseOperation({
      table,
      method: 'update',
      id,
      payloadSent: sanitizedUpdates,
      payloadReceived: data,
      error: error?.message,
      duration,
      context,
      comparison // Show what changed
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`[DEBUG UPDATE] Error updating ${table}:`, error);
    throw error;
  }
}

/**
 * Wrapper for Supabase INSERT operations
 */
export async function debugInsert(table, data, options = {}) {
  const startTime = performance.now();
  const context = options.context || `insert-${table}`;

  try {
    const sanitizedData = sanitizePayload(data);

    const { data: result, error } = await supabase
      .from(table)
      .insert([sanitizedData])
      .select()
      .single();

    const duration = performance.now() - startTime;

    logDatabaseOperation({
      table,
      method: 'insert',
      id: result?.id,
      payloadSent: sanitizedData,
      payloadReceived: result,
      error: error?.message,
      duration,
      context
    });

    if (error) throw error;
    return result;
  } catch (error) {
    console.error(`[DEBUG INSERT] Error inserting into ${table}:`, error);
    throw error;
  }
}

/**
 * Wrapper for Supabase DELETE operations
 */
export async function debugDelete(table, id, options = {}) {
  const startTime = performance.now();
  const context = options.context || `delete-${table}-${id}`;
  const idField = options.idField || 'id';

  try {
    // Fetch current data before delete (for reference)
    let currentData = null;
    try {
      const { data } = await supabase
        .from(table)
        .select('*')
        .eq(idField, id)
        .single();
      currentData = data;
    } catch (e) {
      console.warn(`[DEBUG] Could not fetch data before delete: ${e.message}`);
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq(idField, id);

    const duration = performance.now() - startTime;

    logDatabaseOperation({
      table,
      method: 'delete',
      id,
      payloadReceived: currentData ? { deleted: currentData } : { deleted: true },
      error: error?.message,
      duration,
      context
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error(`[DEBUG DELETE] Error deleting from ${table}:`, error);
    throw error;
  }
}

/**
 * Sanitize payload by removing undefined/null values
 */
function sanitizePayload(data) {
  if (!data || typeof data !== 'object') return data;

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      console.warn(`⚠️  Field "${key}" is undefined - skipping`);
      continue;
    }
    if (value === null) {
      console.warn(`⚠️  Field "${key}" is null`);
    }
    if (typeof value === 'string' && value.includes('undefined')) {
      console.warn(`⚠️  Field "${key}" contains string 'undefined': "${value}"`);
    }
    sanitized[key] = value;
  }
  return sanitized;
}

/**
 * Create a comparison object showing before/after values
 */
function createComparison(before, updates, after) {
  const changes = {};

  for (const [key, newValue] of Object.entries(updates)) {
    const oldValue = before[key];
    if (oldValue !== newValue) {
      changes[key] = {
        before: oldValue,
        after: newValue,
        changed: true
      };
    } else {
      changes[key] = {
        before: oldValue,
        after: newValue,
        changed: false
      };
    }
  }

  return changes;
}

/**
 * Get all stored debug logs
 */
export function getDebugLogs(filter = {}) {
  let filtered = [...debugLogs];

  if (filter.table) {
    filtered = filtered.filter(log => log.table === filter.table);
  }
  if (filter.method) {
    filtered = filtered.filter(log => log.method === filter.method);
  }
  if (filter.status) {
    filtered = filtered.filter(log => log.status === filter.status);
  }
  if (filter.since) {
    const sinceDate = new Date(filter.since);
    filtered = filtered.filter(log => new Date(log.timestamp) > sinceDate);
  }

  return filtered;
}

/**
 * Clear all debug logs
 */
export function clearDebugLogs() {
  debugLogs = [];
  console.log('✅ Debug logs cleared');
}

/**
 * Export logs as JSON for analysis
 */
export function exportDebugLogs() {
  return JSON.stringify(debugLogs, null, 2);
}

/**
 * Analyze logs and report potential issues
 */
export function analyzeDebugLogs() {
  const analysis = {
    totalOperations: debugLogs.length,
    byMethod: {},
    byTable: {},
    errors: [],
    slowOperations: [],
    payloadIssues: []
  };

  for (const log of debugLogs) {
    // Count by method
    if (!analysis.byMethod[log.method]) {
      analysis.byMethod[log.method] = { success: 0, failed: 0 };
    }
    if (log.status === 'success') {
      analysis.byMethod[log.method].success++;
    } else {
      analysis.byMethod[log.method].failed++;
    }

    // Count by table
    if (!analysis.byTable[log.table]) {
      analysis.byTable[log.table] = { count: 0, errors: 0 };
    }
    analysis.byTable[log.table].count++;
    if (log.error) {
      analysis.byTable[log.table].errors++;
    }

    // Collect errors
    if (log.error) {
      analysis.errors.push({
        timestamp: log.timestamp,
        table: log.table,
        method: log.method,
        error: log.error,
        id: log.id
      });
    }

    // Find slow operations (over 1000ms)
    if (log.duration && log.duration > 1000) {
      analysis.slowOperations.push({
        timestamp: log.timestamp,
        table: log.table,
        method: log.method,
        duration: log.duration
      });
    }

    // Check for payload issues
    if (log.payloadSent) {
      const payloadStr = JSON.stringify(log.payloadSent);
      if (payloadStr.includes('undefined')) {
        analysis.payloadIssues.push({
          timestamp: log.timestamp,
          table: log.table,
          issue: 'Payload contains "undefined"',
          payload: log.payloadSent
        });
      }
    }
  }

  return analysis;
}

/**
 * Print a formatted summary of debug logs
 */
export function printDebugSummary() {
  const analysis = analyzeDebugLogs();

  console.log('\n' + '='.repeat(60));
  console.log('📊 DATABASE DEBUG SUMMARY');
  console.log('='.repeat(60));

  console.log(`\n📈 Total Operations: ${analysis.totalOperations}`);

  console.log('\n📋 By Method:');
  for (const [method, counts] of Object.entries(analysis.byMethod)) {
    console.log(
      `  ${method.toUpperCase()}: ${counts.success} success, ${counts.failed} failed`
    );
  }

  console.log('\n📦 By Table:');
  for (const [table, info] of Object.entries(analysis.byTable)) {
    const successRate = Math.round(((info.count - info.errors) / info.count) * 100);
    console.log(`  ${table}: ${info.count} operations, ${successRate}% success rate`);
  }

  if (analysis.errors.length > 0) {
    console.log(`\n❌ Errors (${analysis.errors.length}):`);
    for (const error of analysis.errors.slice(-5)) {
      console.log(`  [${error.timestamp}] ${error.table}.${error.method}: ${error.error}`);
    }
  }

  if (analysis.slowOperations.length > 0) {
    console.log(`\n🐢 Slow Operations (${analysis.slowOperations.length}):`);
    for (const op of analysis.slowOperations.slice(-5)) {
      console.log(`  [${op.timestamp}] ${op.table}.${op.method}: ${op.duration}ms`);
    }
  }

  if (analysis.payloadIssues.length > 0) {
    console.log(`\n⚠️  Payload Issues (${analysis.payloadIssues.length}):`);
    for (const issue of analysis.payloadIssues.slice(-5)) {
      console.log(`  [${issue.timestamp}] ${issue.table}: ${issue.issue}`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');
}
