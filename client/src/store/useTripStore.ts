import { create } from 'zustand';
import type { CostItem, DestinationColumn } from '../types';
import { generateId } from '../utils/generateId';

interface TripState {
  tripName: string;
  columns: Record<string, DestinationColumn>;
  columnOrder: string[];
  items: Record<string, CostItem>;
  currentTripId: number | null;
}

interface TripActions {
  setTripName: (name: string) => void;
  addColumn: (name: string) => string;
  removeColumn: (columnId: string) => void;
  renameColumn: (columnId: string, name: string) => void;
  addItem: (columnId: string, item: Omit<CostItem, 'id' | 'columnId'>) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: Partial<CostItem>) => void;
  moveItem: (itemId: string, toColumnId: string, newIndex: number) => void;
  reorderInColumn: (columnId: string, oldIndex: number, newIndex: number) => void;
  setCurrentTripId: (id: number | null) => void;
  loadState: (state: TripState, tripId?: number) => void;
  clearTrip: () => void;
}

const initialState: TripState = {
  tripName: 'My Trip',
  columns: {},
  columnOrder: [],
  items: {},
  currentTripId: null,
};

export const useTripStore = create<TripState & TripActions>((set) => ({
  ...initialState,

  setTripName: (name) => set({ tripName: name }),

  addColumn: (name) => {
    const id = generateId();
    set((state) => ({
      columns: { ...state.columns, [id]: { id, name, itemIds: [] } },
      columnOrder: [...state.columnOrder, id],
    }));
    return id;
  },

  removeColumn: (columnId) =>
    set((state) => {
      const column = state.columns[columnId];
      if (!column) return state;
      const newItems = { ...state.items };
      column.itemIds.forEach((id) => delete newItems[id]);
      const { [columnId]: _, ...newColumns } = state.columns;
      return {
        columns: newColumns,
        columnOrder: state.columnOrder.filter((id) => id !== columnId),
        items: newItems,
      };
    }),

  renameColumn: (columnId, name) =>
    set((state) => ({
      columns: {
        ...state.columns,
        [columnId]: { ...state.columns[columnId], name },
      },
    })),

  addItem: (columnId, itemData) =>
    set((state) => {
      const column = state.columns[columnId];
      if (!column) return state;
      const id = generateId();
      const item = { ...itemData, id, columnId } as CostItem;
      return {
        items: { ...state.items, [id]: item },
        columns: {
          ...state.columns,
          [columnId]: { ...column, itemIds: [...column.itemIds, id] },
        },
      };
    }),

  removeItem: (itemId) =>
    set((state) => {
      const item = state.items[itemId];
      if (!item) return state;
      const column = state.columns[item.columnId];
      if (!column) return state;
      const { [itemId]: _, ...newItems } = state.items;
      return {
        items: newItems,
        columns: {
          ...state.columns,
          [column.id]: {
            ...column,
            itemIds: column.itemIds.filter((id) => id !== itemId),
          },
        },
      };
    }),

  updateItem: (itemId, updates) =>
    set((state) => {
      const item = state.items[itemId];
      if (!item) return state;
      return {
        items: { ...state.items, [itemId]: { ...item, ...updates } as CostItem },
      };
    }),

  moveItem: (itemId, toColumnId, newIndex) =>
    set((state) => {
      const item = state.items[itemId];
      if (!item) return state;
      const fromColumn = state.columns[item.columnId];
      const toColumn = state.columns[toColumnId];
      if (!fromColumn || !toColumn) return state;

      const fromIds = fromColumn.itemIds.filter((id) => id !== itemId);
      let toIds: string[];
      if (fromColumn.id === toColumn.id) {
        toIds = [...fromIds];
        toIds.splice(newIndex, 0, itemId);
        return {
          items: { ...state.items, [itemId]: { ...item, columnId: toColumnId } as CostItem },
          columns: {
            ...state.columns,
            [toColumnId]: { ...toColumn, itemIds: toIds },
          },
        };
      } else {
        toIds = [...toColumn.itemIds];
        toIds.splice(newIndex, 0, itemId);
        return {
          items: { ...state.items, [itemId]: { ...item, columnId: toColumnId } as CostItem },
          columns: {
            ...state.columns,
            [fromColumn.id]: { ...fromColumn, itemIds: fromIds },
            [toColumnId]: { ...toColumn, itemIds: toIds },
          },
        };
      }
    }),

  reorderInColumn: (columnId, oldIndex, newIndex) =>
    set((state) => {
      const column = state.columns[columnId];
      if (!column) return state;
      const ids = [...column.itemIds];
      const [removed] = ids.splice(oldIndex, 1);
      ids.splice(newIndex, 0, removed);
      return {
        columns: { ...state.columns, [columnId]: { ...column, itemIds: ids } },
      };
    }),

  setCurrentTripId: (id) => set({ currentTripId: id }),

  loadState: (saved, tripId?) =>
    set({
      tripName: saved.tripName,
      columns: saved.columns,
      columnOrder: saved.columnOrder,
      items: saved.items,
      currentTripId: tripId ?? null,
    }),

  clearTrip: () => set({ ...initialState }),
}));

// Selectors
export const selectColumnTotal = (
  state: TripState,
  columnId: string
): number => {
  const column = state.columns[columnId];
  if (!column) return 0;
  return column.itemIds.reduce((sum, id) => {
    return sum + (state.items[id]?.totalCost ?? 0);
  }, 0);
};

export const selectAllColumnTotals = (state: TripState) => {
  return state.columnOrder.map((colId) => ({
    columnId: colId,
    name: state.columns[colId]?.name ?? '',
    total: selectColumnTotal(state, colId),
  }));
};
