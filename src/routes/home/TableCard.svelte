<script lang="ts">
  import type { AuthUser, Table } from '$lib/types';
  import {
    PencilSimpleIcon,
    UserPlusIcon,
    ConfettiIcon,
    FeatherIcon,
    PuzzlePieceIcon,
    SkullIcon,
    GraduationCapIcon
  } from 'phosphor-svelte';
  import { getPlayerBadgeStyle } from '$lib/utils/player';
  import { getAvatarBgClass } from '$lib/utils/avatar';
  import type { Player } from '$lib/types';
  let {
    table = null,
    authUser = null as AuthUser | null,
    baseZIndex = 0,
    canMutate = false,
    onAddPlayer,
    onSavePlayer = () => {},
    onDeleteTable,
    onEditTable,
    onExpandTable,
    onDeletePlayer,
    onOpenDetailPlayer
  } = $props();

  const handleExpandTable = () => {
    onExpandTable(table.id);
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

  const getInitial = (name: string) => {
    const first = name.trim().charAt(0);
    return (first || 'G').toUpperCase();
  };

  const normalizeName = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

  const shouldUseProfilePhoto = (name: string) => {
    if (!authUser?.avatarDataUrl) return false;
    return normalizeName(name) === normalizeName(authUser.nickname);
  };

  const canManageTable = $derived.by(() =>
    Boolean(
      canMutate &&
        authUser?.id &&
        (authUser.isAdmin || (table?.creatorUserId ? authUser.id === table.creatorUserId : false))
    )
  );
</script>

<article class="card bg-base-100 card-border border-base-300 transition hover:shadow-lg w-full">
  <div class="border-base-300 ">
    <div class="flex items-center justify-between gap-0 p-2 px-3 pb-2 w-full">
      <button
        type="button"
        class="card-title text-base flex-1 min-w-0 text-left hover:underline focus:underline focus-visible:outline-none focus-visible:ring flex items-center gap-1"
        aria-label={`Apri dettagli ${table.title}`}
        onclick={handleExpandTable}
      >
        {#if table.weight === 'Party'}
          <ConfettiIcon
            size={20}
            weight="fill"
            class="text-warning pointer-events-none shrink-0"
          />
        {:else if table.weight === 'Leggero (max 45 min)'}
          <FeatherIcon size={20} weight="fill" class="text-info pointer-events-none shrink-0" />
        {:else if table.weight === 'Medio (1-2h)'}
          <PuzzlePieceIcon
            size={20}
            weight="fill"
            class="text-success pointer-events-none shrink-0"
          />
        {:else if table.weight === 'Estremo (>2h)'}
          <SkullIcon size={20} weight="fill" class="text-error pointer-events-none shrink-0" />
        {/if}
        <span class="truncate" style="max-width: 14ch;">{table.title}</span>
      </button>
      <div class="flex items-center gap-0 shrink-0">
        {#if table.bggGame}
          <a
            class="btn btn-sm btn-ghost"
            aria-label={`Vai alla pagina BGG di ${table.bggGame.name}`}
            title={`Vai alla pagina BGG di ${table.bggGame.name}`}
            href={table.bggGame.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <!-- Inlined BGG logo SVG: white fills replaced with currentColor -->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 38" class="h-8 w-8" aria-hidden="true" focusable="false">
              <g fill="none" fill-rule="evenodd">
                <path fill="currentColor" d="M41.6414127,20.8453307 C41.6414127,20.7138507 41.5623149,20.5562773 41.377073,20.5562773 L37.2504649,20.5562773 L37.2504649,24.470024 L41.377073,24.470024 C41.5623149,24.470024 41.6414127,24.338544 41.6414127,24.2073173 L41.6414127,20.8453307 Z M41.6414127,13.911344 C41.6414127,13.779864 41.5623149,13.622544 41.377073,13.622544 L37.2504649,13.622544 L37.2504649,17.2996773 L41.377073,17.2996773 C41.5623149,17.2996773 41.6414127,17.1681973 41.6414127,17.0103707 L41.6414127,13.911344 Z M32.6737649,27.8317573 L32.6737649,10.1032373 L43.6783083,10.1032373 C45.1334524,10.1032373 46.0591517,11.0223307 46.0591517,12.3353573 L46.0591517,16.2754507 C46.0591517,17.483344 45.2656223,18.6390507 43.6257465,19.0332373 C45.2656223,19.4269173 46.1915767,20.530184 46.1915767,21.7122373 L46.1915767,25.5730373 C46.1915767,26.9648507 45.2656223,27.8317573 43.8107333,27.8317573 L32.6737649,27.8317573 Z M57.7535044,16.9530667 L62.7609046,16.9530667 L62.7609046,25.8040267 C62.7609046,26.9597333 61.8619965,27.8263867 60.7242641,27.8263867 L51.7828972,27.8263867 C50.64542,27.8263867 49.7194656,26.9597333 49.7194656,25.8040267 L49.7194656,12.09388 C49.7194656,11.01696 50.64542,10.0978667 51.7828972,10.0978667 L62.7609046,10.0978667 L62.7609046,13.9062267 L54.5602501,13.9062267 C54.4280803,13.9062267 54.2959104,14.0374533 54.2959104,14.19528 L54.2959104,23.7031333 C54.2959104,23.8604533 54.4280803,23.9655867 54.5602501,23.9655867 L58.2640678,23.9655867 C58.4490546,23.9655867 58.5549435,23.8604533 58.5549435,23.7031333 L58.5549435,20.7087333 L56.1478193,20.7087333 L57.7535044,16.9530667 Z M74.3228322,16.9530667 L79.3304876,16.9530667 L79.3304876,25.8040267 C79.3304876,26.9597333 78.4313244,27.8263867 77.2938472,27.8263867 L68.3524802,27.8263867 C67.2147479,27.8263867 66.2890486,26.9597333 66.2890486,25.8040267 L66.2890486,12.09388 C66.2890486,11.01696 67.2147479,10.0978667 68.3524802,10.0978667 L79.3304876,10.0978667 L79.3304876,13.9062267 L71.1298332,13.9062267 C70.9976633,13.9062267 70.8652383,14.0374533 70.8652383,14.19528 L70.8652383,23.7031333 C70.8652383,23.8604533 70.9976633,23.9655867 71.1298332,23.9655867 L74.8333957,23.9655867 C75.0186376,23.9655867 75.1245266,23.8604533 75.1245266,23.7031333 L75.1245266,20.7087333 L72.7171472,20.7087333 L74.3228322,16.9530667 Z"/>
                <polygon fill="#FF5100" points="24.87 7.01 21.107 8.035 24.792 0 .9 8.794 2.206 19.327 0 21.454 6.577 37.93 20.558 32.779 25.418 21.37 23.331 19.358"/>
              </g>
            </svg>
          </a>
        {/if}
        <span
          class={`badge ${table.players.length > table.seats ? 'badge-warning' : 'badge-primary'} badge-soft`}
        >
          {table.players.length}/{table.seats}
        </span>
        
        {#if canManageTable}
          <button
            class="btn btn-sm btn-ghost px-1"
            aria-label="Modifica tavolo"
            onclick={handleEditTable}
            type="button"
          >
            <PencilSimpleIcon size={18} weight="bold" aria-hidden="true" />
          </button>
        {/if}
      </div>
    </div>
  </div>

  <div class="card-body gap-4 pt-2 pb-4">
    <div class="flex flex-wrap items-center gap-2">
      {#if table.players.length === 0}
        <span class="badge badge-outline">Tavolo vuoto :(</span>
      {:else}
        {#each [...table.players].sort((a, b) => (b.isTeacher ? 1 : 0) - (a.isTeacher ? 1 : 0)) as player}
          {@const playerBadge = getPlayerBadgeStyle(player.isBeginner, player.isTeacher)}
          <button
            type="button"
            class={`${player.isTeacher ? 'badge badge-accent' : playerBadge.className} gap-1 hover:badge-outline focus-visible:outline-none focus-visible:ring flex items-center`}
            title={player.isTeacher ? 'Spiegatore' : player.isBeginner ? 'Principiante' : 'Esperto'}
            aria-label={`Dettagli ${player.name}`}
            onclick={() => handleOpenDetailPlayer(player)}
          >
            {#if shouldUseProfilePhoto(player.name)}
              <span class="inline-flex h-4 w-4 shrink-0 overflow-hidden rounded-full aspect-square" aria-hidden="true">
                <img
                  src={authUser?.avatarDataUrl}
                  alt=""
                  class="h-full w-full object-cover object-center"
                />
              </span>
            {:else}
              <span
                class={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full aspect-square text-[10px] font-bold leading-none text-white ${player.avatarColor ?? getAvatarBgClass(player.id || player.name)}`}
                aria-hidden="true"
              >
                {getInitial(player.name)}
              </span>
            {/if}
            <playerBadge.Icon size={14} weight="fill" aria-hidden="true" class="shrink-0" />
            <span class="truncate" style="max-width: 14ch;">
              {player.name}
            </span>
          </button>
        {/each}
      {/if}
      {#if canMutate}
        <button
          class="btn btn-md btn-primary btn-circle aspect-square hover:scale-110 transition-transform"
          aria-label="Aggiungi player"
          onclick={handleAddPlayer}
        >
          <UserPlusIcon size={22} weight="bold" aria-hidden="true" />
        </button>
      {/if}
    </div>
  </div>
</article>
