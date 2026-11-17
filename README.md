# ROUNDROBIN — CPU Scheduling Lab

This is the original ROUNDROBIN React + Vite application with the live MLFQ simulator additions. The original dark charcoal / lime / teal theme, navigation, dashboard and page structure are retained.

## Run locally

```bash
npm install
npm run dev
```

## Simulator additions

- Switch between generated process sets (fixed or random bursts) and manually entered per-process arrival/burst values.
- Configure Q0 and Q1 Round Robin quanta.
- Configure Q2 as FCFS or Round Robin; Q2 quantum is disabled for FCFS.
- **Demote on quantum expiry**: enabled moves unfinished Q0→Q1→Q2; disabled requeues at the same level. Q2 stays at Q2.
- **Priority preemption**: a new Q0 arrival can preempt a currently running lower-priority process.
- Live Gantt playback with play/pause, restart, one-unit step, and 0.5×/1×/2×/4× playback speed.

The schedule is computed deterministically first; playback reveals its Gantt intervals over time. Final metrics remain calculated by the scheduler and averages include completed processes only.

## Queue policy summary

| Queue | Priority | Policy |
|---|---|---|
| Q0 | Highest | Round Robin; quantum configurable |
| Q1 | Medium | Round Robin; quantum configurable |
| Q2 | Lowest | FCFS or Round Robin; quantum used only for RR |
