
function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateProcesses({
  count = 5,
  arrivalMin = 0,
  arrivalMax = 10,
  minArrival,
  maxArrival,
  burstMode = 'random',
  fixedBurstTime = 5,
  fixedBurst,
  minBurst = 2,
  maxBurst = 10,
} = {}) {
  const countVal = Number(count);
  const minArrivalVal = minArrival !== undefined ? Number(minArrival) : Number(arrivalMin);
  const maxArrivalVal = maxArrival !== undefined ? Number(maxArrival) : Number(arrivalMax);
  const fixedBurstVal = fixedBurst !== undefined ? Number(fixedBurst) : Number(fixedBurstTime);
  const minBurstVal = Number(minBurst);
  const maxBurstVal = Number(maxBurst);

  if (!Number.isInteger(countVal) || countVal < 1 || countVal > 100) {
    throw new Error('Process count must be between 1 and 100.');
  }

  if (
    !Number.isInteger(minArrivalVal) ||
    !Number.isInteger(maxArrivalVal) ||
    minArrivalVal < 0 ||
    maxArrivalVal < minArrivalVal
  ) {
    throw new Error('Invalid arrival-time range.');
  }

  if (!['fixed', 'random'].includes(burstMode)) {
    throw new Error('Burst mode must be fixed or random.');
  }

  if (burstMode === 'fixed' &&
      (!Number.isInteger(fixedBurstVal) || fixedBurstVal < 1)) {
    throw new Error('Fixed burst time must be positive integer.');
  }

  if (burstMode === 'random' &&
      (!Number.isInteger(minBurstVal) ||
       !Number.isInteger(maxBurstVal) ||
       minBurstVal < 1 ||
       maxBurstVal < minBurstVal)) {
    throw new Error('Invalid burst-time range.');
  }

  const processes = [];

  for (let i = 0; i < countVal; i++) {
    const arrivalTime = randomInteger(minArrivalVal, maxArrivalVal);

    const burstTime = burstMode === 'fixed'
      ? fixedBurstVal
      : randomInteger(minBurstVal, maxBurstVal);

    processes.push({
      pid: `P${i + 1}`,
      arrivalTime,
      burstTime,
      remainingTime: burstTime,
      completionTime: null,
      turnaroundTime: null,
      waitingTime: null,
      responseTime: null,
      queueLevel: 0,
      state: 'NEW',
    });
  }

  processes.sort(
    (a, b) => a.arrivalTime - b.arrivalTime ||
      a.pid.localeCompare(b.pid, undefined, { numeric: true })
  );

  return processes;
}
