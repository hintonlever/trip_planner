import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Trash2, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { useTripStore, selectColumnTotal } from '../../store/useTripStore';
import { SortableCard } from './SortableCard';
import { CardRenderer } from '../cards/CardRenderer';
import { formatCurrency } from '../../utils/formatCurrency';
import { useState } from 'react';
import { useCardExpansion } from './CardExpansionContext';
import { WeatherInfo } from '../weather/WeatherInfo';

interface Props {
  columnId: string;
  isOver?: boolean;
}

export function Column({ columnId, isOver }: Props) {
  const column = useTripStore((s) => s.columns[columnId]);
  const items = useTripStore((s) => s.items);
  const total = useTripStore((s) => selectColumnTotal(s, columnId));
  const renameColumn = useTripStore((s) => s.renameColumn);
  const removeColumn = useTripStore((s) => s.removeColumn);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column?.name ?? '');
  const { expandAll, collapseAll, allCollapsed } = useCardExpansion();

  const { setNodeRef } = useDroppable({ id: columnId });

  if (!column) return null;

  const handleRename = () => {
    if (name.trim()) {
      renameColumn(columnId, name.trim());
    }
    setEditing(false);
  };

  const handleDelete = () => {
    if (confirm(`Delete "${column.name}" and all its items?`)) {
      removeColumn(columnId);
    }
  };

  const handleToggleAll = () => {
    if (allCollapsed) {
      const allIds = Object.keys(items);
      expandAll(allIds);
    } else {
      collapseAll();
    }
  };

  return (
    <div className={`flex-shrink-0 w-64 sm:w-72 rounded-xl border flex flex-col max-h-full transition-colors ${isOver ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}>
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              autoFocus
              className="text-sm font-bold bg-white border border-blue-300 rounded px-1 py-0.5 w-full mr-2 outline-none"
            />
          ) : (
            <h3
              className="text-sm font-bold text-gray-800 truncate cursor-pointer hover:text-blue-600"
              onClick={() => { setName(column.name); setEditing(true); }}
            >
              {column.name}
            </h3>
          )}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {column.itemIds.length > 0 && (
              <button
                onClick={handleToggleAll}
                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                title={allCollapsed ? 'Expand all' : 'Collapse all'}
              >
                {allCollapsed ? (
                  <ChevronsUpDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronsDownUp className="w-3.5 h-3.5" />
                )}
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
      </div>

      <WeatherInfo columnId={columnId} />

      <div ref={setNodeRef} className="p-2 flex-1 overflow-y-auto min-h-[120px]">
        <SortableContext items={column.itemIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {column.itemIds.map((itemId) => {
              const item = items[itemId];
              if (!item) return null;
              return (
                <SortableCard key={itemId} id={itemId}>
                  <CardRenderer item={item} />
                </SortableCard>
              );
            })}
          </div>
        </SortableContext>
        {column.itemIds.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-8">
            Add items from the sidebar or drag them here
          </p>
        )}
      </div>
    </div>
  );
}
