<script lang="ts">
  import type { Table } from '$lib/types';
  import {
    PencilSimpleIcon,
    TrashIcon,
    UserPlusIcon,
    XIcon,
    ConfettiIcon,
    FeatherIcon,
    PuzzlePieceIcon,
    SkullIcon,
    GraduationCapIcon,
    DotsThreeOutlineVerticalIcon
  } from 'phosphor-svelte';
  import { getPlayerBadgeStyle } from '$lib/utils/player';
  import type { Player } from '$lib/types';
  let {
    table = null,
    baseZIndex = 0,
    onAddPlayer,
    onSavePlayer = () => {},
    onDeleteTable,
    onEditTable,
    onExpandTable,
    onDeletePlayer,
    onOpenDetailPlayer
  } = $props();

  const handleExpandTable = () => {
    onExpandTable(table);
  };

  const handleEditTable = () => {
    onEditTable(table, baseZIndex);
  };

  const handleDeleteTable = () => {
    onDeleteTable(table, baseZIndex);
  };

  const handleAddPlayer = () => {
    onAddPlayer(table);
  };

  const handleOpenDetailPlayer = (player: Player) => {
    onOpenDetailPlayer(table.id, player);
  };
</script>

<article
  class="card card-border border border-base-300 bg-base-100 transition hover:shadow-lg"
>
  <div class="card-body gap-3">
    <div class="flex items-center justify-between gap-2 min-w-0">
      <button
        type="button"
        class="card-title flex-1 min-w-0 text-left break-words hover:underline focus:underline focus-visible:outline-none focus-visible:ring"
        aria-label={`Apri dettagli ${table.title}`}
        onclick={handleExpandTable}
      >
        {#if table.weight === 'Party'}
          <ConfettiIcon
            size={20}
            weight="fill"
            class="inline-block align-middle text-warning mr-1"
          />
        {:else if table.weight === 'Leggero (max 45 min)'}
          <FeatherIcon size={20} weight="fill" class="inline-block align-middle text-info mr-1" />
        {:else if table.weight === 'Medio (1-2h)'}
          <PuzzlePieceIcon
            size={20}
            weight="fill"
            class="inline-block align-middle text-success mr-1"
          />
        {:else if table.weight === 'Estremo (>2h)'}
          <SkullIcon size={20} weight="fill" class="inline-block align-middle text-error mr-1" />
        {/if}
        {table.title}
      </button>
      <div class="flex items-center gap-2">
        <span
          class={`badge ${table.players.length > table.seats ? 'badge-warning' : 'badge-primary'} badge-soft shrink-0`}
        >
          {table.players.length}/{table.seats}
        </span>
        <div class="dropdown dropdown-end dropdown-hover">
          <button class="btn btn-sm btn-ghost" tabindex="0" aria-label="Azioni tavolo">
            <DotsThreeOutlineVerticalIcon size={18} weight="bold" aria-hidden="true" />
          </button>
          <ul class="dropdown-content menu bg-base-200 rounded-box z-50 p-2 shadow">
            <li>
              <button onclick={handleEditTable} class="btn btn-ghost hover:bg-base-300 focus:bg-base-300 focus-visible:outline-none focus-visible:ring">
                <PencilSimpleIcon size={16} weight="bold" aria-hidden="true" />
                Modifica
              </button>
            </li>
            <li>
              <button onclick={handleDeleteTable} class="text-error hover:bg-error hover:text-error-content">
                <TrashIcon size={16} weight="bold" aria-hidden="true" />
                Elimina
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      {#if table.players.length === 0}
        <span class="badge badge-outline">Tavolo vuoto :(</span>
      {:else}
        {#each [...table.players].sort((a, b) => (b.isTeacher ? 1 : 0) - (a.isTeacher ? 1 : 0)) as player}
          {@const playerBadge = getPlayerBadgeStyle(player.isBeginner, player.isTeacher)}
          <button
            type="button"
            class={`${player.isTeacher ? 'badge badge-accent' : playerBadge.className} gap-1 max-w-full break-words hover:badge-outline focus-visible:outline-none focus-visible:ring flex items-center`}
            title={player.isTeacher ? 'Spiegatore' : player.isBeginner ? 'Principiante' : 'Esperto'}
            aria-label={`Dettagli ${player.name}`}
            onclick={() => handleOpenDetailPlayer(player)}
          >
            <playerBadge.Icon size={14} weight="fill" aria-hidden="true" />
            <span class="inline-flex items-center gap-1">
              {player.name}
            </span>
          </button>
        {/each}
      {/if}
      <button
        class="btn btn-md btn-primary btn-circle"
        aria-label="Aggiungi player"
        onclick={handleAddPlayer}
      >
        <UserPlusIcon size={22} weight="bold" aria-hidden="true" />
      </button>
    </div>
  </div>
</article>
