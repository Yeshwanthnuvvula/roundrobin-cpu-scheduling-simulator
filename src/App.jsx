import { useState } from 'react';
import {
  Activity, LayoutDashboard, Play, BarChart3, Cpu,
  List, Sun, Moon, ChevronDown,
  Clock3, CheckCircle2, CircleDot, ArrowUpRight,
  Layers3
} from 'lucide-react';

import Simulator from './Simulator';
import Processes from './pages/Processes.jsx';
import Execution from './pages/Execution.jsx';
import Analytics from './pages/Analytics.jsx';
import { SimulationProvider } from './context/SimulationProvider.jsx';
import { useSimulation } from './context/useSimulation.js';

import './App.css';
import './styles/themes.css';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Simulator', icon: Play },
  { label: 'Processes', icon: List },
  { label: 'Execution', icon: Activity },
  { label: 'Analytics', icon: BarChart3 },
];

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><Activity size={20} /></div>
        <div>
          <div className="brand-name">ROUNDROBIN</div>
          <div className="brand-caption">CPU SCHEDULING LAB</div>
        </div>
      </div>

      <div className="nav-section-label">WORKSPACE</div>

      <nav className="nav-list">
        {navItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${activePage === label ? 'active' : ''}`}
            onClick={() => setActivePage(label)}
          >
            <Icon size={17} strokeWidth={1.8} />
            <span>{label}</span>
            {label === 'Simulator' && <span className="nav-dot" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="system-status">
          <span className="status-dot" />
          <span>Simulation engine</span>
          <span className="status-ready">Ready</span>
        </div>
        <div className="sidebar-version">ROUNDROBIN · VERSION 1.0</div>
      </div>
    </aside>
  );
}

function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <div className="stat-value">{value}</div>
      {detail && <div className="stat-detail">{detail}</div>}
    </div>
  );
}

function GanttChart({ gantt, totalTime }) {
  const ticks = gantt.length > 0
    ? Array.from(new Set([0, ...gantt.map((segment) => Number(segment.end))])).sort((a, b) => a - b)
    : [];

  return (
    <section className="panel gantt-panel">
      <div className="panel-heading">
        <div>
          <h3>CPU execution timeline</h3>
          <p>Actual process execution from latest simulation (0–{totalTime} time units)</p>
        </div>
        <span className="small-tag">GANTT CHART</span>
      </div>

      <div className="gantt-scroll-wrapper">
        <div
          style={{
            minWidth: `${Math.max(680, totalTime * 20)}px`,
            width: '100%',
          }}
        >
          <div className="gantt-track">
            {gantt.map((segment, index) => {
              const start = Number(segment.start);
              const end = Number(segment.end);
              const duration = Math.max(0, end - start);
              const isIdle = segment.pid === 'IDLE';
              const colorClass = isIdle
                ? 'idle'
                : segment.queueLevel === 0
                ? 'lime'
                : segment.queueLevel === 1
                ? 'sage'
                : 'blue';
              const queueLabel = isIdle ? 'Idle' : `Q${segment.queueLevel ?? 0}`;

              return (
                <div
                  key={`${segment.pid}-${start}-${end}-${index}`}
                  className={`gantt-block ${colorClass}`}
                  style={{
                    flex: `${duration} 0 0%`,
                    minWidth: `${Math.max(38, duration * 18)}px`,
                  }}
                  title={
                    isIdle
                      ? `CPU IDLE | Time: ${start}–${end} (${duration} unit${duration > 1 ? 's' : ''})`
                      : `${segment.pid} | Queue: Q${segment.queueLevel ?? 0} | Time: ${start}–${end} (${duration} unit${duration > 1 ? 's' : ''})`
                  }
                >
                  <span className="gantt-block-pid">{segment.pid}</span>
                  <span className="gantt-block-q">{queueLabel}</span>
                  <span className="gantt-block-time">{start}–{end}</span>
                </div>
              );
            })}
          </div>

          <div className="gantt-ruler">
            {ticks.map((t, idx) => {
              const percent = totalTime > 0 ? (t / totalTime) * 100 : 0;
              let alignClass = 'tick-mid';
              if (idx === 0) alignClass = 'tick-start';
              else if (idx === ticks.length - 1) alignClass = 'tick-end';

              return (
                <div
                  key={`tick-${t}-${idx}`}
                  className={`gantt-tick ${alignClass}`}
                  style={{ left: `${percent}%` }}
                >
                  <div className="gantt-tick-line" />
                  <span className="gantt-tick-label">{t}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="gantt-legend">
        <span><i className="legend-dot lime" /> Q0 (Priority 0 · Quantum = 3)</span>
        <span><i className="legend-dot sage" /> Q1 (Priority 1 · Quantum = 3)</span>
        <span><i className="legend-dot blue" /> Q2 (Priority 2 · Quantum = 3)</span>
        <span><i className="legend-dot idle" /> CPU Idle</span>
      </div>
    </section>
  );
}

function QueuePanel({ readyQueues, cutoffTime }) {
  const queues = [
    {
      name: 'Q0',
      priority: 'Highest priority · Quantum = 3',
      processes: readyQueues?.[0] ?? [],
      color: 'lime',
    },
    {
      name: 'Q1',
      priority: 'Medium priority · Quantum = 3',
      processes: readyQueues?.[1] ?? [],
      color: 'sage',
    },
    {
      name: 'Q2',
      priority: 'Lowest priority · Quantum = 3',
      processes: readyQueues?.[2] ?? [],
      color: 'blue',
    },
  ];

  return (
    <section className="panel queue-panel">
      <div className="panel-heading">
        <div>
          <h3>Ready queues</h3>
          <p>MLFQ status at simulation cutoff (Time: {cutoffTime} units)</p>
        </div>
        <span className="small-tag">MLFQ</span>
      </div>

      <div className="queue-list">
        {queues.map((queue) => (
          <div className="queue-row" key={queue.name}>
            <div className={`queue-indicator ${queue.color}`} />
            <div className="queue-info">
              <div className="queue-name">{queue.name}</div>
              <div className="queue-priority">{queue.priority}</div>
            </div>
            <div className="process-pills">
              {queue.processes.length > 0 ? (
                queue.processes.map((pid) => (
                  <span className="process-pill" key={pid}>{pid}</span>
                ))
              ) : (
                <span className="queue-empty-label">No waiting processes</span>
              )}
            </div>
            <span className="queue-count">{queue.processes.length}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PerformancePanel({ simulationResult }) {
  const formatMetric = (val) => Number.isFinite(val) ? Number(val).toFixed(2) : '—';

  return (
    <section className="panel performance-panel">
      <div className="panel-heading">
        <div>
          <h3>Performance snapshot</h3>
          <p>Real-time execution metrics</p>
        </div>
        <BarChart3 size={18} />
      </div>

      <div className="performance-row">
        <span>Average waiting time</span>
        <strong>{formatMetric(simulationResult.averageWaitingTime)} <small>units</small></strong>
      </div>
      <div className="performance-row">
        <span>Average turnaround time</span>
        <strong>{formatMetric(simulationResult.averageTurnaroundTime)} <small>units</small></strong>
      </div>
      <div className="performance-row">
        <span>CPU utilization</span>
        <strong>{formatMetric(simulationResult.cpuUtilization)}<small>%</small></strong>
      </div>
      <div className="performance-row">
        <span>Total simulated time</span>
        <strong>{simulationResult.currentTime ?? simulationResult.duration} <small>units</small></strong>
      </div>
    </section>
  );
}

function Overview({ setActivePage }) {
  const { simulationResult, timeQuantum } = useSimulation();

  const formatMetric = (value) =>
    Number.isFinite(value) ? Number(value).toFixed(2) : '—';

  if (!simulationResult) {
    return (
      <>
        <section className="welcome-section">
          <div>
            <div className="eyebrow">CPU SCHEDULING SIMULATOR</div>
            <h1>Simulation overview</h1>
            <p>
              Monitor process execution and explore Round Robin with
              Multilevel Feedback Queue scheduling.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => setActivePage('Simulator')}
          >
            <Play size={16} fill="currentColor" />
            Open Simulator
            <ArrowUpRight size={15} />
          </button>
        </section>

        <section className="panel overview-empty-panel">
          <div className="overview-empty-content">
            <div className="overview-empty-icon">
              <Cpu size={30} />
            </div>
            <h3>No simulation results available</h3>
            <p>
              Run a simulation in the workspace to view real-time process execution,
              Gantt chart timeline, MLFQ ready queues, and CPU performance metrics.
            </p>
            <button
              className="primary-button"
              onClick={() => setActivePage('Simulator')}
            >
              <Play size={16} fill="currentColor" />
              Go to Simulator
            </button>
          </div>

          <div className="overview-empty-guide">
            <div className="guide-card">
              <Layers3 size={18} />
              <div>
                <strong>3 Priority Queues</strong>
                <span>Q0 (Highest), Q1 (Medium), Q2 (Lowest)</span>
              </div>
            </div>
            <div className="guide-card">
              <Clock3 size={18} />
              <div>
                <strong>Round Robin Scheduling</strong>
                <span>Time quantum fixed at 3 units per queue</span>
              </div>
            </div>
            <div className="guide-card">
              <Activity size={18} />
              <div>
                <strong>Preemptive Execution</strong>
                <span>High-priority arrivals preempt lower queues</span>
              </div>
            </div>
          </div>
        </section>

        <footer className="page-footer">
          <span>ROUNDROBIN · CPU SCHEDULING LAB</span>
          <span>Round Robin + MLFQ <ChevronDown size={13} /></span>
        </footer>
      </>
    );
  }

  const gantt = simulationResult.gantt ?? [];
  const totalTime = gantt.length
    ? Math.max(...gantt.map((segment) => Number(segment.end)))
    : (simulationResult.currentTime ?? simulationResult.duration);

  return (
    <>
      <section className="welcome-section">
        <div>
          <div className="eyebrow">CPU SCHEDULING SIMULATOR</div>
          <h1>Simulation overview</h1>
          <p>
            Latest simulation execution snapshot and Multilevel Feedback Queue performance metrics.
          </p>
        </div>
        <button
          className="primary-button"
          onClick={() => setActivePage('Simulator')}
        >
          <Play size={16} fill="currentColor" />
          Run New Simulation
          <ArrowUpRight size={15} />
        </button>
      </section>

      {/* 5 STAT CARDS: Real data from latest simulation */}
      <section className="stats-grid">
        <StatCard
          label="Total processes"
          value={simulationResult.totalProcesses ?? simulationResult.processes?.length ?? 0}
          detail="Total scheduled"
          icon={Cpu}
        />
        <StatCard
          label="Completed"
          value={simulationResult.completedCount ?? 0}
          detail="Finished execution"
          icon={CheckCircle2}
        />
        <StatCard
          label="Incomplete"
          value={simulationResult.incompleteCount ?? 0}
          detail="Unfinished at cutoff"
          icon={Clock3}
        />
        <StatCard
          label="Time quantum"
          value={String(timeQuantum ?? 3).padStart(2, '0')}
          detail="Round Robin time units"
          icon={Layers3}
        />
        <StatCard
          label="CPU utilization"
          value={`${formatMetric(simulationResult.cpuUtilization)}%`}
          detail="Busy CPU ratio"
          icon={Activity}
        />
      </section>

      {/* ACTUAL CPU EXECUTION TIMELINE */}
      <GanttChart gantt={gantt} totalTime={totalTime} />

      {/* READY QUEUES AND PERFORMANCE SNAPSHOT */}
      <div className="lower-grid">
        <QueuePanel
          readyQueues={simulationResult.readyQueues}
          cutoffTime={simulationResult.currentTime ?? simulationResult.duration}
        />
        <PerformancePanel simulationResult={simulationResult} />
      </div>

      <footer className="page-footer">
        <span>ROUNDROBIN · CPU SCHEDULING LAB</span>
        <span>Round Robin + MLFQ <ChevronDown size={13} /></span>
      </footer>
    </>
  );
}

function AppShell() {
  const [theme, setTheme] = useState('dark');
  const [activePage, setActivePage] = useState('Overview');

  return (
    <div className="app-shell" data-theme={theme}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {activePage}
          </div>

          <div className="topbar-actions">
            <span className="environment-label">
              <CircleDot size={13} /> LOCAL ENVIRONMENT
            </span>

            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              title="Switch theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>

            <div className="avatar">Y</div>
          </div>
        </header>

        <div className="page-content">
          {activePage === 'Simulator' ? (
            <Simulator />
          ) : activePage === 'Overview' ? (
            <Overview setActivePage={setActivePage} />
          ) : activePage === 'Processes' ? (
            <Processes setActivePage={setActivePage} />
          ) : activePage === 'Execution' ? (
            <Execution setActivePage={setActivePage} />
          ) : activePage === 'Analytics' ? (
            <Analytics setActivePage={setActivePage} />
          ) : (
            <section className="welcome-section">
              <div>
                <div className="eyebrow">ROUNDROBIN WORKSPACE</div>
                <h1>{activePage}</h1>
                <p>This section is coming soon.</p>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <SimulationProvider>
      <AppShell />
    </SimulationProvider>
  );
}

export default App;
