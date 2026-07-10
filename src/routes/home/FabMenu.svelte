<script lang="ts">
  import { UserIcon } from 'phosphor-svelte';

  let {
    open = false,
    zIndex = 0,
    onToggle ,
    onCreate ,
    onSpare 
  } = $props() 

</script>

<div class="fixed bottom-6 right-6" style="z-index: {zIndex};">
  <div class="flex flex-col items-end gap-3">
    {#if open}
      <div class="flex flex-col items-end gap-2 animate-in slide-in-from-bottom-4 fade-in duration-200">
        <button
          class="btn btn-circle btn-primary aspect-square shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200 delay-75 hover:scale-120 transition-transform"
          type="button"
          aria-label="Aggiungi giocatore in lista"
          onclick={onSpare}
        >
          <UserIcon size={22} weight="bold" aria-hidden="true" />
        </button>
        <button
          class="btn btn-circle btn-primary aspect-square shadow-lg animate-in slide-in-from-bottom-2 fade-in duration-200 hover:scale-120 transition-transform"
          type="button"
          aria-label="Nuovo tavolo"
          onclick={onCreate}
        >
          <svg class="h-3/5" viewBox="0 0 26 26" aria-hidden="true" fill="currentColor">
            <path d="M25.484,7.114l-4.278-3.917C21.034,3.069,20.825,3,20.61,3H5.38C5.165,3,4.956,3.069,4.783,3.197l-4.38,4C0.403,7.197,0,7.453,0,8v2c0,0.551,0.449,1,1,1h24c0.551,0,1-0.449,1-1V8C26,7.469,25.484,7.114,25.484,7.114z"/>
            <path d="M2,23c-0.551,0-1-0.449-1-1V10h3v12c0,0.551-0.449,1-1,1H2z"/>
            <path d="M23,23c-0.551,0-1-0.449-1-1V10h3v12c0,0.551-0.449,1-1,1H23z"/>
            <path d="M20,18c-0.551,0-1-0.449-1-1v-5h2v5C21,17.551,20.551,18,20,18L20,18z"/>
            <path d="M6,18c-0.551,0-1-0.449-1-1v-5h2v5C7,17.551,6.551,18,6,18L6,18z"/>
          </svg>
        </button>
      </div>
    {/if}

    <button
      type="button"
      class="btn btn-lg btn-circle btn-primary aspect-square shadow-lg hover:scale-120 focus:scale-110 transition-all text-2xl {open ? 'rotate-45' : ''}"
      aria-label="Apri azioni tavoli"
      aria-expanded={open}
      onclick={onToggle}
    >
      +
    </button>
  </div>
</div>
