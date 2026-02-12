import type { Player, SparePlayer, Table } from '$lib/types';
import type { PageStateManager } from './PageStateManager.svelte';

export class ActionsManager {
  constructor(
    private state: PageStateManager,
    private reloadData: (nightDate: string) => Promise<void>
  ) {}

  // Table Actions
  handleTableCreated = async (table: Table | null, nightDate: string) => {
    if (table) {
      this.state.setFocusedTable(table.id);
      await this.reloadData(nightDate);
    }
    this.state.createTableModal.close();
  };

  handleTableSaved = async (table: Table, nightDate: string) => {
    this.state.setFocusedTable(table.id);
    await this.reloadData(nightDate);
    this.state.editTableModal.close();
  };

  handleTableDeleted = async (tableId: string, nightDate: string) => {
    await this.reloadData(nightDate);
    this.state.deleteTableModal.close();
  };

  // Player Actions
  handleSavePlayer = async (tableId: string, updated: Player, nightDate: string) => {
    if (!updated?.id) return;
    this.state.setFocusedTable(tableId);
    await this.reloadData(nightDate);
  };

  handlePlayerAdded = async (updatedTable: Table, nightDate: string) => {
    this.state.setFocusedTable(updatedTable.id);
    await this.reloadData(nightDate);
    this.state.addPlayerModal.close();
  };

  handlePlayerDeleted = async (updatedTable: Table, nightDate: string) => {
    await this.reloadData(nightDate);
    this.state.deletePlayerModal.close();
  };

  handleDetailPlayerDeleted = (player: Player) => {
    if (this.state.detailPlayerModal.data) {
      this.state.deletePlayerModal.open(
        this.state.detailPlayerModal.data.tableId,
        player.id,
        player.name
      );
      this.state.detailPlayerModal.close();
    }
  };

  // Spare Player Actions
  handleSpareAdded = async (sparePlayer: SparePlayer | null, nightDate: string) => {
    if (sparePlayer) {
      await this.reloadData(nightDate);
    }
    this.state.addSparePlayerModal.close();
  };

  // Night Date Actions
  handleNightDateSelected = async (updatedDate: string) => {
    await this.reloadData(updatedDate);
  };
}
