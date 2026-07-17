<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Table, GameWeight, BGGGame } from '$lib/types';
  import { ConfettiIcon, FeatherIcon, PuzzlePieceIcon, SkullIcon, XIcon, TrashIcon } from 'phosphor-svelte';
  import { getGameWeightColorStyle } from '$lib/utils/tableWeight';
  import GameSearchInput from '../GameSearchInput.svelte';


  let {
    open = false,
    zIndex = 0,
    honeypotName = "",
    weights = [] as GameWeight[],
    tableId=  null,
    defaultTitle =  $bindable(),
    defaultDescription = $bindable(),   
    defaultSeats =  $bindable(),
    defaultWeight =  $bindable(),
    defaultBggGame = $bindable<BGGGame | null>(null),
    close,
    saved,
    onDelete
  } = $props() 

  const clampInt = (value: number | undefined, min: number, max: number, fallback: number) => {
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, Math.round(value as number)));
  };

  const getWeightFromBgg = (game: BGGGame): GameWeight => {
    const time = game.playingTime ?? 0;
    const maxPlayers = game.maxPlayers ?? 0;

    if (time > 0 && time <= 45) {
      return maxPlayers >= 6 ? 'Party' : 'Leggero (max 45 min)';
    }

    if (time > 45 && time <= 120) {
      return maxPlayers >= 7 ? 'Party' : 'Medio (1-2h)';
    }

    if (time > 120) return 'Estremo (>2h)';
    if (maxPlayers >= 7) return 'Party';
    if (maxPlayers >= 5) return 'Leggero (max 45 min)';
    return 'Medio (1-2h)';
  };

  const toDefaultDescription = (game: BGGGame) => (game.description ?? '').trim();

  let errorMsg = $state('');
  let lastAutofilledBggId = $state<string | null>(null);

  $effect(() => {
    if (open) errorMsg = '';
    if (open) {
      // Snapshot current table game at open so we don't overwrite existing values immediately.
      lastAutofilledBggId = defaultBggGame?.id ?? null;
    } else {
      lastAutofilledBggId = null;
    }
  });

  $effect(() => {
    if (!open) return;

    const selectedBggId = defaultBggGame?.id ?? null;
    if (!selectedBggId) {
      lastAutofilledBggId = null;
      return;
    }

    if (selectedBggId === lastAutofilledBggId) return;

    defaultWeight = getWeightFromBgg(defaultBggGame as BGGGame);
    defaultDescription = toDefaultDescription(defaultBggGame as BGGGame);
    defaultSeats = clampInt(defaultBggGame?.maxPlayers, 1, 30, 4);
    lastAutofilledBggId = selectedBggId;
  });

  const handleDeleteTable = () => {
    onDelete();
  };

  const enhanceHandler = () => {
    return async ({ result, update }: any) => {
      if (!result) return;

      if (result.type === 'success') {
        const data = result.data as any;
        errorMsg = '';
        const tableData = data?.table ?? data;
        if (tableData) {
          saved(tableData as Table);
        }
        close();
        await update?.({ reset: false });
        return;
      }

      if (result.type === 'failure') {
        const data = result.data as any;
        errorMsg = data?.message ?? 'Errore durante la modifica del tavolo.';
        await update?.({ reset: false });
        return;
      }
    };
  };
</script>

{#if open}
  <dialog class="modal modal-open items-start sm:items-center" style={`z-index:${zIndex}`} onclick={(e) => { if (e.target === e.currentTarget) close(); }}>
    <div class="card bg-base-100 card-border border-base-300 overflow-hidden mx-4" style="width: calc(100% - 4rem); max-width: 42rem;">
      <div class="border-base-300 border-b border-dashed">
        <div class="flex items-center justify-between gap-2 p-4">
          <h3 class="card-title text-base px-2">Modifica tavolo</h3>
          <button class="btn btn-sm btn-ghost shrink-0" aria-label="Chiudi" onclick={close}>
            <XIcon size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
      <form method="POST" action="?/updateTable" use:enhance={enhanceHandler}>
        <div class="card-body gap-4">
          <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
          {#if errorMsg}
            <div class="alert alert-error alert-soft text-sm">
              <span>{errorMsg}</span>
            </div>
          {/if}
          <input type="hidden" name="tableId" value={tableId ?? ''} />
          <GameSearchInput bind:title={defaultTitle} bind:bggGame={defaultBggGame} />
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="edit-table-seats">Posti disponibili (1-30)</label>
            <input
              id="edit-table-seats"
              name="seats"
              type="number"
              min="1"
              max="30"
              class="input"
              bind:value={defaultSeats} />
          </div>

          <div class="form-control flex flex-col gap-1">
            <label class="label" for="edit-table-weight">Peso</label>
            <select id="edit-table-weight" name="weight" class="select" required bind:value={defaultWeight}>
              <option value="" disabled>Scegli il peso</option>
              {#each weights as weight}
                <option value={weight}>
                  {#if weight === 'Party'}
                    <span class="inline-flex items-center gap-1"><ConfettiIcon size={20} weight="fill" class="inline-block align-middle" style={getGameWeightColorStyle(weight)} /> Party</span>
                  {:else if weight === 'Leggero (max 45 min)'}
                    <span class="inline-flex items-center gap-1"><FeatherIcon size={20} weight="fill" class="inline-block align-middle" style={getGameWeightColorStyle(weight)} /> Leggero (max 45 min)</span>
                  {:else if weight === 'Medio (1-2h)'}
                    <span class="inline-flex items-center gap-1"><PuzzlePieceIcon size={20} weight="fill" class="inline-block align-middle" style={getGameWeightColorStyle(weight)} /> Medio (1-2h)</span>
                  {:else if weight === 'Estremo (>2h)'}
                    <span class="inline-flex items-center gap-1"><SkullIcon size={20} weight="fill" class="inline-block align-middle" style={getGameWeightColorStyle(weight)} /> Estremo (&gt;2h)</span>
                  {:else}
                    {weight}
                  {/if}
                </option>
              {/each}
            </select>
          </div>
          <div class="form-control flex flex-col gap-1">
            <label class="label" for="edit-table-description">Descrizione</label>
            <textarea
              id="edit-table-description"
              name="description"
              rows="3"
              class="textarea rounded-lg"
              bind:value={defaultDescription}></textarea>
          </div>
          <div class="flex items-center justify-between gap-2">
            <button type="button" class="btn btn-error" onclick={handleDeleteTable}>
              <TrashIcon size={16} weight="bold" aria-hidden="true" />
              Elimina
            </button>
            <button class="btn btn-success" type="submit">Salva</button>
          </div>
        </div>
      </form>
    </div>
    <button type="button" class="modal-backdrop" onclick={close} aria-label="Chiudi"></button>
  </dialog>
{/if}
