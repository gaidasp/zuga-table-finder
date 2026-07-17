<script lang="ts">
  import { enhance } from '$app/forms';
  import type { GameWeight, SparePlayer } from '$lib/types';

  let {
    open = false,
    zIndex = 0,
    honeypotName = '',
    sparePlayer = null as SparePlayer | null,
    weights = [] as GameWeight[],
    close,
    saved
  } = $props();

  let name = $state('');
  let weight = $state<GameWeight>('Medio (1-2h)');
  let errorMsg = $state('');

  $effect(() => {
    if (!open || !sparePlayer) return;
    name = sparePlayer.name;
    weight = sparePlayer.weight;
    errorMsg = '';
  });

  const enhanceHandler = () => {
    return async ({ result, update }: any) => {
      if (!result) return;

      if (result.type === 'success') {
        const data = result.data as any;
        saved(data?.sparePlayer ?? null);
        close();
        await update?.({ reset: false });
        return;
      }

      if (result.type === 'failure') {
        const data = result.data as any;
        errorMsg = data?.message ?? 'Errore durante la modifica del giocatore in lista.';
        await update?.({ reset: false });
        return;
      }

      close();
      await update?.({ reset: false });
    };
  };
</script>

{#if open && sparePlayer}
  <dialog
    class="modal modal-open items-start sm:items-center"
    style={`z-index:${zIndex}`}
    onclick={(e) => {
      if (e.target === e.currentTarget) close();
    }}
  >
    <div class="modal-box max-w-lg">
      <h3 class="text-lg font-semibold">Modifica giocatore in lista</h3>

      <form method="POST" action="?/updateSparePlayer" use:enhance={enhanceHandler} class="space-y-3 mt-4">
        <input type="text" name={honeypotName} class="hidden" tabindex="-1" autocomplete="off" />
        <input type="hidden" name="id" value={sparePlayer.id} />

        <label class="form-control w-full">
          <span class="label-text mb-1">Nome</span>
          <input
            type="text"
            name="name"
            class="input input-bordered w-full"
            bind:value={name}
            required
            maxlength="48"
          />
        </label>

        <label class="form-control w-full">
          <span class="label-text mb-1">Peso preferito</span>
          <select name="weight" class="select select-bordered w-full" bind:value={weight} required>
            {#each weights as currentWeight}
              <option value={currentWeight}>{currentWeight}</option>
            {/each}
          </select>
        </label>

        {#if errorMsg}
          <p class="text-sm text-error">{errorMsg}</p>
        {/if}

        <div class="modal-action mt-3">
          <button type="button" class="btn btn-ghost" onclick={close}>Annulla</button>
          <button type="submit" class="btn btn-primary">Salva</button>
        </div>
      </form>
    </div>
    <button type="button" class="modal-backdrop" aria-label="Chiudi" onclick={close}></button>
  </dialog>
{/if}
