import { useState } from 'react';
import { SimulationContext } from './SimulationContext.js';

export function SimulationProvider({ children }) {
  const [simulationResult, setSimulationResult] = useState(null);
  const [fixedResult, setFixedResult] = useState(null);
  const [randomResult, setRandomResult] = useState(null);
  const [config, setConfig] = useState({
    count: 5,
    duration: 50,
    minArrival: 0,
    maxArrival: 10,
    burstMode: 'random',
    fixedBurst: 5,
    minBurst: 2,
    maxBurst: 10,
    timeQuantum: 3,
  });

  function clearSimulation() {
    setSimulationResult(null);
    setFixedResult(null);
    setRandomResult(null);
  }

  const value = {
    simulationResult,
    setSimulationResult,
    fixedResult,
    setFixedResult,
    randomResult,
    setRandomResult,
    config,
    setConfig,
    clearSimulation,
    timeQuantum: 3,
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}
