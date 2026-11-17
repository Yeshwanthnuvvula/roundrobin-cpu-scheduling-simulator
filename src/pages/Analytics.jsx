import {
  BarChart3,
  Play,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  Cpu,
  Activity,
  ChevronDown,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useSimulation } from '../context/useSimulation.js';
import './Analytics.css';

/* ---- Colour palette ---- */
const COLORS = {
  q0: '#c1f36a',    // lime – Q0 / fixed
  q1: '#82bba3',    // sage – Q1 / WT bars
  q2: '#83aec7',    // blue – Q2 / random
  idle: '#3c463f',
  incomplete: '#ffaa46',
};

/* ---- Helpers ---- */
function fmt(val, decimals = 2) {
  return Number.isFinite(val) ? Number(val).toFixed(decimals) : '—';
}

/* ---- Custom recharts tooltip ---- */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="analytics-tooltip">
      {label !== undefined && (
        <div className="analytics-tooltip-label">{label}</div>
      )}
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: <strong>{fmt(entry.value)}</strong>
        </div>
      ))}
    </div>
  );
}

/* ---- Stat card ---- */
function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <div className="analytics-stat-card">
      <div className="analytics-stat-top">
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <div className="analytics-stat-value">{value}</div>
      {detail && <div className="analytics-stat-detail">{detail}</div>}
    </div>
  );
}

