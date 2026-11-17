import { useState, useMemo } from 'react';
import {
  Activity,
  Play,
  Clock3,
  Layers3,
  Cpu,
  ArrowUpRight,
} from 'lucide-react';

import { useSimulation } from '../context/useSimulation.js';
import './Execution.css';

export default function Execution({ setActivePage }) {
  const { simulationResult } = useSimulation();

  const [logFilter, setLogFilter] = useState('ALL'); // ALL, BUSY, IDLE

  const gantt = useMemo(() => {
    return simulationResult?.gantt ?? [];
  }, [simulationResult]);

  const totalTime = useMemo(() => {
    if (!gantt.length) {
      return simulationResult?.currentTime ?? simulationResult?.duration ?? 0;
    }
    return Math.max(...gantt.map((s) => Number(s.end)));
  }, [gantt, simulationResult]);

  // Compute busy, idle, and utilization metrics strictly from actual gantt intervals
  const { busyTime, idleTime, cpuUtilization } = useMemo(() => {
    if (!gantt.length) {
      return { busyTime: 0, idleTime: 0, cpuUtilization: 0 };
    }

    let busy = 0;
    let idle = 0;

    for (const segment of gantt) {
      const dur = Math.max(0, Number(segment.end) - Number(segment.start));
      if (segment.pid === 'IDLE') {
        idle += dur;
      } else {
        busy += dur;
      }
    }

    const total = busy + idle;
    const util = total > 0 ? (busy / total) * 100 : 0;

    return { busyTime: busy, idleTime: idle, cpuUtilization: util };
  }, [gantt]);

  // Unique boundary timestamp marks for the ruler
  const timelineTicks = useMemo(() => {
    if (!gantt.length) return [];
    const points = new Set([0]);
    for (const seg of gantt) {
      points.add(Number(seg.end));
    }
    return Array.from(points).sort((a, b) => a - b);
  }, [gantt]);

  // Chronological log filtering
  const filteredLog = useMemo(() => {
    let list = gantt.map((seg, idx) => ({
      index: idx + 1,
      ...seg,
      duration: Math.max(0, Number(seg.end) - Number(seg.start)),
      isIdle: seg.pid === 'IDLE',
    }));

    if (logFilter === 'BUSY') {
      list = list.filter((s) => !s.isIdle);
    } else if (logFilter === 'IDLE') {
      list = list.filter((s) => s.isIdle);
    }

    return list;
  }, [gantt, logFilter]);

  // Empty state when no simulation has been run
  if (!simulationResult) {
    return (
      <div className="execution-page">
        <section className="welcome-section">
          <div>
            <div className="eyebrow">CPU SCHEDULING SIMULATOR</div>
            <h1>CPU execution analysis</h1>
            <p>
              Inspect the continuous Gantt chart timeline, execution duration scaling, and chronological CPU intervals.
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

        <section className="execution-empty-panel">
          <div className="execution-empty-content">
            <div className="execution-empty-icon">
              <Activity size={30} />
            </div>
            <h3>No execution data available</h3>
            <p>
              Run a simulation in the workspace to generate and visualize the continuous CPU execution timeline, queue transitions, and chronological execution intervals.
            </p>
            <button
              className="primary-button"
              onClick={() => setActivePage && setActivePage('Simulator')}
            >
              <Play size={16} fill="currentColor" />
              Go to Simulator
            </button>
          </div>

          <div className="execution-empty-guide">
            <div className="guide-card">
              <Activity size={18} />
              <div>
                <strong>Continuous Timeline</strong>
                <span>Single continuous Gantt chart with zero overlap</span>
              </div>
            </div>
            <div className="guide-card">
              <Clock3 size={18} />
              <div>
                <strong>Accurate Idle Detection</strong>
                <span>Visual indicators for initial and intermediate CPU idle intervals</span>
              </div>
            </div>
            <div className="guide-card">
              <Layers3 size={18} />
              <div>
                <strong>Queue Level Color Coding</strong>
                <span>Q0 (Lime), Q1 (Sage), Q2 (Blue), and Idle (Grey)</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="execution-page">
      <section className="welcome-section">
        <div>
          <div className="eyebrow">CPU SCHEDULING SIMULATOR</div>
          <h1>CPU execution analysis</h1>
          <p>
            Continuous Gantt chart execution timeline and chronological CPU interval diagnostics.
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

      {/* METRICS STATS GRID */}
      <section className="execution-stats-grid">
        <div className="execution-stat-card">
          <div className="execution-stat-top">
            <span>Total CPU busy time</span>
            <Activity size={17} />
          </div>
          <div className="execution-stat-value">{busyTime} <small style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted)' }}>units</small></div>
          <div className="execution-stat-detail">
            {totalTime > 0 ? ((busyTime / totalTime) * 100).toFixed(1) : 0}% of simulated time
          </div>
        </div>

        <div className="execution-stat-card">
          <div className="execution-stat-top">
            <span>Total CPU idle time</span>
            <Clock3 size={17} />
          </div>
          <div className="execution-stat-value">{idleTime} <small style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted)' }}>units</small></div>
          <div className="execution-stat-detail">
            {totalTime > 0 ? ((idleTime / totalTime) * 100).toFixed(1) : 0}% of simulated time
          </div>
        </div>

        <div className="execution-stat-card">
          <div className="execution-stat-top">
            <span>CPU utilization</span>
            <Cpu size={17} />
          </div>
          <div className="execution-stat-value">{cpuUtilization.toFixed(2)}%</div>
          <div className="execution-stat-detail">Busy time / Total simulated time</div>
        </div>

        <div className="execution-stat-card">
          <div className="execution-stat-top">
            <span>Total simulated time</span>
            <Layers3 size={17} />
          </div>
          <div className="execution-stat-value">{totalTime} <small style={{ fontSize: '13px', fontWeight: 500, color: 'var(--muted)' }}>units</small></div>
          <div className="execution-stat-detail">{gantt.length} discrete execution intervals</div>
        </div>
      </section>

      {/* CONTINUOUS GANTT TIMELINE */}
      <section className="execution-gantt-panel">
        <div className="execution-panel-heading">
          <div>
            <h2>CPU execution timeline</h2>
            <p>One continuous timeline proportionally scaled to actual execution durations</p>
          </div>
          <span className="execution-tag">GANTT CHART</span>
        </div>

        <div className="execution-axis-info">
          <span>Start: 0 time units</span>
          <span>Timeline End: {totalTime} units</span>
        </div>

        <div className="execution-gantt-scroll">
          <div
            className="execution-gantt-container"
            style={{
              minWidth: `${Math.max(760, totalTime * 24)}px`,
            }}
          >
            {/* The single continuous Gantt track */}
            <div className="execution-gantt-track">
              {gantt.map((segment, index) => {
                const start = Number(segment.start);
                const end = Number(segment.end);
                const duration = Math.max(0, end - start);
                const isIdle = segment.pid === 'IDLE';
                const queueClass = isIdle ? 'idle' : `q${segment.queueLevel ?? 0}`;
                const queueLabel = isIdle ? 'Idle' : `Q${segment.queueLevel ?? 0}`;

                return (
                  <div
                    key={`${segment.pid}-${start}-${end}-${index}`}
                    className={`execution-gantt-block ${queueClass}`}
                    style={{
                      flex: `${duration} 0 0%`,
                      minWidth: `${Math.max(42, duration * 20)}px`,
                    }}
                    title={
                      isIdle
                        ? `CPU IDLE | Time: ${start}–${end} (${duration} time unit${duration > 1 ? 's' : ''})`
                        : `${segment.pid} | Queue: Q${segment.queueLevel ?? 0} | Time: ${start}–${end} (${duration} time unit${duration > 1 ? 's' : ''})`
                    }
                  >
                    <span className="execution-gantt-pid">{segment.pid}</span>
                    <span className="execution-gantt-queue">{queueLabel}</span>
                    <span className="execution-gantt-time">{start}–{end}</span>
                  </div>
                );
              })}
            </div>

            {/* Proportional timestamp ruler ticks */}
            <div className="execution-gantt-ruler">
              {timelineTicks.map((t, idx) => {
                const percent = totalTime > 0 ? (t / totalTime) * 100 : 0;
                let alignClass = 'tick-mid';
                if (idx === 0) alignClass = 'tick-start';
                else if (idx === timelineTicks.length - 1) alignClass = 'tick-end';

                return (
                  <div
                    key={`exec-tick-${t}-${idx}`}
                    className={`execution-gantt-tick ${alignClass}`}
                    style={{ left: `${percent}%` }}
                  >
                    <div className="execution-tick-line" />
                    <span className="execution-tick-label">{t}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="execution-legend">
          <span><i className="q0" /> Q0 (Lime · Priority 0 · Quantum = 3)</span>
          <span><i className="q1" /> Q1 (Muted green · Priority 1 · Quantum = 3)</span>
          <span><i className="q2" /> Q2 (Blue · Priority 2 · Quantum = 3)</span>
          <span><i className="idle" /> CPU Idle (Grey)</span>
        </div>
      </section>

      {/* CHRONOLOGICAL EXECUTION DETAILS LOG */}
      <section className="execution-log-panel">
        <div className="execution-log-toolbar">
          <div>
            <h2>Chronological execution log</h2>
            <p>Chronological sequence of all CPU execution intervals and queue levels</p>
          </div>

          <div className="execution-log-filters">
            <button
              className={`execution-filter-btn ${logFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setLogFilter('ALL')}
            >
              All Intervals ({gantt.length})
            </button>
            <button
              className={`execution-filter-btn ${logFilter === 'BUSY' ? 'active' : ''}`}
              onClick={() => setLogFilter('BUSY')}
            >
              Busy ({gantt.filter((s) => s.pid !== 'IDLE').length})
            </button>
            <button
              className={`execution-filter-btn ${logFilter === 'IDLE' ? 'active' : ''}`}
              onClick={() => setLogFilter('IDLE')}
            >
              Idle ({gantt.filter((s) => s.pid === 'IDLE').length})
            </button>
          </div>
        </div>

        <div className="execution-table-wrapper">
          <table className="execution-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Interval</th>
                <th>Process ID</th>
                <th>Queue Level</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
                <th>Type</th>
                <th>% of Total Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredLog.map((item) => {
                const percentShare = totalTime > 0
                  ? ((item.duration / totalTime) * 100).toFixed(1)
                  : 0;

                return (
                  <tr key={`log-${item.index}-${item.pid}-${item.start}`}>
                    <td>#{item.index}</td>
                    <td>{item.start} → {item.end}</td>
                    <td className={item.isIdle ? 'cell-idle' : 'cell-pid'}>
                      {item.pid}
                    </td>
                    <td>
                      {item.isIdle ? (
                        <span style={{ color: 'var(--muted)' }}>—</span>
                      ) : (
                        <span className={`exec-queue-pill q${item.queueLevel ?? 0}`}>
                          Q{item.queueLevel ?? 0}
                        </span>
                      )}
                    </td>
                    <td>{item.start}</td>
                    <td>{item.end}</td>
                    <td>{item.duration} {item.duration === 1 ? 'unit' : 'units'}</td>
                    <td>
                      <span className={`exec-type-badge ${item.isIdle ? 'idle' : 'busy'}`}>
                        {item.isIdle ? 'CPU IDLE' : 'PROCESS'}
                      </span>
                    </td>
                    <td>{percentShare}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
