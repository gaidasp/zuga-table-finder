<script lang="ts">
  import type { AuthUser, Table, Player } from '$lib/types';
  import {
    PencilSimpleIcon,
    TrashIcon,
    XIcon,
    UserPlusIcon,
    ShareNetworkIcon
  } from 'phosphor-svelte';
  import { getPlayerBadgeStyle } from '$lib/utils/player';
  let {
    open = false,
    zIndex = 0,
    canMutate = false,
    authUser = null as AuthUser | null,
    table = null,
    close,
    onAddPlayer,
    onDeleteTable,
    onEditTable,
    onDeletePlayer,
    onOpenDetailPlayer
  } = $props();

  const handleDialogClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) close();
  };

  const handleCancel = () => {
    close();
  };

  const handleClose = () => {
    close();
  };

  const handleEditTable = () => {
    onEditTable(table, zIndex);
  };

  const handleDeleteTable = () => {
    onDeleteTable(table, zIndex);
  };

  const handleDeletePlayerButton = (player: Player) => {
    onDeletePlayer(table.id, player.id, player.name);
  };

  const handleAddPlayer = () => {
    onAddPlayer(table);
  };

  const handleOpenDetailPlayer = (player: Player) => {
    onOpenDetailPlayer(table.id, player);
  };

  let shareFeedback = $state('');

  const handleShareTable = async () => {
    if (!table) return;

    const sharedUrl = `${window.location.origin}/?nightDate=${encodeURIComponent(table.nightDate)}&tableId=${encodeURIComponent(table.id)}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(sharedUrl);
      } else {
        const tempInput = document.createElement('textarea');
        tempInput.value = sharedUrl;
        tempInput.setAttribute('readonly', '');
        tempInput.style.position = 'absolute';
        tempInput.style.left = '-9999px';
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      shareFeedback = 'Link copiato';
    } catch {
      shareFeedback = 'Impossibile copiare il link';
    }

    setTimeout(() => {
      shareFeedback = '';
    }, 1500);
  };

  const canManageTable = $derived.by(() =>
    Boolean(
      canMutate &&
        authUser?.id &&
        (authUser.isAdmin || (table?.creatorUserId ? authUser.id === table.creatorUserId : false))
    )
  );

  const canDeletePlayer = (player: Player) =>
    Boolean(
      canMutate &&
        authUser?.id &&
        (
          authUser.isAdmin ||
          (player.userId ? authUser.id === player.userId : false) ||
          (player.ownerUserId ? authUser.id === player.ownerUserId : false)
        )
    );
</script>

{#if open && table}
  <dialog class="modal modal-open items-start sm:items-center" style={`z-index:${zIndex}`} onclick={handleDialogClick}>
    <div
      class="card bg-base-100 card-border border-base-300 overflow-hidden mx-4"
      style="width: calc(100% - 4rem); max-width: 42rem;"
    >
      <div class="border-base-300 border-b border-dashed">
        <div class="flex items-center justify-between gap-2 p-4">
          <h3 class="card-title text-base px-2 truncate" style="max-width: 14ch;">{table.title}</h3>
          <div class="flex items-center gap-1 shrink-0">
            <button
              class="btn btn-sm btn-ghost"
              aria-label="Condividi tavolo"
              onclick={handleShareTable}
              type="button"
              title="Copia link tavolo"
            >
              <ShareNetworkIcon size={18} weight="bold" aria-hidden="true" />
            </button>
            {#if canManageTable}
              <button
                class="btn btn-sm btn-ghost"
                aria-label="Modifica tavolo"
                onclick={handleEditTable}
                type="button"
              >
                <PencilSimpleIcon size={18} weight="bold" aria-hidden="true" />
              </button>
            {/if}
            <button
              class="btn btn-sm btn-ghost"
              aria-label="Chiudi dettagli"
              onclick={handleClose}
              type="button"
            >
              <XIcon size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div class="card-body gap-2 pt-4">
          {#if shareFeedback}
            <div class="alert alert-info py-2 text-xs">
              <span>{shareFeedback}</span>
            </div>
          {/if}
          <p class="text-sm w-full italic whitespace-pre-wrap break-words">
            {table.description || 'Nessuna descrizione.'}
          </p>
          <div class="flex items-center justify-center gap-2 text-xs">
            <span class="font-semibold">Peso:</span>
            <span class="">{table.weight}</span>
          </div>
          <div class="flex items-center justify-center gap-2 text-xs">
            <span class="font-semibold">Giocatori:</span>
            <span class="">{table.players.length}/{table.seats}</span>
          </div>
          <div class="flex items-center justify-center gap-2 text-xs">
            <span class="font-semibold">Aggiornato il:</span>
            <span class="">
              {new Date(table.createdAt).toLocaleString('it-IT', {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </span>
          </div>

          {#if table.bggGame}
            <div class="flex items-center justify-center gap-2 text-xs">
              <span class="font-semibold">Link BGG:</span>
              <a
                href={table.bggGame.url}
                target="_blank"
                rel="noopener noreferrer"
                class="link link-primary truncate"
                style="max-width: 18ch;"
              >
                {table.bggGame.name}
              </a>
            </div>
          {/if}

          <div class="divider my-0"></div>
          {#if table.players.length === 0}
            <div>
              <span class="badge badge-outline">Tavolo vuoto: invita qualcuno!</span>
            </div>
          {:else}
            <div>
              <table class="table table-sm w-full ">
                <tbody>
                  {#each [...table.players].sort((a, b) => (b.isTeacher ? 1 : 0) - (a.isTeacher ? 1 : 0)) as player}
                    {@const playerBadge = getPlayerBadgeStyle(player.isBeginner, player.isTeacher)}
                    <tr>
                      <td class="text-sm px-2 py-1">
                        <button
                          type="button"
                          class="p-0 m-0 min-h-0 h-auto text-base text-sm hover:underline focus:underline focus-visible:outline-none focus-visible:ring truncate"
                          style="max-width: 14ch;"
                          aria-label={`Dettagli ${player.name}`}
                          onclick={() => handleOpenDetailPlayer(player)}
                        >
                          {player.name}
                        </button>
                      </td>
                      <td class="px-2 py-1 text-sm">
                        <span
                          class={playerBadge.className}
                          title={player.isTeacher
                            ? 'Spiegatore'
                            : player.isBeginner
                              ? 'Principiante'
                              : 'Esperto'}
                        >
                          <playerBadge.Icon size={14} weight="fill" aria-hidden="true" />
                          <span
                            >{player.isTeacher
                              ? 'Spiegatore'
                              : player.isBeginner
                                ? 'Principiante'
                                : 'Esperto'}</span
                          >
                        </span>
                      </td>
                      {#if canDeletePlayer(player)}
                        <td class="text-right px-2 py-1">
                          <button
                            class="btn btn-xs btn-ghost btn-error focus-visible:outline-none focus-visible:ring"
                            aria-label={`Rimuovi ${player.name}`}
                            onclick={() => handleDeletePlayerButton(player)}
                          >
                            <TrashIcon size={16} weight="bold" aria-hidden="true" />
                          </button>
                        </td>
                      {/if}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>

        {#if canManageTable}
          <div class="card-actions items-center justify-between p-2">
            <button
              class="btn btn-md btn-error btn-circle aspect-square hover:scale-120 transition-transform"
              aria-label="Elimina tavolo"
              onclick={handleDeleteTable}
              type="button"
            >
              <TrashIcon size={22} weight="bold" aria-hidden="true" />
            </button>
            <button
              class="btn btn-md btn-primary btn-circle aspect-square hover:scale-120 transition-transform"
              aria-label="Aggiungi player"
              onclick={handleAddPlayer}
              type="button"
            >
              <UserPlusIcon size={22} weight="bold" aria-hidden="true" />
            </button>
          </div>
        {/if}
      </div>
    </div>
    <button type="button" class="modal-backdrop" onclick={close} aria-label="Chiudi"></button>
  </dialog>
{/if}
