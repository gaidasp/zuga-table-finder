<script lang="ts">
  import type { BGGGame } from '$lib/types';
  import { XIcon } from 'phosphor-svelte';

  let {
    title = $bindable(''),
    bggGame = $bindable<BGGGame | null>(null),
  } = $props();

  let searchResults = $state<BGGGame[]>([]);
  let isSearching = $state(false);
  let showDropdown = $state(false);
  let searchPerformed = $state(false);
  let searchTimeout: number | undefined = undefined;

  const searchBGG = async (query: string) => {
    if (!query || query.trim().length < 2) {
      searchResults = [];
      showDropdown = false;
      searchPerformed = false;
      return;
    }

    isSearching = true;
    searchPerformed = false;
    try {
      const response = await fetch(`/api/bgg/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      searchResults = data.games || [];
      searchPerformed = true;
      showDropdown = true; // Always show dropdown after search
    } catch (error) {
      console.error('Failed to search BGG:', error);
      searchResults = [];
      showDropdown = false;
      searchPerformed = false;
    } finally {
      isSearching = false;
    }
  };

  const handleTitleInput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    title = input.value;

    // Only search if no game is selected
    if (bggGame !== null) {
      return;
    }

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for 1 second
    searchTimeout = setTimeout(() => {
      searchBGG(title);
    }, 1000) as unknown as number;
  };

  const selectGame = (game: BGGGame) => {
    const finalize = (selected: BGGGame) => {
      bggGame = selected;
      searchResults = [];
      showDropdown = false;
    };

    if ((game.description ?? '').trim().length > 0) {
      finalize(game);
      return;
    }

    // Fallback: refresh detail to ensure description is available for modal autofill.
    void (async () => {
      try {
        const response = await fetch(`/api/bgg/search?q=${encodeURIComponent(game.name)}`);
        if (!response.ok) {
          finalize(game);
          return;
        }

        const data = await response.json();
        const detailed = (data.games as BGGGame[] | undefined)?.find((candidate) => candidate.id === game.id);
        finalize(detailed ?? game);
      } catch {
        finalize(game);
      }
    })();
  };

  const clearGame = () => {
    bggGame = null;
    // Title remains as is, but search is now enabled
  };

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.game-search-container')) {
      showDropdown = false;
    }
  };

  $effect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  });
</script>

<div class="form-control flex flex-col gap-1 game-search-container">
  <label class="label" for="table-title">Titolo del tavolo</label>
  <div class="flex gap-2 items-center">
    <div class="relative flex-1">
      <input
        id="table-title"
        name="title"
        required
        maxlength="80"
        class="input w-full"
        value={title}
        oninput={handleTitleInput}
        autocomplete="off"
      />
      {#if showDropdown}
        <div class="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {#if searchResults.length > 0}
            {#each searchResults as game}
              <button
                type="button"
                class="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors"
                onclick={() => selectGame(game)}
              >
                <div class="grid items-center gap-3" style="grid-template-columns: 10% 90%;">
                  <div class="w-full aspect-square rounded overflow-hidden border border-base-300 bg-base-200 flex items-center justify-center">
                    {#if game.image}
                      <img
                        src={game.image}
                        alt={`Copertina ${game.name}`}
                        class="w-full h-full object-cover"
                        loading="lazy"
                      />
                    {:else}
                      <span class="text-[10px] text-base-content/60">N/A</span>
                    {/if}
                  </div>
                  <div class="min-w-0">
                    <div class="font-medium truncate">{game.name}</div>
                    <div class="text-xs text-base-content/60">({game.yearPublished || 'n.d.'})</div>
                  </div>
                </div>
              </button>
            {/each}
          {:else if searchPerformed}
            <div class="px-4 py-3 text-sm text-base-content/60 text-center">
              Nessun gioco trovato su BoardGameGeek
            </div>
          {/if}
        </div>
      {/if}
      {#if isSearching}
        <div class="absolute right-3 top-1/2 -translate-y-1/2">
          <span class="loading loading-spinner loading-xs"></span>
        </div>
      {/if}
    </div>
    
    <!-- Game pill -->
    <button
      type="button"
      onclick={bggGame ? clearGame : undefined}
      class={`badge badge-lg shrink-0 h-10 w-20 flex items-center justify-center px-2 ${bggGame ? 'badge-primary' : 'badge-ghost'}`}
      class:cursor-pointer={bggGame !== null}
      class:cursor-default={bggGame === null}
    >
      {#if bggGame}
          <!-- Show only BGG logo in the pill (name not displayed) -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 38" class="h-8 w-10" aria-hidden="true" focusable="false">
            <g fill="none" fill-rule="evenodd">
              <path fill="currentColor" d="M41.6414127,20.8453307 C41.6414127,20.7138507 41.5623149,20.5562773 41.377073,20.5562773 L37.2504649,20.5562773 L37.2504649,24.470024 L41.377073,24.470024 C41.5623149,24.470024 41.6414127,24.338544 41.6414127,24.2073173 L41.6414127,20.8453307 Z M41.6414127,13.911344 C41.6414127,13.779864 41.5623149,13.622544 41.377073,13.622544 L37.2504649,13.622544 L37.2504649,17.2996773 L41.377073,17.2996773 C41.5623149,17.2996773 41.6414127,17.1681973 41.6414127,17.0103707 L41.6414127,13.911344 Z M32.6737649,27.8317573 L32.6737649,10.1032373 L43.6783083,10.1032373 C45.1334524,10.1032373 46.0591517,11.0223307 46.0591517,12.3353573 L46.0591517,16.2754507 C46.0591517,17.483344 45.2656223,18.6390507 43.6257465,19.0332373 C45.2656223,19.4269173 46.1915767,20.530184 46.1915767,21.7122373 L46.1915767,25.5730373 C46.1915767,26.9648507 45.2656223,27.8317573 43.8107333,27.8317573 L32.6737649,27.8317573 Z M57.7535044,16.9530667 L62.7609046,16.9530667 L62.7609046,25.8040267 C62.7609046,26.9597333 61.8619965,27.8263867 60.7242641,27.8263867 L51.7828972,27.8263867 C50.64542,27.8263867 49.7194656,26.9597333 49.7194656,25.8040267 L49.7194656,12.09388 C49.7194656,11.01696 50.64542,10.0978667 51.7828972,10.0978667 L62.7609046,10.0978667 L62.7609046,13.9062267 L54.5602501,13.9062267 C54.4280803,13.9062267 54.2959104,14.0374533 54.2959104,14.19528 L54.2959104,23.7031333 C54.2959104,23.8604533 54.4280803,23.9655867 54.5602501,23.9655867 L58.2640678,23.9655867 C58.4490546,23.9655867 58.5549435,23.8604533 58.5549435,23.7031333 L58.5549435,20.7087333 L56.1478193,20.7087333 L57.7535044,16.9530667 Z M74.3228322,16.9530667 L79.3304876,16.9530667 L79.3304876,25.8040267 C79.3304876,26.9597333 78.4313244,27.8263867 77.2938472,27.8263867 L68.3524802,27.8263867 C67.2147479,27.8263867 66.2890486,26.9597333 66.2890486,25.8040267 L66.2890486,12.09388 C66.2890486,11.01696 67.2147479,10.0978667 68.3524802,10.0978667 L79.3304876,10.0978667 L79.3304876,13.9062267 L71.1298332,13.9062267 C70.9976633,13.9062267 70.8652383,14.0374533 70.8652383,14.19528 L70.8652383,23.7031333 C70.8652383,23.8604533 70.9976633,23.9655867 71.1298332,23.9655867 L74.8333957,23.9655867 C75.0186376,23.9655867 75.1245266,23.8604533 75.1245266,23.7031333 L75.1245266,20.7087333 L72.7171472,20.7087333 L74.3228322,16.9530667 Z"/>
              <polygon fill="#FF5100" points="24.87 7.01 21.107 8.035 24.792 0 .9 8.794 2.206 19.327 0 21.454 6.577 37.93 20.558 32.779 25.418 21.37 23.331 19.358"/>
            </g>
          </svg>
          <XIcon size={16} weight="bold" />
        {:else}
          <!-- Disabled BGG logo when no game is selected -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 38" class="h-8 w-10 text-base-content/50" aria-hidden="true" focusable="false">
            <g fill="none" fill-rule="evenodd">
              <path fill="currentColor" d="M41.6414127,20.8453307 C41.6414127,20.7138507 41.5623149,20.5562773 41.377073,20.5562773 L37.2504649,20.5562773 L37.2504649,24.470024 L41.377073,24.470024 C41.5623149,24.470024 41.6414127,24.338544 41.6414127,24.2073173 L41.6414127,20.8453307 Z M41.6414127,13.911344 C41.6414127,13.779864 41.5623149,13.622544 41.377073,13.622544 L37.2504649,13.622544 L37.2504649,17.2996773 L41.377073,17.2996773 C41.5623149,17.2996773 41.6414127,17.1681973 41.6414127,17.0103707 L41.6414127,13.911344 Z M32.6737649,27.8317573 L32.6737649,10.1032373 L43.6783083,10.1032373 C45.1334524,10.1032373 46.0591517,11.0223307 46.0591517,12.3353573 L46.0591517,16.2754507 C46.0591517,17.483344 45.2656223,18.6390507 43.6257465,19.0332373 C45.2656223,19.4269173 46.1915767,20.530184 46.1915767,21.7122373 L46.1915767,25.5730373 C46.1915767,26.9648507 45.2656223,27.8317573 43.8107333,27.8317573 L32.6737649,27.8317573 Z M57.7535044,16.9530667 L62.7609046,16.9530667 L62.7609046,25.8040267 C62.7609046,26.9597333 61.8619965,27.8263867 60.7242641,27.8263867 L51.7828972,27.8263867 C50.64542,27.8263867 49.7194656,26.9597333 49.7194656,25.8040267 L49.7194656,12.09388 C49.7194656,11.01696 50.64542,10.0978667 51.7828972,10.0978667 L62.7609046,10.0978667 L62.7609046,13.9062267 L54.5602501,13.9062267 C54.4280803,13.9062267 54.2959104,14.0374533 54.2959104,14.19528 L54.2959104,23.7031333 C54.2959104,23.8604533 54.4280803,23.9655867 54.5602501,23.9655867 L58.2640678,23.9655867 C58.4490546,23.9655867 58.5549435,23.8604533 58.5549435,23.7031333 L58.5549435,20.7087333 L56.1478193,20.7087333 L57.7535044,16.9530667 Z M74.3228322,16.9530667 L79.3304876,16.9530667 L79.3304876,25.8040267 C79.3304876,26.9597333 78.4313244,27.8263867 77.2938472,27.8263867 L68.3524802,27.8263867 C67.2147479,27.8263867 66.2890486,26.9597333 66.2890486,25.8040267 L66.2890486,12.09388 C66.2890486,11.01696 67.2147479,10.0978667 68.3524802,10.0978667 L79.3304876,10.0978667 L79.3304876,13.9062267 L71.1298332,13.9062267 C70.9976633,13.9062267 70.8652383,14.0374533 70.8652383,14.19528 L70.8652383,23.7031333 C70.8652383,23.8604533 70.9976633,23.9655867 71.1298332,23.9655867 L74.8333957,23.9655867 C75.0186376,23.9655867 75.1245266,23.8604533 75.1245266,23.7031333 L75.1245266,20.7087333 L72.7171472,20.7087333 L74.3228322,16.9530667 Z"/>
              <polygon fill="#FF5100" points="24.87 7.01 21.107 8.035 24.792 0 .9 8.794 2.206 19.327 0 21.454 6.577 37.93 20.558 32.779 25.418 21.37 23.331 19.358"/>
            </g>
          </svg>
        {/if}
    </button>
  </div>
  
  <!-- Hidden input to store BGG game data -->
  {#if bggGame}
    <input type="hidden" name="bggGameId" value={bggGame.id} />
    <input type="hidden" name="bggGameName" value={bggGame.name} />
    <input type="hidden" name="bggGameYear" value={bggGame.yearPublished || ''} />
    <input type="hidden" name="bggGameDescription" value={bggGame.description || ''} />
    <input type="hidden" name="bggGameMinPlayers" value={bggGame.minPlayers?.toString() || ''} />
    <input type="hidden" name="bggGameMaxPlayers" value={bggGame.maxPlayers?.toString() || ''} />
  {/if}
</div>

<style>
  .game-search-container {
    position: relative;
  }
</style>
