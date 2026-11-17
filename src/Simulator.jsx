
import { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Cpu,
  Clock3,
  Layers3,
  CheckCircle2,
  Activity,
  AlertCircle,
  Timer,
  BarChart3,
  Pause,
  StepForward,
} from 'lucide-react';

import { generateProcesses } from './engine/processGenerator.js';
import { runMLFQ } from './engine/scheduler.js';
import { useSimulation } from './context/useSimulation.js';
import './Simulator.css';

const QUANTUM_BY_QUEUE = [3, 3, 3];

function StatCard({ label, value, detail, icon: Icon }) {
  return (
    <div className="sim-stat-card">
      <div className="sim-stat-label">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <div className="sim-stat-value">{value}</div>
      {detail && <div className="sim-stat-detail">{detail}</div>}
    </div>
  );
}

function Simulator({
  result: propResult,
  onResultChange,
  onReset,
} = {}) {
  const simContext = useSimulation();

  const [localCount, setLocalCount] = useState(simContext?.config?.count ?? 5);
  const [localDuration, setLocalDuration] = useState(simContext?.config?.duration ?? 50);
  const [localMinArrival, setLocalMinArrival] = useState(simContext?.config?.minArrival ?? 0);
  const [localMaxArrival, setLocalMaxArrival] = useState(simContext?.config?.maxArrival ?? 10);
  const [localBurstMode, setLocalBurstMode] = useState(simContext?.config?.burstMode ?? 'random');
  const [localMinBurst, setLocalMinBurst] = useState(simContext?.config?.minBurst ?? 2);
  const [localMaxBurst, setLocalMaxBurst] = useState(simContext?.config?.maxBurst ?? 10);
  const [localFixedBurst, setLocalFixedBurst] = useState(simContext?.config?.fixedBurst ?? 5);

  const [inputMode, setInputMode] = useState('generated');

  const [manualRows, setManualRows] = useState([
    { pid: 'P1', arrivalTime: 0, burstTime: 5 },
    { pid: 'P2', arrivalTime: 1, burstTime: 4 },
    { pid: 'P3', arrivalTime: 2, burstTime: 3 },
  ]);

  const [quanta, setQuanta] = useState([3, 3, 3]);
  const [q2Policy, setQ2Policy] = useState('FCFS');
  const [demoteOnExpiry, setDemoteOnExpiry] = useState(true);
  const [preemptive, setPreemptive] = useState(true);

  // Starvation prevention settings
  const [enableAging, setEnableAging] = useState(true);
  const [agingThreshold, setAgingThreshold] = useState(10);
  const [enablePriorityBoost, setEnablePriorityBoost] = useState(true);
  const [priorityBoostInterval, setPriorityBoostInterval] = useState(20);

  // Gantt chart playback
  const [playClock, setPlayClock] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);

  const [localResult, setLocalResult] = useState(null);
  const [error, setError] = useState('');

  const count = simContext ? simContext.config.count : localCount;
  const setCount = (val) => {
    if (simContext) simContext.setConfig((prev) => ({ ...prev, count: val }));
    else setLocalCount(val);
  };

  const duration = simContext ? simContext.config.duration : localDuration;
  const setDuration = (val) => {
    if (simContext) simContext.setConfig((prev) => ({ ...prev, duration: val }));
    else setLocalDuration(val);
  };

  const minArrival = simContext ? simContext.config.minArrival : localMinArrival;
  const setMinArrival = (val) => {
    if (simContext) simContext.setConfig((prev) => ({ ...prev, minArrival: val }));
    else setLocalMinArrival(val);
  };

  const maxArrival = simContext ? simContext.config.maxArrival : localMaxArrival;
  const setMaxArrival = (val) => {
    if (simContext) simContext.setConfig((prev) => ({ ...prev, maxArrival: val }));
    else setLocalMaxArrival(val);
  };

  const burstMode = simContext ? simContext.config.burstMode : localBurstMode;
  const setBurstMode = (val) => {
    if (simContext) simContext.setConfig((prev) => ({ ...prev, burstMode: val }));
    else setLocalBurstMode(val);
  };

  const minBurst = simContext ? simContext.config.minBurst : localMinBurst;
  const setMinBurst = (val) => {
    if (simContext) simContext.setConfig((prev) => ({ ...prev, minBurst: val }));
    else setLocalMinBurst(val);
  };

  const maxBurst = simContext ? simContext.config.maxBurst : localMaxBurst;
  const setMaxBurst = (val) => {
    if (simContext) simContext.setConfig((prev) => ({ ...prev, maxBurst: val }));
    else setLocalMaxBurst(val);
  };

  const fixedBurst = simContext ? simContext.config.fixedBurst : localFixedBurst;
  const setFixedBurst = (val) => {
    if (simContext) simContext.setConfig((prev) => ({ ...prev, fixedBurst: val }));
    else setLocalFixedBurst(val);
  };

  const result = propResult !== undefined
    ? propResult
    : (simContext ? simContext.simulationResult : localResult);

  const setResult = (val, mode) => {
    if (onResultChange) onResultChange(val);

    if (simContext) {
      simContext.setSimulationResult(val);

      if (val !== null && mode) {
        if (mode === 'fixed') simContext.setFixedResult(val);
        else simContext.setRandomResult(val);
      }
    } else {
      setLocalResult(val);
    }
  };

  function handleRun() {
    setError('');
    setPlaying(false);
    setResult(null, null);

    const pCount = Number(count);
    const pDuration = Number(duration);
    const pMinArrival = Number(minArrival);
    const pMaxArrival = Number(maxArrival);
    const pFixedBurst = Number(fixedBurst);
    const pMinBurst = Number(minBurst);
    const pMaxBurst = Number(maxBurst);
    const pAgingThreshold = Number(agingThreshold);
    const pBoostInterval = Number(priorityBoostInterval);

    if (!Number.isInteger(pCount) || pCount < 1) {
      setError('Number of processes must be a positive integer (at least 1).');
      return;
    }

    if (pCount > 100) {
      setError('Number of processes cannot exceed 100.');
      return;
    }

    if (!Number.isInteger(pDuration) || pDuration < 1) {
      setError('Simulation duration must be a positive integer (at least 1).');
      return;
    }

    if (!Number.isInteger(pMinArrival) || pMinArrival < 0) {
      setError('Minimum arrival time must be a non-negative integer.');
      return;
    }

    if (!Number.isInteger(pMaxArrival) || pMaxArrival < pMinArrival) {
      setError('Maximum arrival time must be greater than or equal to minimum arrival time.');
      return;
    }

    if (burstMode === 'fixed') {
      if (!Number.isInteger(pFixedBurst) || pFixedBurst < 1) {
        setError('Fixed burst time must be a positive integer.');
        return;
      }
    } else {
      if (!Number.isInteger(pMinBurst) || pMinBurst < 1) {
        setError('Minimum burst time must be a positive integer.');
        return;
      }

      if (!Number.isInteger(pMaxBurst) || pMaxBurst < pMinBurst) {
        setError('Maximum burst time must be greater than or equal to minimum burst time.');
        return;
      }
    }

    if (!Number.isInteger(pAgingThreshold) || pAgingThreshold < 1) {
      setError('Aging threshold must be a positive integer.');
      return;
    }

    if (
      enablePriorityBoost &&
      (!Number.isInteger(pBoostInterval) || pBoostInterval < 1)
    ) {
      setError('Priority boost interval must be a positive integer.');
      return;
    }

    try {
      const processes = inputMode === 'manual'
        ? manualRows.map((row) => ({
            pid: row.pid,
            arrivalTime: Number(row.arrivalTime),
            burstTime: Number(row.burstTime),
            remainingTime: Number(row.burstTime),
          }))
        : generateProcesses({
            count: pCount,
            minArrival: pMinArrival,
            maxArrival: pMaxArrival,
            burstMode,
            fixedBurst: pFixedBurst,
            minBurst: pMinBurst,
            maxBurst: pMaxBurst,
          });

      if (!processes.length) {
        throw new Error('Add at least one process.');
      }

      if (
        processes.some((p) =>
          !p.pid ||
          !Number.isInteger(Number(p.arrivalTime)) ||
          Number(p.arrivalTime) < 0 ||
          !Number.isInteger(Number(p.burstTime)) ||
          Number(p.burstTime) < 1
        )
      ) {
        throw new Error('Each process needs a valid PID, arrival time and burst time.');
      }

      const simulation = runMLFQ(processes, {
        duration: pDuration,
        quantumByQueue: quanta,
        demoteOnQuantumExpiry: demoteOnExpiry,
        q2Policy,
        preemptive,

        // Aging
        enableAging,
        agingThreshold: pAgingThreshold,

        // Periodic priority boosting
        priorityBoostInterval: enablePriorityBoost
          ? pBoostInterval
          : null,
      });

      const taggedSimulation = {
        ...simulation,
        burstMode,
        inputMode,
        config: {
          quanta,
          q2Policy,
          demoteOnExpiry,
          preemptive,
          enableAging,
          agingThreshold: pAgingThreshold,
          enablePriorityBoost,
          priorityBoostInterval: enablePriorityBoost
            ? pBoostInterval
            : null,
        },
      };

      setPlayClock(0);
      setResult(taggedSimulation, burstMode);
      setPlaying(true);
    } catch (err) {
      console.error(err);
      setError(
        err.message || 'Simulation failed. Check your scheduler and configuration parameters.'
      );
    }
  }

  function handleReset() {
    setResult(null, null);
    setPlayClock(0);
    setPlaying(false);
    setError('');

    if (simContext) {
      simContext.setFixedResult(null);
      simContext.setRandomResult(null);
    }

    if (onReset) onReset();
  }

  useEffect(() => {
    if (!playing || !result) return undefined;

    const maxTime = Number(
      result.currentTime ?? result.totalSimulatedTime ?? duration
    );

    const timer = setInterval(() => {
      setPlayClock((t) => {
        const next = Math.min(maxTime, t + 0.1 * playSpeed);

        if (next >= maxTime) {
          setPlaying(false);
        }

        return next;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [playing, result, playSpeed, duration]);

  const processes = result?.processes ?? [];
  const allGantt = result?.gantt ?? [];

  const gantt = allGantt
    .filter((seg) => Number(seg.start) < playClock)
    .map((seg) => ({
      ...seg,
      end: Math.min(Number(seg.end), playClock),
    }))
    .filter((seg) => Number(seg.end) > Number(seg.start));

  const completedProcesses = processes.filter(
    (process) => process.state?.toUpperCase() === 'COMPLETED'
  );

  const incompleteCount =
    result?.incompleteCount ?? (processes.length - completedProcesses.length);

  const formatMetric = (value) =>
    Number.isFinite(value) ? Number(value).toFixed(2) : '—';

  const totalTime = result
    ? Math.max(
        1,
        Number(result.currentTime ?? result.totalSimulatedTime ?? duration)
      )
    : 0;

  const timelineTicks = gantt.length > 0
    ? Array.from(
        new Set([0, ...gantt.map((segment) => Number(segment.end))])
      ).sort((a, b) => a - b)
    : [];

  return (
    <div className="simulator-page">
      <div className="simulator-header">
        <div>
          <div className="sim-eyebrow">CPU SCHEDULING SIMULATOR</div>
          <h1>Simulation workspace</h1>
          <p>
            Configure processes, execute MLFQ scheduling, and analyse CPU
            performance with Round Robin queues.
          </p>
        </div>

        <div className="sim-engine-status">
          <span className="sim-status-dot" />
          ENGINE READY
        </div>
      </div>

      {/* CONFIGURATION */}
      <section className="sim-panel">
        <div className="sim-panel-heading">
          <div>
            <div className="sim-eyebrow">CONFIGURATION</div>
            <h2>Simulation parameters</h2>
          </div>
          <Cpu size={26} />
        </div>

        <div className="sim-form-grid">
          <label>
            Number of processes
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </label>

          <label>
            Simulation duration
            <input
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </label>

          <label>
            Minimum arrival time
            <input
              type="number"
              min="0"
              value={minArrival}
              onChange={(e) => setMinArrival(e.target.value)}
            />
          </label>

          <label>
            Maximum arrival time
            <input
              type="number"
              min="0"
              value={maxArrival}
              onChange={(e) => setMaxArrival(e.target.value)}
            />
          </label>

          <div className="sim-full-width">
            <span className="sim-field-title">Burst time generation mode</span>

            <div className="sim-mode-buttons">
              <button
                type="button"
                className={burstMode === 'fixed' ? 'selected' : ''}
                onClick={() => setBurstMode('fixed')}
              >
                Fixed burst time
              </button>

              <button
                type="button"
                className={burstMode === 'random' ? 'selected' : ''}
                onClick={() => setBurstMode('random')}
              >
                Randomized burst time
              </button>
            </div>
          </div>

          {burstMode === 'fixed' ? (
            <label className="sim-full-width">
              Fixed burst time (units)
              <input
                type="number"
                min="1"
                value={fixedBurst}
                onChange={(e) => setFixedBurst(e.target.value)}
              />
            </label>
          ) : (
            <>
              <label>
                Minimum burst time
                <input
                  type="number"
                  min="1"
                  value={minBurst}
                  onChange={(e) => setMinBurst(e.target.value)}
                />
              </label>

              <label>
                Maximum burst time
                <input
                  type="number"
                  min="1"
                  value={maxBurst}
                  onChange={(e) => setMaxBurst(e.target.value)}
                />
              </label>
            </>
          )}
        </div>

        {/* PROCESS INPUT */}
        <div className="sim-full-width sim-extra-config">
          <div className="sim-field-title">Process input</div>

          <div className="sim-mode-buttons">
            <button
              type="button"
              className={inputMode === 'generated' ? 'selected' : ''}
              onClick={() => setInputMode('generated')}
            >
              Fixed / random generation
            </button>

            <button
              type="button"
              className={inputMode === 'manual' ? 'selected' : ''}
              onClick={() => setInputMode('manual')}
            >
              Enter each process manually
            </button>
          </div>

          {inputMode === 'manual' && (
            <div className="sim-manual-table">
              <div className="sim-manual-head">
                <span>PID</span>
                <span>Arrival time</span>
                <span>Burst time</span>
                <span />
              </div>

              {manualRows.map((row, i) => (
                <div className="sim-manual-row" key={row.pid}>
                  <strong>{row.pid}</strong>

                  <input
                    aria-label={`${row.pid} arrival time`}
                    type="number"
                    min="0"
                    value={row.arrivalTime}
                    onChange={(e) =>
                      setManualRows((rows) =>
                        rows.map((r, j) =>
                          j === i
                            ? { ...r, arrivalTime: e.target.value }
                            : r
                        )
                      )
                    }
                  />

                  <input
                    aria-label={`${row.pid} burst time`}
                    type="number"
                    min="1"
                    value={row.burstTime}
                    onChange={(e) =>
                      setManualRows((rows) =>
                        rows.map((r, j) =>
                          j === i
                            ? { ...r, burstTime: e.target.value }
                            : r
                        )
                      )
                    }
                  />

                  <button
                    type="button"
                    disabled={manualRows.length <= 1}
                    onClick={() =>
                      setManualRows((rows) =>
                        rows.filter((_, j) => j !== i)
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="sim-add-process"
                onClick={() =>
                  setManualRows((rows) => [
                    ...rows,
                    {
                      pid: `P${rows.length + 1}`,
                      arrivalTime: 0,
                      burstTime: 5,
                    },
                  ])
                }
                disabled={manualRows.length >= 100}
              >
                + Add process
              </button>
            </div>
          )}
        </div>

        {/* MLFQ POLICIES */}
        <div className="sim-full-width sim-mlfq-policy">
          <div className="sim-field-title">MLFQ queue policies</div>

          <p className="sim-policy-help">
            New processes enter Q0. The CPU always selects the highest-priority
            non-empty queue.
          </p>

          <div className="sim-queue-policy-grid">
            {[0, 1, 2].map((level) => (
              <div
                className={`sim-queue-policy q${level}`}
                key={level}
              >
                <div>
                  <strong>Q{level}</strong>
                  <small>
                    {[
                      'Highest priority',
                      'Medium priority',
                      'Lowest priority',
                    ][level]}
                  </small>
                </div>

                <label>
                  Algorithm
                  <select
                    value={level === 2 ? q2Policy : 'RR'}
                    disabled={level !== 2}
                    onChange={(e) => setQ2Policy(e.target.value)}
                  >
                    <option value="RR">Round Robin</option>
                    <option value="FCFS">FCFS</option>
                  </select>
                </label>

                <label>
                  Quantum
                  <input
                    type="number"
                    min="1"
                    disabled={level === 2 && q2Policy === 'FCFS'}
                    value={quanta[level]}
                    onChange={(e) =>
                      setQuanta((q) =>
                        q.map((v, i) =>
                          i === level
                            ? Math.max(1, Number(e.target.value))
                            : v
                        )
                      )
                    }
                  />
                </label>
              </div>
            ))}
          </div>

          <label className="sim-policy-toggle">
            <input
              type="checkbox"
              checked={demoteOnExpiry}
              onChange={(e) => setDemoteOnExpiry(e.target.checked)}
            />
            <span>
              <b>Demote on quantum expiry</b>
              <small>
                When enabled, an unfinished process moves down one priority
                level after using its full quantum. Q2 remains the lowest queue.
              </small>
            </span>
          </label>

          <label className="sim-policy-toggle">
            <input
              type="checkbox"
              checked={preemptive}
              onChange={(e) => setPreemptive(e.target.checked)}
            />
            <span>
              <b>Priority preemption</b>
              <small>
                A newly arriving higher-priority process can interrupt a
                process currently running in a lower-priority queue.
              </small>
            </span>
          </label>

          {/* AGING AND PRIORITY BOOST */}
          <div className="sim-field-title" style={{ marginTop: '24px' }}>
            Starvation prevention
          </div>

          <p className="sim-policy-help">
            Enable aging and periodic priority boosting to reduce the chance
            that processes in lower-priority queues wait indefinitely.
          </p>

          <label className="sim-policy-toggle">
            <input
              type="checkbox"
              checked={enableAging}
              onChange={(e) => setEnableAging(e.target.checked)}
            />
            <span>
              <b>Enable Aging</b>
              <small>
                A process waiting in Q1 or Q2 is promoted one priority level
                when its waiting time reaches the aging threshold.
              </small>
            </span>
          </label>

          {enableAging && (
            <label className="sim-starvation-input">
              Aging threshold (time units)
              <input
                type="number"
                min="1"
                value={agingThreshold}
                onChange={(e) => setAgingThreshold(e.target.value)}
              />
            </label>
          )}

          <label className="sim-policy-toggle">
            <input
              type="checkbox"
              checked={enablePriorityBoost}
              onChange={(e) => setEnablePriorityBoost(e.target.checked)}
            />
            <span>
              <b>Enable Periodic Priority Boost</b>
              <small>
                At each configured interval, all unfinished processes are
                moved back to the highest-priority queue Q0.
              </small>
            </span>
          </label>

          {enablePriorityBoost && (
            <label className="sim-starvation-input">
              Priority boost interval (time units)
              <input
                type="number"
                min="1"
                value={priorityBoostInterval}
                onChange={(e) =>
                  setPriorityBoostInterval(e.target.value)
                }
              />
            </label>
          )}
        </div>

        <div className="sim-config-info">
          <span>
            <Layers3 size={18} /> Multilevel Feedback Queue (Q0, Q1, Q2)
          </span>
          <span>
            <Clock3 size={18} /> Time quantum: 3 units (default)
          </span>
          <span>
            <Activity size={18} /> 3 priority levels
          </span>
        </div>

        <div className="sim-actions">
          <button className="sim-run-button" onClick={handleRun}>
            <Play size={17} fill="currentColor" />
            Run simulation
          </button>

          <button className="sim-reset-button" onClick={handleReset}>
            <RotateCcw size={17} />
            Reset results
          </button>
        </div>

        {error && (
          <div className="sim-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* RESULTS */}
      {result && (
        <>
          <section className="sim-stats-grid">
            <StatCard
              label="Total processes"
              value={result.totalProcesses ?? processes.length}
              detail="Total scheduled"
              icon={Cpu}
            />

            <StatCard
              label="Completed processes"
              value={result.completedCount ?? completedProcesses.length}
              detail="Finished execution"
              icon={CheckCircle2}
            />

            <StatCard
              label="Incomplete processes"
              value={incompleteCount}
              detail="Unfinished at cutoff"
              icon={Clock3}
            />

            <StatCard
              label="CPU utilization"
              value={`${formatMetric(result.cpuUtilization)}%`}
              detail="Busy time / Total time"
              icon={Activity}
            />

            <StatCard
              label="Average waiting time"
              value={formatMetric(result.averageWaitingTime)}
              detail="Completed processes"
              icon={Timer}
            />

            <StatCard
              label="Average turnaround time"
              value={formatMetric(result.averageTurnaroundTime)}
              detail="Completed processes"
              icon={BarChart3}
            />
          </section>

          {/* GANTT CHART */}
          <section className="sim-panel">
            <div className="sim-panel-heading">
              <div>
                <h2>CPU execution timeline</h2>
                <p>
                  One continuous Gantt timeline with proportional intervals
                  and queue levels
                </p>
              </div>

              <span className="sim-chart-label">GANTT CHART</span>
            </div>

            <div className="sim-playback-controls">
              <strong>
                Simulation time: {playClock.toFixed(1)} / {totalTime}
              </strong>

              <button
                type="button"
                onClick={() => setPlaying((v) => !v)}
                disabled={!result || playClock >= totalTime}
              >
                {playing ? (
                  <>
                    <Pause size={15} /> Pause
                  </>
                ) : (
                  <>
                    <Play size={15} /> {playClock > 0 ? 'Resume' : 'Play'}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPlayClock(0);
                  setPlaying(false);
                }}
              >
                Restart
              </button>

              <button
                type="button"
                onClick={() =>
                  setPlayClock(Math.min(totalTime, playClock + 1))
                }
                disabled={!result || playClock >= totalTime}
              >
                <StepForward size={15} /> Step
              </button>

              <label>
                Speed
                <select
                  value={playSpeed}
                  onChange={(e) => setPlaySpeed(Number(e.target.value))}
                >
                  <option value={0.5}>0.5×</option>
                  <option value={1}>1×</option>
                  <option value={2}>2×</option>
                  <option value={4}>4×</option>
                </select>
              </label>
            </div>

            {gantt.length > 0 ? (
              <div className="sim-gantt-wrapper">
                <div className="sim-gantt-axis">
                  <span>Start: 0 time units</span>
                  <span>Total Simulated Time: {totalTime} units</span>
                </div>

                <div className="sim-gantt-track-scroll">
                  <div
                    className="sim-gantt-track-container"
                    style={{
                      minWidth: `${Math.max(720, totalTime * 22)}px`,
                    }}
                  >
                    <div className="sim-gantt-track">
                      {gantt.map((segment, index) => {
                        const start = Number(segment.start);
                        const end = Number(segment.end);
                        const segmentDuration = Math.max(0, end - start);
                        const isIdle = segment.pid === 'IDLE';
                        const queueLabel = isIdle
                          ? 'Idle'
                          : `Q${segment.queueLevel ?? 0}`;

                        return (
                          <div
                            key={`${segment.pid}-${start}-${end}-${index}`}
                            className={`sim-gantt-block ${
                              isIdle
                                ? 'idle'
                                : `q${segment.queueLevel ?? 0}`
                            }`}
                            style={{
                              flexGrow: segmentDuration,
                              flexShrink: 0,
                              flexBasis: `${segmentDuration}px`,
                            }}
                            title={
                              isIdle
                                ? `CPU IDLE | Time: ${start}–${end} (${segmentDuration} unit${segmentDuration > 1 ? 's' : ''})`
                                : `${segment.pid} | Queue: Q${segment.queueLevel ?? 0} | Time: ${start}–${end} (${segmentDuration} unit${segmentDuration > 1 ? 's' : ''})`
                            }
                          >
                            <span className="sim-gantt-pid">
                              {segment.pid}
                            </span>
                            <span className="sim-gantt-queue">
                              {queueLabel}
                            </span>
                            <span className="sim-gantt-time">
                              {start}–{end}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="sim-gantt-ruler">
                      {timelineTicks.map((t, idx) => {
                        const percent =
                          totalTime > 0 ? (t / totalTime) * 100 : 0;

                        let alignClass = 'tick-mid';

                        if (idx === 0) alignClass = 'tick-start';
                        else if (idx === timelineTicks.length - 1) {
                          alignClass = 'tick-end';
                        }

                        return (
                          <div
                            key={`tick-${t}-${idx}`}
                            className={`sim-gantt-tick ${alignClass}`}
                            style={{ left: `${percent}%` }}
                          >
                            <div className="sim-tick-line" />
                            <span className="sim-tick-label">{t}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p>No CPU execution recorded.</p>
            )}

            <div className="sim-legend">
              <span><i className="q0" /> Q0</span>
              <span><i className="q1" /> Q1</span>
              <span><i className="q2" /> Q2</span>
              <span><i className="idle" /> CPU Idle</span>
            </div>
          </section>

          {/* PROCESS TABLE */}
          <section className="sim-panel">
            <div className="sim-panel-heading">
              <div>
                <h2>Process details</h2>
                <p>
                  Individual process parameters, execution timestamps,
                  and performance metrics
                </p>
              </div>
            </div>

            <div className="sim-table-wrapper">
              <table className="sim-process-table">
                <thead>
                  <tr>
                    <th>PID</th>
                    <th>Arrival Time (AT)</th>
                    <th>Burst Time (BT)</th>
                    <th>Remaining Time</th>
                    <th>Completion Time (CT)</th>
                    <th>Turnaround Time (TAT)</th>
                    <th>Waiting Time (WT)</th>
                    <th>Final Queue</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {processes.map((process) => {
                    const isCompleted =
                      process.state?.toUpperCase() === 'COMPLETED';

                    return (
                      <tr key={process.pid}>
                        <td className="sim-pid">{process.pid}</td>
                        <td>{process.arrivalTime}</td>
                        <td>{process.burstTime}</td>
                        <td>{process.remainingTime}</td>
                        <td>
                          {isCompleted ? process.completionTime : '—'}
                        </td>
                        <td>
                          {isCompleted ? process.turnaroundTime : '—'}
                        </td>
                        <td>
                          {isCompleted ? process.waitingTime : '—'}
                        </td>
                        <td>
                          {process.state === 'NEW'
                            ? '—'
                            : `Q${process.queueLevel ?? 0}`}
                        </td>
                        <td>
                          <span
                            className={`sim-state ${
                              isCompleted ? 'completed' : 'incomplete'
                            }`}
                          >
                            {isCompleted ? 'COMPLETED' : 'INCOMPLETE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="sim-note">
              Formulas: Turnaround Time (TAT) = CT – AT, Waiting Time (WT) =
              TAT – BT. Average waiting time and average turnaround time are
              calculated using completed processes only.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

export default Simulator;
