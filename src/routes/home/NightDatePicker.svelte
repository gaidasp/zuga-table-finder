<script lang="ts">
  import { tick } from 'svelte';
  import { enhance } from '$app/forms';
  import { CaretLeftIcon, CaretRightIcon } from 'phosphor-svelte';

  let {
    zIndex = 0,
    nightDate = null,
    honeypotName = '',
    tableNightDates = [] as string[],
    selected
  } = $props();

  let nightForm: HTMLFormElement | null = null;
  let pickerRoot: HTMLDivElement | null = null;
  let pickerOpen = $state(false);
  let pendingNightDate = $state('');
  let calendarMonth = $state(new Date());

  const tableNightDateSet = $derived(new Set(tableNightDates));

  const toIsoDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseIsoDate = (value: string | null | undefined) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const startOfMonth = (value: Date) => new Date(value.getFullYear(), value.getMonth(), 1);

  const getNightDateParts = (value: string) => {
    if (!value) return null;
    const parsedNightDate = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsedNightDate.getTime())) return null;

    return {
      day: parsedNightDate.toLocaleDateString('it-IT', { day: '2-digit' }),
      label: parsedNightDate.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    };
  };

  const getMonthLabel = (value: Date) =>
    value.toLocaleDateString('it-IT', {
      month: 'long',
      year: 'numeric'
    });

  const getCalendarDays = (monthDate: Date, selectedDate: string) => {
    const start = startOfMonth(monthDate);
    const startWeekday = (start.getDay() + 6) % 7;
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - startWeekday);

    return Array.from({ length: 42 }, (_, offset) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + offset);
      const isoDate = toIsoDate(date);
      const isCurrentMonth = date.getMonth() === monthDate.getMonth();

      return {
        isoDate,
        dayNumber: date.getDate(),
        isCurrentMonth,
        isSelected: isoDate === selectedDate,
        hasTables: tableNightDateSet.has(isoDate)
      };
    });
  };

  const openNightPicker = () => {
    pickerOpen = true;
  };

  const keepNightDate = ({ update }: { update: (options?: { reset?: boolean }) => Promise<void> }) => {
    return async ({ result }: any) => {
      if (result?.type === 'success') {
        const data = result.data as any;
        const newNightDate = data?.nightDate;
        pendingNightDate = newNightDate;
        selected(newNightDate);
      }
    };
  };

  const selectDate = async (isoDate: string) => {
    pendingNightDate = isoDate;
    pickerOpen = false;
    await tick();
    nightForm?.requestSubmit();
  };

  const showPreviousMonth = () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
  };

  const showNextMonth = () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
  };

  $effect(() => {
    pendingNightDate = nightDate ?? '';
    const parsed = parseIsoDate(nightDate);
    calendarMonth = parsed ? startOfMonth(parsed) : startOfMonth(new Date());
  });

  $effect(() => {
    if (!pickerOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!pickerRoot) return;
      const target = event.target as Node | null;
      if (target && !pickerRoot.contains(target)) {
        pickerOpen = false;
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
    };
  });

  const nightDateParts = $derived(getNightDateParts(pendingNightDate));
  const calendarDays = $derived(getCalendarDays(calendarMonth, pendingNightDate));
</script>

<div class="flex flex-wrap items-center gap-2" bind:this={pickerRoot}>
  <span class="text-sm">Serata:</span>
  <form
    method="POST"
    action="?/setNightDate"
    use:enhance={keepNightDate}
    bind:this={nightForm}
    class="relative flex items-center gap-2"
  >
    <input name={honeypotName} hidden tabindex="-1" aria-hidden="true" />
    <input type="hidden" name="nightDate" bind:value={pendingNightDate} />
    <button type="button" class="btn btn-sm btn-outline" onclick={openNightPicker}>
      {#if nightDateParts}
        <!-- <span class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold bg-base-100 text-base-content border border-base-300">
          {nightDateParts.day}
        </span> -->
        <span>{nightDateParts.label}</span>
      {:else}
        Seleziona una data
      {/if}
    </button>

    {#if pickerOpen}
      <div class="absolute right-0 top-full z-50 mt-2 w-[20rem] max-w-[calc(100vw-1rem)] rounded-box border border-base-300 bg-base-100 p-3 shadow-xl max-sm:fixed max-sm:left-1/2 max-sm:right-auto max-sm:top-1/2 max-sm:mt-0 max-sm:w-[min(20rem,calc(100vw-1rem))] max-sm:-translate-x-1/2 max-sm:-translate-y-1/2">
        <div class="mb-3 flex items-center justify-between">
          <button type="button" class="btn btn-xs btn-ghost" onclick={showPreviousMonth} aria-label="Mese precedente">
            <CaretLeftIcon size={14} weight="bold" />
          </button>
          <p class="text-sm font-semibold capitalize">{getMonthLabel(calendarMonth)}</p>
          <button type="button" class="btn btn-xs btn-ghost" onclick={showNextMonth} aria-label="Mese successivo">
            <CaretRightIcon size={14} weight="bold" />
          </button>
        </div>

        <div class="mb-2 grid grid-cols-7 text-center text-xs font-semibold text-base-content/60">
          <span>L</span><span>M</span><span>M</span><span>G</span><span>V</span><span>S</span><span>D</span>
        </div>

        <div class="grid grid-cols-7 gap-1">
          {#each calendarDays as day}
            <button
              type="button"
              class={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors ${day.isCurrentMonth ? '' : 'opacity-40'} ${day.hasTables ? 'bg-primary text-primary-content' : 'hover:bg-base-200'} ${day.isSelected ? 'ring-2 ring-primary ring-offset-1 ring-offset-base-100' : ''}`}
              onclick={() => selectDate(day.isoDate)}
              aria-label={`Seleziona ${day.isoDate}`}
            >
              {day.dayNumber}
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </form>
</div>
