<script lang="ts">
  import { enhance } from '$app/forms';
  import { ConfettiIcon, FeatherIcon, PuzzlePieceIcon, SkullIcon, XIcon  } from 'phosphor-svelte';
  import type { GameWeight } from '$lib/types';

  let {
    open = false,
    zIndex = 0,
    honeypotName = "",
    weights=[] as GameWeight[],
    nightDate=null,
    close,
    added
  } = $props()


  let defaultWeight: GameWeight = $state('Medio (1-2h)');
  let errorMsg: string | null = $state('');
  $effect(() => {
    if (open) errorMsg = '';
  });

  function enhanceHandler({ update }: { update?: (opts?: { reset?: boolean }) => Promise<void> }) {
    return async ({ result }: any) => {
      errorMsg = '';
      if (!result) return;
      if (result.type === 'success') {
        const sparePlayer = result.data.sparePlayer as any;
        added(sparePlayer);
        close();
        await update?.({ reset: false });
        return;
      }

      if (result.type === 'failure') {
        const data = result.data as any;
        //close();
        // Optionally set an error message state here to display in the UI
        errorMsg = data?.message ?? 'Errore durante l\'aggiunta del giocatore in lista.';
        await update?.({ reset: false });
        return;
      }
      // redirect/error/Response: close modal so UI stays in sync
      close();
      await update?.({ reset: false });
    };
  }
</script>

{#if open}
  <dialog
    class="modal modal-open"
    style={`z-index:${zIndex}`}
    tabindex="-1"
    aria-modal="true"
    onclick={(e) => { if (e.target === e.currentTarget) close(); }}
    onkeydown={(e) => { if (e.key === 'Escape') close(); }}
  >
    <div class="modal-box">
      <button class="btn btn-sm btn-ghost absolute right-2 top-2 z-10" aria-label="Chiudi" onclick={close}>
        <XIcon size={18} weight="bold" aria-hidden="true" />
      </button>
      <h3 class="card-title">Aggiungi giocatore in lista</h3>
      <form method="POST" action="?/joinCategory" use:enhance={enhanceHandler}>
        <div class="card-body">
          <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
          <input type="hidden" name="nightDate" value={nightDate} />
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="spare-player-name">Il tuo nome</label>
            <input id="spare-player-name" name="name" required placeholder="Marta" class="input" />
            {#if errorMsg}
              <div class="alert alert-error alert-soft mb-2 text-sm">{errorMsg}</div>
            {/if}
          </div>
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="spare-player-weight">Peso preferito</label>
            <select id="spare-player-weight" name="weight" class="select" required bind:value={defaultWeight}>
              {#each weights as weight}
                <option value={weight}>
                  {#if weight === 'Party'}
                    <span class="inline-flex items-center gap-1"><ConfettiIcon size={20} weight="fill" class="inline-block align-middle text-warning" /> Party</span>
                  {:else if weight === 'Leggero (max 45 min)'}
                    <span class="inline-flex items-center gap-1"><FeatherIcon size={20} weight="fill" class="inline-block align-middle text-info" /> Leggero (max 45 min)</span>
                  {:else if weight === 'Medio (1-2h)'}
                    <span class="inline-flex items-center gap-1"><PuzzlePieceIcon size={20} weight="fill" class="inline-block align-middle text-success" /> Medio (1-2h)</span>
                  {:else if weight === 'Estremo (>2h)'}
                    <span class="inline-flex items-center gap-1"><SkullIcon size={20} weight="fill" class="inline-block align-middle text-error" /> Estremo (&gt;2h)</span>
                  {:else}
                    {weight}
                  {/if}
                </option>
              {/each}
            </select>
          </div>
          <div class="modal-action">
            <button type="button" class="btn btn-ghost" onclick={close}>Annulla</button>
            <button class="btn btn-success" type="submit">Aggiungi</button>
          </div>
        </div>
      </form>
    </div>
  </dialog>
{/if}
