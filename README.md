
<div align="center">

# ⚡ ROUNDROBIN

### Interactive CPU Scheduling & Multilevel Feedback Queue Simulator

**Visualize. Simulate. Understand.**

An interactive Operating Systems project that brings CPU scheduling algorithms to life through animated execution timelines, dynamic ready queues and real-time performance analysis.

<br/>

<a href="https://roundrobin-cpu-scheduling-simulator.vercel.app/">
  <img src="https://img.shields.io/badge/🚀_LIVE_DEMO-Visit_Application-B7F36B?style=for-the-badge&labelColor=17221D" />
</a>
<a href="https://github.com/Yeshwanthnuvvula/roundrobin-cpu-scheduling-simulator">
  <img src="https://img.shields.io/badge/GITHUB-Repository-181717?style=for-the-badge&logo=github&logoColor=white" />
</a>

<br/><br/>

<img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" />
<img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/CSS-1572B6?style=flat-square&logo=css3&logoColor=white" />
<img src="https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel" />

<br/><br/>

</div>

---

## 🧠 About The Project

CPU scheduling is one of the fundamental responsibilities of an Operating System. It determines which process gets access to the CPU, when it executes, and how long it can run.

**ROUNDROBIN** is an interactive CPU scheduling simulator designed to demonstrate the working of:

- Round Robin (RR) Scheduling
- Multilevel Feedback Queue (MLFQ) Scheduling

Rather than simply displaying a final scheduling result, the simulator provides a visual representation of CPU execution, allowing users to observe process execution, queue transitions, priority changes and scheduling behaviour.

The goal is to make Operating Systems concepts easier to understand through practical simulation.

## ✨ Features

<table>
<tr>
<td width="50%">

### ⚙️ Process Management

- Manual process creation
- Custom arrival times
- Individual CPU burst times
- Fixed and randomized generation
- Process state tracking

</td>
<td width="50%">

### 🔄 MLFQ Scheduling

- Three priority-based queues
- Configurable queue policies
- Round Robin scheduling
- Process demotion
- Queue priority management

</td>
</tr>
<tr>
<td width="50%">

### 📊 Execution Visualization

- Animated Gantt chart
- Continuous CPU timeline
- Queue-level identification
- Process execution tracking
- CPU idle-time visualization

</td>
<td width="50%">

### 📈 Performance Analysis

- Average waiting time
- Average turnaround time
- CPU utilization
- Completed process statistics
- Individual process metrics

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ Starvation Prevention

- Aging mechanism
- Priority boosting
- Process priority promotion
- Improved scheduling fairness

</td>
<td width="50%">

### 🎮 Interactive Simulation

- Configurable simulation settings
- Visual queue transitions
- Execution progress
- Process monitoring
- Scheduling behaviour analysis

</td>
</tr>
</table>

---

## 🔬 Scheduling Algorithms & Concepts

### 1. Round Robin (RR)

Round Robin is a preemptive CPU scheduling algorithm in which each process receives a fixed amount of CPU time called a **Time Quantum**.

If a process does not finish within its allocated time quantum, it is preempted and returned to the ready queue according to the scheduling policy.

### 2. Multilevel Feedback Queue (MLFQ)

MLFQ uses multiple ready queues with different priority levels.

This project demonstrates three priority levels:

| Queue | Priority | Description |
|:---:|:---:|---|
| Q0 | 🔴 Highest | First-level ready queue |
| Q1 | 🟡 Medium | Second-level ready queue |
| Q2 | 🔵 Lowest | Third-level ready queue |

Processes can move between queues depending on their CPU usage and the configured scheduling policies.

### 3. Aging

Aging is a technique used to prevent starvation.

A process waiting for an extended period can have its priority increased, allowing it to receive CPU time sooner.

### 4. Priority Boosting

Priority boosting periodically promotes unfinished processes to a higher-priority queue, helping prevent processes in lower-priority queues from waiting indefinitely.

---

## 📐 Performance Metrics

The simulator evaluates scheduling performance using standard Operating Systems metrics.

| Metric | Formula |
|---|---|
| Turnaround Time | Completion Time − Arrival Time |
| Waiting Time | Turnaround Time − Burst Time |
| Average Waiting Time | Total Waiting Time / Completed Processes |
| Average Turnaround Time | Total Turnaround Time / Completed Processes |
| CPU Utilization | (CPU Busy Time / Total Simulated Time) × 100 |

> **Note:** Average waiting time and average turnaround time are calculated using completed processes only.

---

## 🛠️ Tech Stack

<div align="center">

| Technology | Purpose |
|---|---|
| ⚛️ React.js | Interactive user interface |
| 🟨 JavaScript | Scheduling algorithms and simulation logic |
| ⚡ Vite | Development environment and build tool |
| 🎨 CSS | Styling, layouts and animations |
| 🐙 Git & GitHub | Version control and source code management |
| ▲ Vercel | Application hosting and deployment |

</div>

---

## 🚀 Getting Started

Want to run the simulator locally? Follow these steps.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- [Git](https://git-scm.com/)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Yeshwanthnuvvula/roundrobin-cpu-scheduling-simulator.git
```

**2. Navigate to the project directory**

```bash
cd roundrobin-cpu-scheduling-simulator
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

**5. Open in your browser**

```text
http://localhost:5173
```

---

## 📁 Project Structure

```text
roundrobin-simulator/
│
├── public/
│
├── src/
│   ├── assets/
│   │
│   ├── components/
│   │   ├── GanttChart.jsx
│   │   ├── Header.jsx
│   │   ├── QueuePanel.jsx
│   │   ├── Sidebar.jsx
│   │   └── StatCard.jsx
│   │
│   ├── context/
│   │   ├── SimulationContext.js
│   │   ├── SimulationProvider.jsx
│   │   └── useSimulation.js
│   │
│   ├── engine/
│   │   ├── processGenerator.js
│   │   └── scheduler.js
│   │
│   ├── pages/
│   │   ├── Analytics.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Execution.jsx
│   │   └── Processes.jsx
│   │
│   ├── styles/
│   │   └── themes.css
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── Simulator.jsx
│   ├── Simulator.css
│   ├── index.css
│   └── main.jsx
│
├── index.html
├── package.json
└── vite.config.js
```

---

## 🎯 Project Objectives

- Understand CPU scheduling and process management.
- Demonstrate Round Robin scheduling.
- Implement Multilevel Feedback Queue scheduling.
- Visualize process execution and ready queue transitions.
- Understand starvation and starvation-prevention techniques.
- Evaluate scheduling performance using standard metrics.

## 🔮 Future Scope

- Additional CPU scheduling algorithms.
- More configurable scheduling policies.
- Comparative analysis of scheduling algorithms.
- Exportable simulation reports.
- Enhanced performance visualization.

---

## 👨‍💻 Contributors

**Developed as an academic Operating Systems project by a team of six students.**

---

<div align="center">

### ⭐ If you find this project interesting, consider starring the repository!

**Built to make Operating Systems concepts visual, interactive and easier to understand.**

<br/>

`ROUNDROBIN` • CPU Scheduling Simulator • Operating Systems

</div>
