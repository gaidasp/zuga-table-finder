<script lang="ts">
  import { enhance } from '$app/forms';

  // use $props() in runes mode instead of export let
  let {
    open = false,
    zIndex = 0,
    honeypotName,
    player = null,
    close,
    deleted
  } = $props() 
  let errorMsg = $state('');

  const enhanceHandler = ({
    update
  }: {
    update?: (opts?: { reset?: boolean }) => Promise<void>;
  }) => {
    return async ({ result }: any) => {
      // result can be undefined for redirects or non-JSON responses; handle defensively
      if (result == null) {
        close();
        return;
      }

      if (result.type === 'success') {
        const data = result.data as any;
        if (data?.table) {
          deleted(data.table);
        }
        close();
        return;
      }
      
      if (result.type === 'failure') {
        const data = result.data as any;
        errorMsg = data?.message || 'Errore sconosciuto';
        await update?.({ reset: false });
        return;
      }
      // failure: just close
      close();
    };
  };
</script>

{#if open && player}
  <div class="modal modal-open items-start sm:items-center" style={`z-index:${zIndex}`}>
    <div class="modal-box">
      <h3 class="card-title">Rimuovi giocatore</h3>
      <p>Vuoi rimuovere <b>{player.playerName}</b> da questo tavolo?</p>
      <form
        method="POST"
        action="?/deletePlayer"
        use:enhance={enhanceHandler}
      >
        <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
        <input type="hidden" name="tableId" value={player.tableId} />
        <input type="hidden" name="playerId" value={player.playerId} />
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" onclick={() => close()}>Annulla</button>
          <button class="btn btn-error" type="submit">Rimuovi</button>
        </div>
      </form>
    </div>
  </div>
{/if}
