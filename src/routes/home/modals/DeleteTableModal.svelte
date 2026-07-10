<script lang="ts">
  import { enhance } from '$app/forms';

  let { 
    open = false,
    zIndex = 0,
    honeypotName,
    table = null,
    close,
    deleted
  } = $props() 

  let errorMsg = $state('');

  $effect(() => {
    if (open) errorMsg = '';
  });

  const enhanceHandler = () => {
    return async ({ result, update }: any) => {
      errorMsg = '';
      // result can be undefined for redirects or non-JSON responses; handle defensively
      if (result == null) {
        close();
        return;
      }

      if (result.type === 'success') {
        const data = result.data as any;
        if (data?.tableId) {
          deleted(data.tableId);
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

{#if open && table}
  <div class="modal modal-open items-start sm:items-center" style={`z-index:${zIndex}`}>
    <div class="modal-box">
      <h3 class="card-title">Elimina tavolo</h3>
      <p>Sei sicuro di eliminare il tavolo "{table.title}"?</p>
      <form method="POST" action="?/deleteTable" use:enhance={enhanceHandler}>
        {#if errorMsg}
          <div class="alert alert-error alert-soft mt-2">
            <span>{errorMsg}</span>
          </div>
        {/if}
        <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
        <input type="hidden" name="tableId" value={table.id} />
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" onclick={close}>Annulla</button>
          <button class="btn btn-error" type="submit">Elimina</button>
        </div>
      </form>
    </div>
  </div>
{/if}
