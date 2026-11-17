
/**
 * ROUNDROBIN - Multilevel Feedback Queue (MLFQ) CPU Scheduler
 *
 * Features:
 * - Three priority queues: Q0, Q1, Q2.
 * - New processes enter Q0.
 * - Round Robin scheduling in Q0 and Q1.
 * - Q2 supports RR or FCFS.
 * - Default time quantum = 3 units.
 * - Demotion after quantum expiry.
 * - Higher-priority process preemption.
 * - Aging to reduce starvation.
 * - Periodic priority boosting to Q0.
 * - Simulation stops at the configured duration.
 * - Metrics calculated for completed processes only.
 */

export function runMLFQ(
  inputProcesses,
  {
    duration = 50,
    quantumByQueue = [3, 3, 3],
    demoteOnQuantumExpiry = true,
    q2Policy = 'RR',
    preemptive = true,

    // Starvation prevention settings
    enableAging = true,
    agingThreshold = 10,
    priorityBoostInterval = 20,
  } = {}
) {

  // 1. Validate configuration

  if (!Number.isInteger(duration) || duration < 1) {
    throw new Error('Simulation duration must be a positive integer.');
  }

  if (
    !Array.isArray(quantumByQueue) ||
    quantumByQueue.length !== 3 ||
    quantumByQueue.some(q => !Number.isInteger(q) || q < 1)
  ) {
    throw new Error('Provide three valid positive integer queue quanta.');
  }

  if (!['RR', 'FCFS'].includes(q2Policy)) {
    throw new Error('Q2 policy must be RR or FCFS.');
  }

  if (!Number.isInteger(agingThreshold) || agingThreshold < 1) {
    throw new Error('Aging threshold must be a positive integer.');
  }

  if (
    priorityBoostInterval !== null &&
    (!Number.isInteger(priorityBoostInterval) || priorityBoostInterval < 1)
  ) {
    throw new Error('Priority boost interval must be a positive integer or null.');
  }

  if (!Array.isArray(inputProcesses) || inputProcesses.length === 0) {
    throw new Error('Provide at least one process.');
  }

  const seenPids = new Set();

  for (const process of inputProcesses) {
    if (
      typeof process.pid !== 'string' ||
      process.pid.trim() === '' ||
      seenPids.has(process.pid)
    ) {
      throw new Error('Every process must have a unique PID.');
    }

    seenPids.add(process.pid);

    if (
      !Number.isInteger(process.arrivalTime) ||
      process.arrivalTime < 0 ||
      !Number.isInteger(process.burstTime) ||
      process.burstTime < 1
    ) {
      throw new Error(`Invalid arrival or burst time for ${process.pid}.`);
    }
  }

  // 2. Create independent process copies

  const processes = inputProcesses.map(process => ({
    ...process,
    remainingTime: process.burstTime,
    completionTime: null,
    turnaroundTime: null,
    waitingTime: null,
    responseTime: null,
    queueLevel: 0,
    state: 'NEW',
    quantumRemaining: quantumByQueue[0],
    readySince: null,
  }));

  // 3. Initialize ready queues

  const queueCount = quantumByQueue.length;

  const readyQueues = Array.from(
    { length: queueCount },
    () => []
  );

  const arrivals = [...processes].sort(
    (a, b) =>
      a.arrivalTime - b.arrivalTime ||
      a.pid.localeCompare(b.pid, undefined, { numeric: true })
  );

  const gantt = [];

  let nextArrival = 0;
  let runningProcess = null;
  let currentTime = 0;
  let executedTime = 0;

  let nextPriorityBoost =
    priorityBoostInterval === null
      ? Infinity
      : priorityBoostInterval;

  // 4. Queue helper

  function enqueueProcess(process, level, front = false) {
    process.queueLevel = level;
    process.state = 'READY';
    process.readySince = currentTime;

    if (level === queueCount - 1 && q2Policy === 'FCFS') {
      process.quantumRemaining = Infinity;
    } else {
      process.quantumRemaining = quantumByQueue[level];
    }

    if (front) {
      readyQueues[level].unshift(process);
    } else {
      readyQueues[level].push(process);
    }
  }

  // 5. Record Gantt chart segments

  function recordExecution(pid, start, end, queueLevel = null) {
    const last = gantt[gantt.length - 1];

    if (
      last &&
      last.pid === pid &&
      last.end === start &&
      last.queueLevel === queueLevel
    ) {
      last.end = end;
    } else {
      gantt.push({
        pid,
        start,
        end,
        queueLevel,
      });
    }
  }

  // 6. Aging mechanism

  function applyAging() {
    if (!enableAging) return;

    // Q0 is already the highest-priority queue.
    // Processes in Q1 and Q2 can move up one level.

    for (let level = 1; level < queueCount; level++) {
      for (let i = readyQueues[level].length - 1; i >= 0; i--) {
        const process = readyQueues[level][i];

        const waitingDuration =
          currentTime - process.readySince;

        if (waitingDuration >= agingThreshold) {
          readyQueues[level].splice(i, 1);

          // Promote one priority level.
          enqueueProcess(process, level - 1);

        }
      }
    }
  }

  // 7. Periodic priority boosting

  function applyPriorityBoost() {
    if (currentTime < nextPriorityBoost) return;

    // Collect all waiting processes, preserving queue order.
    const allWaitingProcesses = [];

    for (let level = 0; level < queueCount; level++) {
      allWaitingProcesses.push(...readyQueues[level]);
      readyQueues[level] = [];
    }

    // Include the currently running process.
    if (runningProcess) {
      allWaitingProcesses.push(runningProcess);
      runningProcess = null;
    }

    // Move every unfinished process to Q0.
    for (const process of allWaitingProcesses) {
      enqueueProcess(process, 0);
    }

    // Schedule the next boost.
    while (nextPriorityBoost <= currentTime) {
      nextPriorityBoost += priorityBoostInterval;
    }
  }

  // 8. Main scheduling loop

  while (currentTime < duration) {

    // Admit newly arrived processes into Q0.

    while (
      nextArrival < arrivals.length &&
      arrivals[nextArrival].arrivalTime <= currentTime
    ) {
      const process = arrivals[nextArrival];

      enqueueProcess(process, 0);
      nextArrival++;
    }

    // Apply aging and priority boosting.
    applyAging();
    applyPriorityBoost();

    // Check higher-priority preemption.

    if (runningProcess && preemptive) {
      const higherPriorityReady = readyQueues
        .slice(0, runningProcess.queueLevel)
        .some(queue => queue.length > 0);

      if (higherPriorityReady) {
        const process = runningProcess;
        runningProcess = null;

        // Preserve remaining quantum after preemption.
        process.state = 'READY';
        process.readySince = currentTime;

        readyQueues[process.queueLevel].unshift(process);
      }
    }

    // Select highest-priority non-empty queue.

    if (!runningProcess) {
      for (let level = 0; level < queueCount; level++) {
        if (readyQueues[level].length > 0) {
          runningProcess = readyQueues[level].shift();

          runningProcess.state = 'RUNNING';
          runningProcess.readySince = null;

          break;
        }
      }
    }

    // CPU idle handling.

    if (!runningProcess) {
      recordExecution(
        'IDLE',
        currentTime,
        currentTime + 1
      );

      currentTime++;
      continue;
    }

    // Record first response time.

    if (runningProcess.responseTime === null) {
      runningProcess.responseTime =
        currentTime - runningProcess.arrivalTime;
    }

    // Execute for one time unit.

    recordExecution(
      runningProcess.pid,
      currentTime,
      currentTime + 1,
      runningProcess.queueLevel
    );

    runningProcess.remainingTime--;

    if (runningProcess.quantumRemaining !== Infinity) {
      runningProcess.quantumRemaining--;
    }

    executedTime++;
    currentTime++;

    // Process completion.

    if (runningProcess.remainingTime === 0) {
      runningProcess.state = 'COMPLETED';
      runningProcess.completionTime = currentTime;

      runningProcess.turnaroundTime =
        runningProcess.completionTime -
        runningProcess.arrivalTime;

      runningProcess.waitingTime =
        runningProcess.turnaroundTime -
        runningProcess.burstTime;

      runningProcess.readySince = null;
      runningProcess = null;

      continue;
    }

    // Quantum expiry and demotion.

    if (runningProcess.quantumRemaining === 0) {
      const process = runningProcess;
      const currentLevel = process.queueLevel;

      runningProcess = null;

      let nextLevel = currentLevel;

      if (
        demoteOnQuantumExpiry &&
        currentLevel < queueCount - 1
      ) {
        nextLevel++;
      }

      enqueueProcess(process, nextLevel);
    }
  }

  // 9. Preserve unfinished running process at simulation cutoff.

  if (runningProcess) {
    const process = runningProcess;
    runningProcess = null;

    process.state = 'READY';
    process.readySince = currentTime;

    readyQueues[process.queueLevel].unshift(process);
  }

  // 10. Calculate metrics for completed processes only.

  const completedProcesses = processes.filter(
    process => process.state === 'COMPLETED'
  );

  const completedCount = completedProcesses.length;

  const incompleteCount =
    processes.length - completedCount;

  const totalWaitingTime = completedProcesses.reduce(
    (total, process) => total + process.waitingTime,
    0
  );

  const totalTurnaroundTime = completedProcesses.reduce(
    (total, process) => total + process.turnaroundTime,
    0
  );

  const averageWaitingTime =
    completedCount > 0
      ? totalWaitingTime / completedCount
      : 0;

  const averageTurnaroundTime =
    completedCount > 0
      ? totalTurnaroundTime / completedCount
      : 0;

  const totalSimulatedTime = currentTime;

  const cpuUtilization =
    totalSimulatedTime > 0
      ? (executedTime / totalSimulatedTime) * 100
      : 0;

  // 11. Return simulation results.

  return {
    processes,
    gantt,

    readyQueues: readyQueues.map(queue =>
      queue.map(process => process.pid)
    ),

    currentTime,
    duration,
    totalSimulatedTime,

    totalProcesses: processes.length,
    completedCount,
    incompleteCount,

    averageWaitingTime,
    averageTurnaroundTime,

    cpuUtilization,
    executedTime,

    // Additional information for the UI.
    starvationPrevention: {
      agingEnabled: enableAging,
      agingThreshold,
      priorityBoostEnabled: priorityBoostInterval !== null,
      priorityBoostInterval,
    },
  };
}
