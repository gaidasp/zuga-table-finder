<script lang="ts">
  import { UserPlus } from 'phosphor-svelte';

  let {
    open = false,
    zIndex = 0,
    onToggle ,
    onCreate ,
    onSpare 
  } = $props() 

</script>

<div class="fixed bottom-6 right-6 z-50">
  <div class="flex flex-col items-end gap-3">
    {#if open}
      <div class="flex flex-col items-end gap-2">
        <button
          class="btn btn-circle btn-primary shadow-lg"
          type="button"
          aria-label="Aggiungi giocatore in lista"
          onclick={onSpare}
        >
          <UserPlus size={22} weight="bold" aria-hidden="true" />
        </button>
        <button
          class="btn btn-circle btn-primary shadow-lg"
          type="button"
          aria-label="Nuovo tavolo"
          onclick={onCreate}
        >
          <img src="/assets/icons/board-game.svg" alt="" class="h-3/5" aria-hidden="true" />
        </button>
      </div>
    {/if}

    <button
      type="button"
      class="btn btn-lg btn-circle btn-primary shadow-lg hover:scale-105 focus:scale-105 transition text-2xl"
      aria-label="Apri azioni tavoli"
      aria-expanded={open}
      onclick={onToggle}
    >
      +
    </button>
  </div>
</div>
