import { useContext } from 'react';
import { SimulationContext } from './SimulationContext.js';

export function useSimulation() {
  return useContext(SimulationContext);
}
