import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Trash2 } from 'lucide-react';
import { useTripStore, selectColumnTotal } from '../../store/useTripStore';
import { SortableCard } from './SortableCard';
import { CardRenderer } from '../cards/CardRenderer';
import { formatCurrency } from '../../utils/formatCurrency';
import { useState } from 'react';

interface Props {
  columnId: string;
}

export function Column({ columnId }: Props) {
  const column = useTripStore((s) => s.columns[columnId]);
  const items = useTripStore((s) => s.items);
  const total = useTripStore((s) => selectColumnTotal(s, columnId));
  const renameColumn = useTripStore((s) => s.renameColumn);
  const removeColumn = useTripStore((s) => s.removeColumn);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(column?.name ?? '');

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

  return (
    <div className="flex-shrink-0 w-72 bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-full">
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
          <button
            onClick={handleDelete}
            className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-lg font-bold text-gray-900">{formatCurrency(total)}</p>
      </div>

      <div ref={setNodeRef} className="p-2 flex-1 overflow-y-auto min-h-[120px]">
        <SortableContext items={column.itemIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
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
