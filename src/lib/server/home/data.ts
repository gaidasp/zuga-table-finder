import type { Table } from '$lib/types';
import { getDefaultNightDate, listSparePlayers, listTableNightDates, listTables } from '$server/data';
import { DATABASE_ERROR_MESSAGE, WEIGHTS } from './constants';
import { isDatabaseError } from './helpers';

export const buildFallbackPageData = (nightDate: string) => ({
  tables: [] as Table[],
  sparePlayers: [],
  tableNightDates: [] as string[],
  weights: WEIGHTS,
  nightDate,
  databaseError: DATABASE_ERROR_MESSAGE
});

export const buildPageData = async (nightDateInput?: string) => {
  const nightDate = nightDateInput || getDefaultNightDate();

  try {
    const tables = await listTables(nightDate);
    const sparePlayers = await listSparePlayers(nightDate);
    const tableNightDates = await listTableNightDates();
    return {
      tables,
      sparePlayers,
      tableNightDates,
      weights: WEIGHTS,
      nightDate,
      databaseError: null
    };
  } catch (error) {
    if (isDatabaseError(error)) {
      console.error('[db-error][load]', error);
      return buildFallbackPageData(nightDate);
    }

    throw error;
  }
};
