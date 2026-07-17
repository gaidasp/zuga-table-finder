<script lang="ts">
  import type { AuthUser, Player } from '$lib/types';
  import { PencilSimpleIcon, XIcon } from 'phosphor-svelte';
  import EditPlayerModal from './EditPlayerModal.svelte';

  class EditPlayerModalState {
    isOpen = $state(false);
    player: Player | null = $state(null);

    open = (player: Player) => {
      this.player = player;
      this.isOpen = true;
    };

    close = () => {
      this.isOpen = false;
      this.player = null;
    };
  }

  let {
    player = null,
    open = false,
    zIndex = 0,
    canMutate = false,
    authUser = null as AuthUser | null,
    players = [] as Player[],
    tableId = null,
    close,
    saved,
    deleted
  } = $props()

  const editModal = new EditPlayerModalState();

  const handleDialogClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) close();
  };

  const handleCancel = () => {
    close();
  };

  const handleDeletePlayer = () => {
    editModal.close();
    close();
    deleted(player);
  };

  const handlePlayerSaved = (event: any) => {
    saved(event);
    editModal.close();
  };

  const canManagePlayer = $derived.by(() =>
    Boolean(
      canMutate &&
        player &&
        authUser?.id &&
        (
          authUser.isAdmin ||
          (player.userId ? authUser.id === player.userId : false) ||
          (player.ownerUserId ? authUser.id === player.ownerUserId : false)
        )
    )
  );

</script>

{#if open && player}
  <dialog class="modal modal-open items-start sm:items-center" style={`z-index:${zIndex}`} onclick={handleDialogClick}>
    <div class="card bg-base-100 card-border border-base-300 overflow-hidden mx-4" style="width: calc(100% - 4rem); max-width: 42rem;">
      <div class="border-base-300 border-b border-dashed">
        <div class="flex items-center justify-between gap-2 p-4">
          <h3 class="card-title text-base px-2">{player.name}</h3>
          <div class="flex items-center gap-1 shrink-0">
            {#if canManagePlayer}
              <button
                class="btn btn-sm btn-ghost"
                aria-label="Modifica giocatore"
                onclick={() => editModal.open(player)}
                type="button"
              >
                <PencilSimpleIcon size={18} weight="bold" aria-hidden="true" />
              </button>
            {/if}
            <button
              class="btn btn-sm btn-ghost"
              aria-label="Chiudi dettagli"
              onclick={close}
              type="button"
            >
              <XIcon size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>
      <div class="card-body gap-4 pt-4">
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
    </div>
    <button type="button" class="modal-backdrop" onclick={close} aria-label="Chiudi"></button>
  </dialog>
{/if}

{#if canManagePlayer && editModal.isOpen && editModal.player}
  <EditPlayerModal
    bind:player={editModal.player}
    open={editModal.isOpen}
    zIndex={zIndex + 1}
    players={players}
    tableId={tableId}
    honeypotName=""
    close={editModal.close}
    saved={handlePlayerSaved}
    onDelete={handleDeletePlayer}
  />
{/if}
