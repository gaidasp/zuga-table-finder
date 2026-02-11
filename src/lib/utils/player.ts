import { Fire, Leaf, GraduationCap } from 'phosphor-svelte';
import type { ComponentType } from 'svelte';

export interface PlayerBadgeStyle {
  className: string;
  Icon: ComponentType;
  label: string;
}

/**
 * Returns the appropriate badge styling based on player's experience level
 * @param isBeginner - Whether the player is a beginner
 * @param isTeacher - Whether the player can teach/explain games
 * @returns Badge styling configuration with CSS class, icon, and label
 */
export function getPlayerBadgeStyle(isBeginner: boolean, isTeacher?: boolean): PlayerBadgeStyle {
  if (isTeacher) {
    return { className: 'badge badge-accent', Icon: GraduationCap, label: 'Spiegatore' };
  }
  return isBeginner
    ? { className: 'badge badge-success', Icon: Leaf, label: 'Principiante' }
    : { className: 'badge badge-error', Icon: Fire, label: 'Esperto' };
}
