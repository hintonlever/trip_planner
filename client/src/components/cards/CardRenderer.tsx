import type { CostItem } from '../../types';
import { FlightCard } from './FlightCard';
import { HotelCard } from './HotelCard';
import { FoodCard } from './FoodCard';
import { OtherCostCard } from './OtherCostCard';
import { useTripStore } from '../../store/useTripStore';
import { useCardExpansion } from '../board/CardExpansionContext';

interface Props {
  item: CostItem;
  onEdit?: () => void;
}

export function CardRenderer({ item, onEdit }: Props) {
  const removeItem = useTripStore((s) => s.removeItem);
  const { isExpanded, toggle } = useCardExpansion();

  const expanded = isExpanded(item.id);
  const onToggle = () => toggle(item.id);

  const handleDelete = () => {
    if (confirm('Remove this item?')) {
      removeItem(item.id);
    }
  };

  switch (item.type) {
    case 'flight':
      return <FlightCard item={item} expanded={expanded} onToggle={onToggle} onEdit={onEdit} onDelete={handleDelete} />;
    case 'hotel':
      return <HotelCard item={item} expanded={expanded} onToggle={onToggle} onEdit={onEdit} onDelete={handleDelete} />;
    case 'food':
      return <FoodCard item={item} expanded={expanded} onToggle={onToggle} onEdit={onEdit} onDelete={handleDelete} />;
    case 'other':
      return <OtherCostCard item={item} expanded={expanded} onToggle={onToggle} onEdit={onEdit} onDelete={handleDelete} />;
  }
}
