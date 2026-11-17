
/**
 * ROUNDROBIN - MLFQ CPU Scheduling Engine
 *
 * Provisional scheduling policy:
 * - Three priority queues.
 * - Default quantum = 3 units for every queue.
 * - New processes enter Q0.
 * - Higher-priority queues execute first.
 * - Processes are demoted after using their full quantum.
 * - Higher-priority arrivals preempt lower-priority processes.
 * - Preempted processes preserve their unused quantum.
 * - Simulation stops at the configured duration.
 */

export function runMLFQ(
  inputProcesses,
  {
    duration = 50,
    quantumByQueue = [3, 3, 3],
    demoteOnQuantumExpiry = true,
    q2Policy = 'RR',
    preemptive = true,
  } = {}
) {
  // 1. Validate configuration

  if (!Number.isInteger(duration) || duration < 1) {
    throw new Error('Simulation duration must be a positive integer.');
  }

  if (
    !Array.isArray(quantumByQueue) ||
    quantumByQueue.length < 1 ||
    quantumByQueue.some(q => !Number.isInteger(q) || q < 1)
  ) {
    throw new Error('Provide valid positive integer queue quanta.');
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
  }));

  // 3. Initialize scheduling queues

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

  // 4. Record Gantt chart segments

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

  // 5. Main scheduling loop

  while (currentTime < duration) {

    // Admit newly arrived processes into Q0.

    while (
      nextArrival < arrivals.length &&
      arrivals[nextArrival].arrivalTime <= currentTime
    ) {
      const process = arrivals[nextArrival];

      process.state = 'READY';
      process.queueLevel = 0;
      process.quantumRemaining = quantumByQueue[0];

      readyQueues[0].push(process);

      nextArrival++;
    }

    // Check whether a higher-priority process has arrived.

    if (runningProcess && preemptive) {
      const higherPriorityReady = readyQueues
        .slice(0, runningProcess.queueLevel)
        .some(queue => queue.length > 0);

      if (higherPriorityReady) {
        runningProcess.state = 'READY';

        // Preserve unused quantum when preempted.
        readyQueues[runningProcess.queueLevel]
          .unshift(runningProcess);

        runningProcess = null;
      }
    }

    // Select the highest-priority non-empty queue.

    if (!runningProcess) {
      for (let level = 0; level < queueCount; level++) {
        if (readyQueues[level].length > 0) {
          runningProcess = readyQueues[level].shift();
          runningProcess.state = 'RUNNING';
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

    // Record response time on first execution.

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
    runningProcess.quantumRemaining--;

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

      runningProcess = null;
      continue;
    }

    // Quantum expiry and queue demotion.

    if (runningProcess.quantumRemaining === 0) {
      const currentLevel = runningProcess.queueLevel;

      if (
        demoteOnQuantumExpiry &&
        currentLevel < queueCount - 1
      ) {
        runningProcess.queueLevel++;
      }

      runningProcess.quantumRemaining =
        (runningProcess.queueLevel === 2 && q2Policy === 'FCFS')
          ? Number.POSITIVE_INFINITY
          : quantumByQueue[runningProcess.queueLevel];

      runningProcess.state = 'READY';

      readyQueues[runningProcess.queueLevel]
        .push(runningProcess);

      runningProcess = null;
    }
  }

  // 6. Stop the running process cleanly at the time limit.

  if (runningProcess) {
    runningProcess.state = 'READY';

    readyQueues[runningProcess.queueLevel]
      .unshift(runningProcess);
  }

  // 7. Calculate metrics for completed processes only.

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

  const totalSimulatedTime = currentTime > 0 ? currentTime : duration;

  const cpuUtilization =
    totalSimulatedTime > 0 ? (executedTime / totalSimulatedTime) * 100 : 0;

  // 8. Return simulation results.

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
  };
}
