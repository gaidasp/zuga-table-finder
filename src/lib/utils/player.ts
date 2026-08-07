import { FireIcon, LeafIcon, GraduationCapIcon } from 'phosphor-svelte';
import type { Component } from 'svelte';
import type { IconComponentProps } from 'phosphor-svelte/lib/types';

export interface PlayerBadgeStyle {
  className: string;
  Icon: Component<IconComponentProps>;
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
    return { className: 'badge badge-accent', Icon: GraduationCapIcon, label: 'Spiegatore' };
  }
  return isBeginner
    ? { className: 'badge badge-success', Icon: LeafIcon, label: 'Principiante' }
    : { className: 'badge badge-error', Icon: FireIcon, label: 'Esperto' };
}
