import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';
import { useTripStore } from '../../store/useTripStore';
import { Column } from './Column';
import { CardRenderer } from '../cards/CardRenderer';
import { CardExpansionProvider } from './CardExpansionContext';

export function Board() {
  const columnOrder = useTripStore((s) => s.columnOrder);
  const columns = useTripStore((s) => s.columns);
  const items = useTripStore((s) => s.items);
  const moveItem = useTripStore((s) => s.moveItem);
  const addColumn = useTripStore((s) => s.addColumn);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);
  const didCrossColumn = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findColumnForItem = useCallback(
    (id: string): string | null => {
      if (columns[id]) return id;
      const item = items[id];
      if (item) return item.columnId;
      for (const col of Object.values(columns)) {
        if (col.itemIds.includes(id)) return col.id;
      }
      return null;
    },
    [columns, items]
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
    didCrossColumn.current = false;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }

    const activeColId = findColumnForItem(String(active.id));
    const overColId = findColumnForItem(String(over.id));

    setOverColumnId(overColId);

    if (!activeColId || !overColId || activeColId === overColId) return;

    const overColumn = columns[overColId];
    if (!overColumn) return;

    const overIndex = overColumn.itemIds.indexOf(String(over.id));
    const newIndex = overIndex >= 0 ? overIndex : overColumn.itemIds.length;

    didCrossColumn.current = true;
    moveItem(String(active.id), overColId, newIndex);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverColumnId(null);

    if (!over || didCrossColumn.current) return;

    const activeColId = findColumnForItem(String(active.id));
    const overColId = findColumnForItem(String(over.id));

    if (!activeColId || !overColId || activeColId !== overColId) return;

    const column = columns[activeColId];
    const oldIndex = column.itemIds.indexOf(String(active.id));
    const newIndex = column.itemIds.indexOf(String(over.id));
    if (oldIndex !== newIndex && oldIndex >= 0 && newIndex >= 0) {
      moveItem(String(active.id), activeColId, newIndex);
    }
  };

  const handleAddColumn = () => {
    const name = prompt('Destination name:');
    if (name?.trim()) {
      addColumn(name.trim());
    }
  };

  const activeItem = activeId ? items[activeId] : null;

  return (
    <CardExpansionProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 items-start min-h-full">
            {columnOrder.map((colId) => (
              <Column key={colId} columnId={colId} isOver={activeId !== null && overColumnId === colId} />
            ))}

            <button
              onClick={handleAddColumn}
              className="flex-shrink-0 w-72 h-32 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500 hover:border-blue-300 transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="text-sm font-medium">Add Destination</span>
            </button>
          </div>
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="rotate-2 scale-105 shadow-xl">
              <CardRenderer item={activeItem} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </CardExpansionProvider>
  );
}
