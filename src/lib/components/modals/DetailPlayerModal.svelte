<script lang="ts">
  import type { Player } from '$lib/types';
  import { PencilSimpleIcon, TrashIcon, XIcon, DotsThreeOutlineVerticalIcon } from 'phosphor-svelte';
  import EditPlayerModal from './EditPlayerModal.svelte';

  let {
    player = null,
    open = false,
    zIndex = 0,
    players = [] as Player[],
    tableId = null,
    close,
    saved,
    deleted
  } = $props() 

  
  let editPlayerModalOpen = $state(false);
  let selectedPlayer: Player | null = $state(null);

  function openEditPlayer() {
    selectedPlayer = player;
    editPlayerModalOpen = true;
  }
  function closeEditPlayer() {
    editPlayerModalOpen = false;
    selectedPlayer = null;
  }

  const handleDialogClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) close();
  };

  const handleCancel = () => {
    close();
  };

  const handleDeletePlayer = () => {
    deleted(player);
  };

  const handlePlayerSaved = (event: any) => {
    saved(event);
    closeEditPlayer();
  };

</script>

{#if open && player}
  <dialog
    class="modal modal-open"
    style={`z-index:${zIndex}`}
    open
    onclick={handleDialogClick}
    oncancel={handleCancel}
  >
    <div class="modal-box space-y-2">
      <div class="flex items-center justify-between rounded-box bg-base-200 px-3 py-2">
        <h3 class="card-title">{player.name}</h3>
        <div class="flex items-center gap-1">
          <div class="dropdown dropdown-end">
            <button class="btn btn-ghost btn-sm" aria-label="Azioni giocatore">
              <DotsThreeOutlineVerticalIcon size={18} weight="fill" aria-hidden="true" />
            </button>
            <ul class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-44 z-50">
              <li>
                <button type="button" onclick={openEditPlayer} aria-label="Modifica giocatore">
                  <PencilSimpleIcon size={16} weight="bold" aria-hidden="true" />
                  Modifica
                </button>
              </li>
              <li>
                <button
                  type="button"
                  class="text-error"
                  onclick={handleDeletePlayer}
                  aria-label="Elimina giocatore"
                >
                  <TrashIcon size={16} weight="bold" aria-hidden="true" />
                  Elimina
                </button>
              </li>
            </ul>
          </div>
          <button
            class="btn btn-sm btn-ghost"
            aria-label="Chiudi dettagli"
            onclick={close}
          >
            <XIcon size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div class="space-y-1 px-3 py-1">
        <div class="flex items-center gap-2 text-xs">
          <span class="font-semibold">ID:</span>
          <span class="break-all">{player.id}</span>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="font-semibold">Ruolo:</span>
          <span
            >{player.isTeacher
              ? 'Spiegatore'
              : player.isBeginner
                ? 'Principiante'
                : 'Esperto'}</span
          >
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="font-semibold">Richiede spiegazione?</span>
          <span>{player.isBeginner ? 'Sì' : 'No'}</span>
        </div>
      </div>
      <div class="card-actions items-center justify-center"></div>
    </div>
  </dialog>
{/if}

{#if editPlayerModalOpen && selectedPlayer}
  <EditPlayerModal
    bind:player={selectedPlayer}
    open={editPlayerModalOpen}
    zIndex={zIndex + 1}
    players={players}
    tableId={tableId}
    honeypotName=""
    close={closeEditPlayer}
    saved={handlePlayerSaved}
  />
{/if}
