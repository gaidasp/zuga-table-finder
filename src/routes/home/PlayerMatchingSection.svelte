<script lang="ts">
  import { enhance } from '$app/forms';
  import { TrashIcon, UserIcon, ConfettiIcon, FeatherIcon, PuzzlePieceIcon, SkullIcon, PencilSimpleIcon } from 'phosphor-svelte';
  import type { AuthUser, SparePlayer, GameWeight } from '$lib/types';
  import { getAvatarBgClass } from '$lib/utils/avatar';
  import { getGameWeightColorStyle } from '$lib/utils/tableWeight';
  import DeleteSparePlayerModal from './modals/DeleteSparePlayerModal.svelte';
  import EditSparePlayerModal from './modals/EditSparePlayerModal.svelte';
  
  class DeleteSparePlayerModalState {
    isOpen = $state(false);
    sparePlayer: SparePlayer | null = $state(null);

    open = (sparePlayer: SparePlayer) => {
      this.sparePlayer = sparePlayer;
      this.isOpen = true;
    };

    close = () => {
      this.isOpen = false;
      this.sparePlayer = null;
    };
  }

  class EditSparePlayerModalState {
    isOpen = $state(false);
    sparePlayer: SparePlayer | null = $state(null);

    open = (sparePlayer: SparePlayer) => {
      this.sparePlayer = sparePlayer;
      this.isOpen = true;
    };

    close = () => {
      this.isOpen = false;
      this.sparePlayer = null;
    };
  }

  let {
    weights = {} as GameWeight[],
    sparePlayers = {} as SparePlayer[],
    authUser = null as AuthUser | null,
    canMutate = false,
    baseZIndex = 1,
    honeypotName = '',
    nightDate = null,
    reload = () => {}
  } = $props();

  const deleteModal = new DeleteSparePlayerModalState();
  const editModal = new EditSparePlayerModalState();

  const groupedSparePlayers = $derived(
    weights.map((weight) => ({
      weight,
      players: sparePlayers.filter((sparePlayer) => sparePlayer.weight === weight)
    }))
  );

  const handleSparePlayerDeleted = async (deletedSparePlayerId: string) => {
    await Promise.resolve(reload());
    deleteModal.close();
  };

  const handleSparePlayerSaved = async (savedSparePlayer: SparePlayer | null) => {
    await Promise.resolve(reload());
    editModal.close();
  };

  const getInitial = (name: string) => {
    const first = name.trim().charAt(0);
    return (first || 'G').toUpperCase();
  };

  const normalizeName = (value: string | null | undefined) => (value ?? '').trim().toLowerCase();

  const shouldUseProfilePhoto = (name: string) => {
    if (!authUser?.avatarDataUrl) return false;
    return normalizeName(name) === normalizeName(authUser.nickname);
  };

  const canDeleteSpare = (sparePlayer: SparePlayer) =>
    Boolean(
      canMutate &&
        authUser?.id &&
        (
          authUser.isAdmin ||
          (sparePlayer.userId ? sparePlayer.userId === authUser.id : false) ||
          (sparePlayer.ownerUserId ? sparePlayer.ownerUserId === authUser.id : false)
        )
    );

  const canEditSpare = (sparePlayer: SparePlayer) => canDeleteSpare(sparePlayer);

</script>

<section aria-labelledby="matching-heading">
  <article class="card card-border" style="z-index:{baseZIndex}">
    <div class="card-body gap-2 sm:gap-4 p-4 sm:p-6">
      <header class="flex items-center justify-between">
        <div>
          <h2 id="matching-heading" class="card-title">Sei indeciso?</h2>
          <p class="text-sm">Aggiungiti alla lista qui sotto per trovare compagni di gioco</p>
        </div>
        <span class="badge badge-outline"
          >{sparePlayers.length} <UserIcon size={20} weight="bold" aria-hidden="true" /></span
        >
      </header>

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
                      <ConfettiIcon size={20} weight="fill" style={getGameWeightColorStyle(group.weight)} />
                    {:else if group.weight === 'Leggero (max 45 min)'}
                      <FeatherIcon size={20} weight="fill" style={getGameWeightColorStyle(group.weight)} />
                    {:else if group.weight === 'Medio (1-2h)'}
                      <PuzzlePieceIcon size={20} weight="fill" style={getGameWeightColorStyle(group.weight)} />
                    {:else if group.weight === 'Estremo (>2h)'}
                      <SkullIcon size={20} weight="fill" style={getGameWeightColorStyle(group.weight)} />
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
                            <td class="font-medium align-middle">
                              <div class="flex items-center gap-1">
                                {#if shouldUseProfilePhoto(sparePlayer.name)}
                                  <span class="inline-flex h-4 w-4 shrink-0 overflow-hidden rounded-full aspect-square" aria-hidden="true">
                                    <img
                                      src={authUser?.avatarDataUrl}
                                      alt=""
                                      class="h-full w-full object-cover object-center"
                                    />
                                  </span>
                                {:else}
                                  <span
                                    class={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full aspect-square text-[10px] font-bold leading-none text-white ${sparePlayer.avatarColor ?? getAvatarBgClass(sparePlayer.id || sparePlayer.name)}`}
                                    aria-hidden="true"
                                  >
                                    {getInitial(sparePlayer.name)}
                                  </span>
                                {/if}
                                {sparePlayer.name}
                              </div>
                            </td>
                            <td class="text-right text-xs text-base-content/70">
                              aggiunto/a il {new Date(sparePlayer.createdAt).toLocaleDateString('it-IT', {
                                dateStyle: 'short'
                              })} alle {new Date(sparePlayer.createdAt).toLocaleTimeString('it-IT', {
                                timeStyle: 'short'
                              })}
                            </td>
                            {#if canDeleteSpare(sparePlayer)}
                              <td class="text-right">
                                {#if canEditSpare(sparePlayer)}
                                  <button
                                    type="button"
                                    class="btn btn-xs btn-ghost hover:btn-outline focus-visible:outline-none focus-visible:ring"
                                    aria-label={`Modifica ${sparePlayer.name}`}
                                    onclick={() => editModal.open(sparePlayer)}
                                  >
                                    <PencilSimpleIcon size={14} weight="bold" aria-hidden="true" />
                                  </button>
                                {/if}
                                <button
                                  type="button"
                                  class="btn btn-xs btn-ghost btn-error hover:btn-outline focus-visible:outline-none focus-visible:ring"
                                  aria-label={`Rimuovi ${sparePlayer.name}`}
                                  onclick={() => deleteModal.open(sparePlayer)}
                                >
                                  <TrashIcon size={14} weight="bold" aria-hidden="true" />
                                </button>
                              </td>
                            {/if}
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

  {#if canMutate}
    <DeleteSparePlayerModal
      open={deleteModal.isOpen}
      zIndex={baseZIndex + 2}
      {honeypotName}
      sparePlayer={deleteModal.sparePlayer}
      nightDate={nightDate}
      close={deleteModal.close}
      deleted={handleSparePlayerDeleted}
    />

    <EditSparePlayerModal
      open={editModal.isOpen}
      zIndex={baseZIndex + 3}
      {honeypotName}
      sparePlayer={editModal.sparePlayer}
      weights={weights}
      close={editModal.close}
      saved={handleSparePlayerSaved}
    />
  {/if}
</section>
