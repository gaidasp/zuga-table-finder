import type { GameWeight } from '$lib/types';

const WEIGHT_COLOR_VAR_BY_WEIGHT: Record<GameWeight, string> = {
  Party: '--game-weight-party-color',
  'Leggero (max 45 min)': '--game-weight-light-color',
  'Medio (1-2h)': '--game-weight-medium-color',
  'Estremo (>2h)': '--game-weight-extreme-color'
};

export const getGameWeightColorVar = (weight: GameWeight) => WEIGHT_COLOR_VAR_BY_WEIGHT[weight];

export const getGameWeightColorStyle = (weight: GameWeight) =>
  `color: var(${getGameWeightColorVar(weight)});`;
