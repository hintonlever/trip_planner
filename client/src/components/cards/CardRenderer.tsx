import type { CostItem } from '../../types';
import { FlightCard } from './FlightCard';
import { HotelCard } from './HotelCard';
import { FoodCard } from './FoodCard';
import { useTripStore } from '../../store/useTripStore';

interface Props {
  item: CostItem;
  onEdit?: () => void;
}

export function CardRenderer({ item, onEdit }: Props) {
  const removeItem = useTripStore((s) => s.removeItem);

  const handleDelete = () => {
    if (confirm('Remove this item?')) {
      removeItem(item.id);
    }
  };

  switch (item.type) {
    case 'flight':
      return <FlightCard item={item} onEdit={onEdit} onDelete={handleDelete} />;
    case 'hotel':
      return <HotelCard item={item} onEdit={onEdit} onDelete={handleDelete} />;
    case 'food':
      return <FoodCard item={item} onEdit={onEdit} onDelete={handleDelete} />;
  }
}
