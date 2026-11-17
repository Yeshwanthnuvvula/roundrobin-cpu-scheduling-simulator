import { useState, useMemo } from 'react';
import {
  List,
  Search,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Cpu,
  CheckCircle2,
  Clock3,
  Filter,
  Play,
  RotateCcw,
  ArrowUpRight,
  Layers3,
  Activity,
  SlidersHorizontal,
} from 'lucide-react';

import { useSimulation } from '../context/useSimulation.js';
import './Processes.css';

export default function Processes({ setActivePage }) {
  const { simulationResult } = useSimulation();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [sortField, setSortField] = useState('pid');
  const [sortDirection, setSortDirection] = useState('asc');

  const processes = useMemo(() => {
    return simulationResult?.processes ?? [];
  }, [simulationResult]);

  // Overall counts from actual simulation result
  const totalCount = processes.length;
  const completedCount = useMemo(() => {
    return processes.filter(
      (p) => p.state?.toUpperCase() === 'COMPLETED'
    ).length;
  }, [processes]);
  const incompleteCount = totalCount - completedCount;

  // Sorting and filtering logic
  const filteredAndSortedProcesses = useMemo(() => {
    if (!processes.length) return [];

    let result = [...processes];

    // Search by PID
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) => p.pid.toLowerCase().includes(q));
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'COMPLETED') {
        result = result.filter(
          (p) => p.state?.toUpperCase() === 'COMPLETED'
        );
      } else if (statusFilter === 'INCOMPLETE') {
        result = result.filter(
          (p) => p.state?.toUpperCase() !== 'COMPLETED'
        );
      } else {
        result = result.filter(
          (p) => p.state?.toUpperCase() === statusFilter
        );
      }
    }

    // Filter by queue level
    if (queueFilter !== 'ALL') {
      const targetQueue = Number(queueFilter);
      result = result.filter((p) => p.queueLevel === targetQueue);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'pid') {
        comparison = a.pid.localeCompare(b.pid, undefined, { numeric: true });
      } else if (sortField === 'arrivalTime') {
        comparison = (a.arrivalTime ?? 0) - (b.arrivalTime ?? 0);
      } else if (sortField === 'burstTime') {
        comparison = (a.burstTime ?? 0) - (b.burstTime ?? 0);
      } else if (sortField === 'remainingTime') {
        comparison = (a.remainingTime ?? 0) - (b.remainingTime ?? 0);
      } else if (sortField === 'completionTime') {
        const valA = a.state?.toUpperCase() === 'COMPLETED' ? a.completionTime : -1;
        const valB = b.state?.toUpperCase() === 'COMPLETED' ? b.completionTime : -1;
        comparison = valA - valB;
      } else if (sortField === 'turnaroundTime') {
        const valA = a.state?.toUpperCase() === 'COMPLETED' ? a.turnaroundTime : -1;
        const valB = b.state?.toUpperCase() === 'COMPLETED' ? b.turnaroundTime : -1;
        comparison = valA - valB;
      } else if (sortField === 'waitingTime') {
        const valA = a.state?.toUpperCase() === 'COMPLETED' ? a.waitingTime : -1;
        const valB = b.state?.toUpperCase() === 'COMPLETED' ? b.waitingTime : -1;
        comparison = valA - valB;
      } else if (sortField === 'queueLevel') {
        comparison = (a.queueLevel ?? 0) - (b.queueLevel ?? 0);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [processes, searchQuery, statusFilter, queueFilter, sortField, sortDirection]);

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function handleResetFilters() {
    setSearchQuery('');
    setStatusFilter('ALL');
    setQueueFilter('ALL');
    setSortField('pid');
    setSortDirection('asc');
  }

  const isFiltered =
    searchQuery.trim() !== '' ||
    statusFilter !== 'ALL' ||
    queueFilter !== 'ALL' ||
    sortField !== 'pid' ||
    sortDirection !== 'asc';

  // Empty state when no simulation has been run
  if (!simulationResult) {
    return (
      <div className="processes-page">
        <section className="welcome-section">
          <div>
            <div className="eyebrow">CPU SCHEDULING SIMULATOR</div>
            <h1>Process management</h1>
            <p>
              Inspect individual process arrival times, burst requirements, execution timelines, and MLFQ queue states.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => setActivePage && setActivePage('Simulator')}
          >
            <Play size={16} fill="currentColor" />
            Open Simulator
            <ArrowUpRight size={15} />
          </button>
        </section>

        <section className="processes-empty-panel">
          <div className="processes-empty-content">
            <div className="processes-empty-icon">
              <List size={30} />
            </div>
            <h3>No process data available</h3>
            <p>
              Run a simulation in the workspace to generate processes and review their detailed lifecycle states, execution metrics, and priority queues.
            </p>
            <button
              className="primary-button"
              onClick={() => setActivePage && setActivePage('Simulator')}
            >
              <Play size={16} fill="currentColor" />
              Go to Simulator
            </button>
          </div>

          <div className="processes-empty-guide">
            <div className="guide-card">
              <Layers3 size={18} />
              <div>
                <strong>Multilevel Queue Tracking</strong>
                <span>Inspect process progression across Q0, Q1, and Q2</span>
              </div>
            </div>
            <div className="guide-card">
              <Clock3 size={18} />
              <div>
                <strong>Timing Diagnostics</strong>
                <span>Verify arrival, burst, completion, TAT, and WT</span>
              </div>
            </div>
            <div className="guide-card">
              <Activity size={18} />
              <div>
                <strong>Search & Filters</strong>
                <span>Easily locate processes by PID, state, or queue level</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="processes-page">
      <section className="welcome-section">
        <div>
          <div className="eyebrow">CPU SCHEDULING SIMULATOR</div>
          <h1>Process management</h1>
          <p>
            Detailed analysis and inspection of all scheduled processes from the latest simulation run.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setActivePage && setActivePage('Simulator')}
        >
          <Play size={16} fill="currentColor" />
          Run New Simulation
          <ArrowUpRight size={15} />
        </button>
      </section>

      {/* SUMMARY STAT CARDS */}
      <section className="processes-stats-grid">
        <div className="processes-stat-card">
          <div className="processes-stat-top">
            <span>Total processes</span>
            <Cpu size={17} />
          </div>
          <div className="processes-stat-value">{totalCount}</div>
          <div className="processes-stat-detail">Generated in simulation</div>
        </div>

        <div className="processes-stat-card">
          <div className="processes-stat-top">
            <span>Completed processes</span>
            <CheckCircle2 size={17} />
          </div>
          <div className="processes-stat-value">{completedCount}</div>
          <div className="processes-stat-detail">Finished before cutoff</div>
        </div>

        <div className="processes-stat-card">
          <div className="processes-stat-top">
            <span>Incomplete processes</span>
            <Clock3 size={17} />
          </div>
          <div className="processes-stat-value">{incompleteCount}</div>
          <div className="processes-stat-detail">Unfinished at cutoff</div>
        </div>

        <div className="processes-stat-card">
          <div className="processes-stat-top">
            <span>Filtered processes</span>
            <Filter size={17} />
          </div>
          <div className="processes-stat-value">
            {filteredAndSortedProcesses.length}
          </div>
          <div className="processes-stat-detail">
            Showing {filteredAndSortedProcesses.length} of {totalCount}
          </div>
        </div>
      </section>

      {/* TOOLBAR: SEARCH & FILTERS */}
      <section className="processes-toolbar">
        <div className="processes-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="processes-search-input"
            placeholder="Search by PID (e.g. P1, P2)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="processes-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="processes-filters">
          {/* Status filter */}
          <div className="processes-select-wrapper">
            <select
              className="processes-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              title="Filter by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="INCOMPLETE">Incomplete</option>
              <option value="READY">Ready</option>
              <option value="RUNNING">Running</option>
            </select>
            <ChevronDown size={14} />
          </div>

          {/* Queue filter */}
          <div className="processes-select-wrapper">
            <select
              className="processes-select"
              value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value)}
              title="Filter by queue level"
            >
              <option value="ALL">All Queues</option>
              <option value="0">Queue 0 (Q0)</option>
              <option value="1">Queue 1 (Q1)</option>
              <option value="2">Queue 2 (Q2)</option>
            </select>
            <ChevronDown size={14} />
          </div>

          {/* Sort selector */}
          <div className="processes-select-wrapper">
            <select
              className="processes-select"
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [f, d] = e.target.value.split('-');
                setSortField(f);
                setSortDirection(d);
              }}
              title="Sort processes"
            >
              <option value="pid-asc">Sort: PID (P1 → P10)</option>
              <option value="pid-desc">Sort: PID (P10 → P1)</option>
              <option value="arrivalTime-asc">Sort: Arrival Time (Low → High)</option>
              <option value="arrivalTime-desc">Sort: Arrival Time (High → Low)</option>
              <option value="burstTime-asc">Sort: Burst Time (Low → High)</option>
              <option value="burstTime-desc">Sort: Burst Time (High → Low)</option>
              <option value="completionTime-asc">Sort: Completion Time (Low → High)</option>
              <option value="completionTime-desc">Sort: Completion Time (High → Low)</option>
            </select>
            <SlidersHorizontal size={14} />
          </div>

          {isFiltered && (
            <button
              className="processes-reset-filters"
              onClick={handleResetFilters}
              title="Reset all filters and sorting"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>
      </section>

      {/* PROCESSES TABLE PANEL */}
      <section className="processes-table-panel">
        <div className="processes-table-heading">
          <div>
            <h2>Process execution details</h2>
            <p>Click column headers to sort by individual timing attributes</p>
          </div>
          <span className="processes-table-count">
            {filteredAndSortedProcesses.length} / {totalCount} PROCESSES
          </span>
        </div>

        <div className="processes-table-wrapper">
          {filteredAndSortedProcesses.length > 0 ? (
            <table className="processes-table">
              <thead>
                <tr>
                  <th
                    className="sortable"
                    onClick={() => handleSort('pid')}
                    title="Sort by Process ID"
                  >
                    <span className="th-content">
                      PID
                      {sortField === 'pid' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>

                  <th
                    className="sortable"
                    onClick={() => handleSort('arrivalTime')}
                    title="Sort by Arrival Time"
                  >
                    <span className="th-content">
                      Arrival Time (AT)
                      {sortField === 'arrivalTime' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>

                  <th
                    className="sortable"
                    onClick={() => handleSort('burstTime')}
                    title="Sort by Burst Time"
                  >
                    <span className="th-content">
                      Burst Time (BT)
                      {sortField === 'burstTime' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>

                  <th
                    className="sortable"
                    onClick={() => handleSort('remainingTime')}
                    title="Sort by Remaining Time"
                  >
                    <span className="th-content">
                      Remaining Time
                      {sortField === 'remainingTime' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>

                  <th
                    className="sortable"
                    onClick={() => handleSort('completionTime')}
                    title="Sort by Completion Time"
                  >
                    <span className="th-content">
                      Completion Time (CT)
                      {sortField === 'completionTime' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>

                  <th
                    className="sortable"
                    onClick={() => handleSort('turnaroundTime')}
                    title="Sort by Turnaround Time"
                  >
                    <span className="th-content">
                      Turnaround Time (TAT)
                      {sortField === 'turnaroundTime' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>

                  <th
                    className="sortable"
                    onClick={() => handleSort('waitingTime')}
                    title="Sort by Waiting Time"
                  >
                    <span className="th-content">
                      Waiting Time (WT)
                      {sortField === 'waitingTime' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>

                  <th
                    className="sortable"
                    onClick={() => handleSort('queueLevel')}
                    title="Sort by Queue Level"
                  >
                    <span className="th-content">
                      Queue Level
                      {sortField === 'queueLevel' ? (
                        sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ArrowUpDown size={12} opacity={0.4} />
                      )}
                    </span>
                  </th>

                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredAndSortedProcesses.map((process) => {
                  const isCompleted = process.state?.toUpperCase() === 'COMPLETED';
                  const isRunning = process.state?.toUpperCase() === 'RUNNING';
                  const isReady = process.state?.toUpperCase() === 'READY';

                  // Determine display status label and badge class
                  let statusLabel = 'INCOMPLETE';
                  let statusClass = 'status-incomplete';

                  if (isCompleted) {
                    statusLabel = 'COMPLETED';
                    statusClass = 'status-completed';
                  } else if (isRunning) {
                    statusLabel = 'RUNNING';
                    statusClass = 'status-running';
                  } else if (isReady) {
                    statusLabel = 'READY';
                    statusClass = 'status-ready';
                  }

                  const queueClass = `q${process.queueLevel ?? 0}`;

                  return (
                    <tr key={process.pid}>
                      <td className="cell-pid">{process.pid}</td>
                      <td>{process.arrivalTime}</td>
                      <td>{process.burstTime}</td>
                      <td>{process.remainingTime}</td>
                      <td>
                        {isCompleted ? (
                          process.completionTime
                        ) : (
                          <span className="metric-na">—</span>
                        )}
                      </td>
                      <td>
                        {isCompleted ? (
                          process.turnaroundTime
                        ) : (
                          <span className="metric-na">—</span>
                        )}
                      </td>
                      <td>
                        {isCompleted ? (
                          process.waitingTime
                        ) : (
                          <span className="metric-na">—</span>
                        )}
                      </td>
                      <td>
                        {process.state === 'NEW' ? (
                          <span className="metric-na">—</span>
                        ) : (
                          <span className={`queue-badge ${queueClass}`}>
                            Q{process.queueLevel ?? 0}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="processes-empty-filter">
              <p>No processes match the current search query or filter criteria.</p>
              <button
                className="processes-reset-filters"
                onClick={handleResetFilters}
              >
                <RotateCcw size={13} />
                Reset filters
              </button>
            </div>
          )}
        </div>

        <p className="sim-note">
          Formulas: Turnaround Time (TAT) = CT – AT, Waiting Time (WT) = TAT – BT. Incomplete processes display CT, TAT, and WT as unavailable (—) rather than estimated values.
        </p>
      </section>
    </div>
  );
}
