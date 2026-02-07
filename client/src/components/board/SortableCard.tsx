import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  id: string;
  children: ReactNode;
}

export function SortableCard({ id, children }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/card">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-7 flex items-center justify-center cursor-grab active:cursor-grabbing z-10 opacity-50 group-hover/card:opacity-100 transition-opacity"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      {children}
    </div>
  );
}