/* ---- Panel wrapper ---- */
function Panel({ title, subtitle, tag, children }) {
  return (
    <div className="analytics-panel">
      <div className="analytics-panel-heading">
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {tag && <span className="analytics-panel-tag">{tag}</span>}
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function Analytics({ setActivePage }) {
  const { simulationResult, fixedResult, randomResult } = useSimulation();

  /* ---- EMPTY STATE ---- */
  if (!simulationResult) {
    return (
      <div className="analytics-page">
        <div className="analytics-empty">
          <div className="analytics-empty-icon">
            <BarChart3 size={28} />
          </div>
          <h3>No analytics data available</h3>
          <p>
            Run a simulation first to view performance analytics, process
            comparisons, and CPU utilization charts.
          </p>
          <div className="analytics-empty-actions">
            <button
              className="analytics-btn-primary"
              onClick={() => setActivePage('Simulator')}
            >
              <Play size={15} fill="currentColor" />
              Open Simulator
              <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Derived values ---- */
  const {
    processes = [],
    completedCount = 0,
    incompleteCount = 0,
    totalProcesses = processes.length,
    averageWaitingTime,
    averageTurnaroundTime,
    cpuUtilization,
    totalSimulatedTime,
    currentTime,
    duration,
  } = simulationResult;

  const simDuration = totalSimulatedTime ?? currentTime ?? duration ?? 0;
  const throughput = simDuration > 0 ? completedCount / simDuration : 0;

  const completedProcesses = processes.filter(
    (p) => p.state?.toUpperCase() === 'COMPLETED'
  );

  /* ---- Pie chart data: completed vs incomplete ---- */
  const pieData = [
    { name: 'Completed', value: completedCount },
    { name: 'Incomplete', value: incompleteCount },
  ].filter((d) => d.value > 0);

  const pieColors = [COLORS.q0, COLORS.incomplete];

  /* ---- Per-process WT/TAT bar chart data ---- */
  const perProcessData = completedProcesses.map((p) => ({
    pid: p.pid,
    'Waiting Time': Number(p.waitingTime ?? 0),
    'Turnaround Time': Number(p.turnaroundTime ?? 0),
  }));

  /* ---- Fixed vs Random comparison ---- */
  const hasBothModes = fixedResult !== null && randomResult !== null;

  const comparisonMetrics = hasBothModes
    ? [
        {
          label: 'Avg Waiting Time',
          unit: 'units',
          fixed: fixedResult.averageWaitingTime,
          random: randomResult.averageWaitingTime,
        },
        {
          label: 'Avg Turnaround Time',
          unit: 'units',
          fixed: fixedResult.averageTurnaroundTime,
          random: randomResult.averageTurnaroundTime,
        },
        {
          label: 'CPU Utilization',
          unit: '%',
          fixed: fixedResult.cpuUtilization,
          random: randomResult.cpuUtilization,
        },
        {
          label: 'Throughput',
          unit: 'proc/unit',
          fixed:
            (fixedResult.totalSimulatedTime ?? fixedResult.currentTime ?? fixedResult.duration ?? 0) > 0
              ? fixedResult.completedCount /
                (fixedResult.totalSimulatedTime ?? fixedResult.currentTime ?? fixedResult.duration)
              : 0,
          random:
            (randomResult.totalSimulatedTime ?? randomResult.currentTime ?? randomResult.duration ?? 0) > 0
              ? randomResult.completedCount /
                (randomResult.totalSimulatedTime ?? randomResult.currentTime ?? randomResult.duration)
              : 0,
        },
        {
          label: 'Completed',
          unit: 'processes',
          fixed: fixedResult.completedCount,
          random: randomResult.completedCount,
        },
        {
          label: 'Incomplete',
          unit: 'processes',
          fixed: fixedResult.incompleteCount,
          random: randomResult.incompleteCount,
        },
      ]
    : [];

  const comparisonBarData = hasBothModes
    ? [
        {
          name: 'Avg WT',
          Fixed: Number(fmt(fixedResult.averageWaitingTime)),
          Random: Number(fmt(randomResult.averageWaitingTime)),
        },
        {
          name: 'Avg TAT',
          Fixed: Number(fmt(fixedResult.averageTurnaroundTime)),
          Random: Number(fmt(randomResult.averageTurnaroundTime)),
        },
        {
          name: 'CPU Util %',
          Fixed: Number(fmt(fixedResult.cpuUtilization)),
          Random: Number(fmt(randomResult.cpuUtilization)),
        },
      ]
    : [];

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="analytics-page">
      {/* HEADER */}
      <div className="analytics-header">
        <div className="analytics-eyebrow">CPU SCHEDULING SIMULATOR</div>
        <h1>Analytics</h1>
        <p>
          Performance breakdown from the latest simulation
          {simDuration > 0 ? ` (${simDuration} time units simulated)` : ''}.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="analytics-stats-grid">
        <StatCard
          label="Avg Waiting Time"
          value={`${fmt(averageWaitingTime)} u`}
          detail="Completed processes only"
          icon={Clock3}
        />
        <StatCard
          label="Avg Turnaround Time"
          value={`${fmt(averageTurnaroundTime)} u`}
          detail="Completed processes only"
          icon={Activity}
        />
        <StatCard
          label="CPU Utilization"
          value={`${fmt(cpuUtilization)}%`}
          detail="Busy CPU / total sim time"
          icon={Cpu}
        />
        <StatCard
          label="Throughput"
          value={fmt(throughput, 3)}
          detail="Completed / sim time (proc/unit)"
          icon={CheckCircle2}
        />
      </div>

      {/* ROW: Completion pie + per-process bars */}
      <div className="analytics-two-col">
        {/* PIE CHART */}
        <Panel
          title="Process completion status"
          subtitle={`${completedCount} completed · ${incompleteCount} incomplete of ${totalProcesses} total`}
          tag="OVERVIEW"
        >
          <div className="analytics-chart-container-sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => (
                    <span style={{ color: '#a0aaa2', fontSize: 12 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* PER-PROCESS WT vs TAT */}
        <Panel
          title="Per-process timing comparison"
          subtitle={
            completedProcesses.length > 0
              ? `Waiting time vs turnaround time for ${completedProcesses.length} completed process${completedProcesses.length !== 1 ? 'es' : ''}`
              : 'No completed processes to chart'
          }
          tag="PROCESS DETAIL"
        >
          {completedProcesses.length > 0 ? (
            <div className="analytics-chart-container-sm">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={perProcessData}
                  margin={{ top: 4, right: 10, left: -10, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a332d" />
                  <XAxis
                    dataKey="pid"
                    tick={{ fill: '#a0aaa2', fontSize: 11 }}
                    axisLine={{ stroke: '#303933' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#a0aaa2', fontSize: 11 }}
                    axisLine={{ stroke: '#303933' }}
                    tickLine={false}
                    label={{
                      value: 'Time (units)',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#727d74',
                      fontSize: 10,
                      dy: 50,
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="square"
                    iconSize={10}
                    formatter={(value) => (
                      <span style={{ color: '#a0aaa2', fontSize: 12 }}>{value}</span>
                    )}
                  />
                  <Bar dataKey="Waiting Time" fill={COLORS.q1} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Turnaround Time" fill={COLORS.q0} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>
              No completed processes in this simulation.
            </p>
          )}
        </Panel>
      </div>

      {/* FULL-WIDTH PER-PROCESS TABLE (all completed processes) */}
      {completedProcesses.length > 0 && (
        <Panel
          title="Completed process metrics"
          subtitle="Waiting time (WT) and turnaround time (TAT) for every completed process"
          tag="TABLE"
        >
          <div className="analytics-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={perProcessData}
                margin={{ top: 4, right: 20, left: -10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a332d" />
                <XAxis
                  dataKey="pid"
                  tick={{ fill: '#a0aaa2', fontSize: 11 }}
                  axisLine={{ stroke: '#303933' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#a0aaa2', fontSize: 11 }}
                  axisLine={{ stroke: '#303933' }}
                  tickLine={false}
                  label={{
                    value: 'Time (units)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#727d74',
                    fontSize: 10,
                    dy: 50,
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="square"
                  iconSize={10}
                  formatter={(value) => (
                    <span style={{ color: '#a0aaa2', fontSize: 12 }}>{value}</span>
                  )}
                />
                <Bar dataKey="Waiting Time" fill={COLORS.q1} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Turnaround Time" fill={COLORS.q0} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      {/* FIXED vs RANDOM COMPARISON */}
      {hasBothModes && (
        <Panel
          title="Fixed vs Randomized burst-time comparison"
          subtitle="Results from two separate simulations — one with fixed burst time, one with randomized burst time"
          tag="COMPARISON"
        >
          {/* Summary bar chart */}
          <div className="analytics-chart-container" style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonBarData}
                margin={{ top: 4, right: 20, left: -10, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a332d" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#a0aaa2', fontSize: 11 }}
                  axisLine={{ stroke: '#303933' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#a0aaa2', fontSize: 11 }}
                  axisLine={{ stroke: '#303933' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="square"
                  iconSize={10}
                  formatter={(value) => (
                    <span style={{ color: '#a0aaa2', fontSize: 12 }}>{value}</span>
                  )}
                />
                <Bar dataKey="Fixed" fill={COLORS.q1} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Random" fill={COLORS.q2} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detail table */}
          <table className="analytics-compare-table">
            <thead>
              <tr>
                <th>Metric</th>
                <th className="align-right">
                  Fixed burst
                  <span className="compare-badge fixed">FIXED</span>
                </th>
                <th className="align-right">
                  Random burst
                  <span className="compare-badge random">RANDOM</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonMetrics.map((m) => (
                <tr key={m.label}>
                  <td className="metric-label">{m.label}</td>
                  <td className="align-right">
                    {fmt(m.fixed, 3)} <small style={{ color: '#727d74' }}>{m.unit}</small>
                  </td>
                  <td className="align-right">
                    {fmt(m.random, 3)} <small style={{ color: '#727d74' }}>{m.unit}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {/* FOOTER */}
      <footer className="analytics-footer">
        <span>ROUNDROBIN · CPU SCHEDULING LAB</span>
        <span>
          Round Robin + MLFQ <ChevronDown size={13} />
        </span>
      </footer>
    </div>
  );
}
