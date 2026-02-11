<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Player } from '$lib/types';
  import { XIcon } from 'phosphor-svelte';

  let {
    player = $bindable<Player | null>(null),
    open = false,
    zIndex = 0,
    players = [] as Player[],
    tableId = null,
    honeypotName,
    close,
    saved
  } = $props() 

  // get original player object before any edits for comparison in validation
  const originalPlayer = player ? { ...player } : null;
  
  let errorMsg = $state('');
  $effect(() => {
    if (open) errorMsg = '';
  });

  
  const enhanceHandler = ({ update }: { update?: (opts?: { reset?: boolean }) => Promise<void> }) => {
    // put validation here if needed  
    return async ({ result }: any) => {
      if (!result) return;
      if (result.type === 'success') {
        const data = result.data as any;
        if (data?.table) {
          const updatedPlayer = data.table.players?.find((p: Player) => p.id === player.id);
          if (updatedPlayer) {
            saved(updatedPlayer);
          }
          close();
          await update?.({ reset: false });
          return;
        }

        close();
        await update?.({ reset: false });
        return;
      }

      if (result.type === 'failure') {
        const data = result.data as any;
        errorMsg = data?.message ?? 'Errore durante la modifica del giocatore.';
        await update?.({ reset: false });
        return;
      }
    };
  };
  
</script>

{#if open}
  <dialog class="modal modal-open" tabindex="-1" aria-modal="true" style={`z-index:${zIndex}`}>
    <div class="modal-box">
      <div class="flex items-center justify-between px-3 py-2">
        <h3 class="card-title">Modifica un giocatore</h3>
        <button class="btn btn-sm btn-ghost" aria-label="Chiudi dettagli" onclick={close}>
          <XIcon size={18} weight="bold" aria-hidden="true" />
        </button>
      </div>
      <form method="POST" action="?/updatePlayer" use:enhance={enhanceHandler}>
        <div class="card-body">
          {#if honeypotName}
            <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
          {/if}
          <input type="hidden" name="tableId" value={tableId ?? ''} />
          <input type="hidden" name="playerId" value={player.id} />
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="add-player-name">
              <span class="label-text">Nome</span>
            </label>
            <input
              id="add-player-name"
              name="name"
              class="input input-bordered w-full"
              bind:value={player.name}
              maxlength="48"
              required
              aria-invalid={errorMsg ? 'true' : 'false'}
            />
            {#if errorMsg}
              <span class="text-error text-sm">{errorMsg}</span>
            {/if}
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-2" for="add-player-is-beginner">
              <input
                id="add-player-is-beginner"
                name="isBeginner"
                type="checkbox"
                class="checkbox"
                bind:checked={player.isBeginner}
              />
              <span>Richiede spiegazione?</span>
            </label>
          </div>
          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-2" for="add-player-is-teacher">
              <input
                id="add-player-is-teacher"
                name="isTeacher"
                bind:checked={player.isTeacher}
                type="checkbox"
                class="checkbox"
              />
              <span>Spiegatore</span>
            </label>
          </div>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" onclick={close}>Annulla</button>
            <button class="btn btn-success" type="submit">Salva</button>
          </div>
        </div>
      </form>
    </div>
    <div
      class="modal-backdrop"
      role="button"
      tabindex="0"
      aria-label="Chiudi"
      onclick={close}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') close();
      }}
    ></div>
  </dialog>
{/if}
