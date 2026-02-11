<script lang="ts">
  import { enhance } from '$app/forms';
  import { TrashIcon, UserIcon, ConfettiIcon, FeatherIcon, PuzzlePieceIcon, SkullIcon } from 'phosphor-svelte';
  import type { SparePlayer, GameWeight } from '$lib/types';
  import DeleteSparePlayerModal from './modals/DeleteSparePlayerModal.svelte';
  
  let sparePlayerToDelete: SparePlayer | null = $state(null);

  let {
    weights = {} as GameWeight[],
    sparePlayers = {} as SparePlayer[],
    baseZIndex = 1,
    honeypotName = '',
    nightDate = null,
    reload = () => {}
  } = $props();

  const groupedSparePlayers = $derived(
    weights.map((weight) => ({
      weight,
      players: sparePlayers.filter((sparePlayer) => sparePlayer.weight === weight)
    }))
  );

  const handleDeleteSparePlayer = (sparePlayer: SparePlayer) => {
    sparePlayerToDelete = sparePlayer;
  };

  const handleCloseDeleteModal = () => {
    sparePlayerToDelete = null;
  };

  const handleSparePlayerDeleted = async (deletedSparePlayerId: string) => {
    await Promise.resolve(reload());
    sparePlayerToDelete = null;
  };

</script>

<article class="card card-border" style="z-index:{baseZIndex}">
  <div class="card-body gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="card-title">Sei indeciso?</h2>
        <p class="text-sm">Aggiungiti alla lista qui sotto per trovare compagni di gioco</p>
      </div>
      <span class="badge badge-outline"
        >{sparePlayers.length} <UserIcon size={20} weight="bold" aria-hidden="true" /></span
      >
    </div>

    {#if sparePlayers.length === 0}
      <p class="text-sm">
        Lista vuota: aggiungiti e fai sapere agli altri che stai cercando un* compagn* di gioco!
      </p>
    {:else}
      <div class="space-y-3">
        {#each groupedSparePlayers as group (group.weight)}
          {#if group.players.length > 0}
            <div
              class="collapse collapse-arrow border border-base-300 bg-base-100 hover:border-base-400"
            >
              <input type="checkbox" />
              <div class="collapse-title flex items-center justify-between">
                <span class="font-medium flex items-center gap-1">
                  {#if group.weight === 'Party'}
                    <ConfettiIcon size={20} weight="fill" class="text-warning" />
                  {:else if group.weight === 'Leggero (max 45 min)'}
                    <FeatherIcon size={20} weight="fill" class="text-info" />
                  {:else if group.weight === 'Medio (1-2h)'}
                    <PuzzlePieceIcon size={20} weight="fill" class="text-success" />
                  {:else if group.weight === 'Estremo (>2h)'}
                    <SkullIcon size={20} weight="fill" class="text-error" />
                  {/if}
                  {group.weight}
                </span>
                <span class="badge badge-outline">{group.players.length} <UserIcon  size={20} weight="bold" aria-hidden="true" /></span
                >
              </div>
              <div class="collapse-content">
                <div class="overflow-x-auto">
                  <table class="table table-sm">
                    <tbody>
                      {#each group.players as sparePlayer}
                        <tr>
                          <td class="font-medium flex items-center gap-1">
                            {sparePlayer.name}
                          </td>
                          <td class="text-right text-xs text-base-content/70">
                            aggiunto/a il {new Date(sparePlayer.createdAt).toLocaleDateString('it-IT', {
                              dateStyle: 'short'
                            })} alle {new Date(sparePlayer.createdAt).toLocaleTimeString('it-IT', {
                              timeStyle: 'short'
                            })}
                          </td>
                          <td class="text-right">
                            <button
                              type="button"
                              class="btn btn-xs btn-ghost btn-error hover:btn-outline focus-visible:outline-none focus-visible:ring"
                              aria-label={`Rimuovi ${sparePlayer.name}`}
                              onclick={() => handleDeleteSparePlayer(sparePlayer)}
                            >
                              <TrashIcon size={14} weight="bold" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</article>

<DeleteSparePlayerModal
  open={!!sparePlayerToDelete}
  zIndex={baseZIndex + 2}
  {honeypotName}
  sparePlayer={sparePlayerToDelete}
  nightDate={nightDate}
  close={handleCloseDeleteModal}
  deleted={handleSparePlayerDeleted}
/>

