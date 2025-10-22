import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanCard } from './KanbanCard';

interface Column {
  id: string;
  title: string;
  position: number;
}

interface Card {
  id: string;
  column_id: string;
  title: string;
  content?: string;
  position: number;
}

interface KanbanColumnProps {
  column: Column;
  cards: Card[];
  onAddCard: (columnId: string) => void;
  onUpdateCard: (cardId: string, updates: Partial<Card>) => void;
  onDeleteCard: (cardId: string) => void;
}

export const KanbanColumn = ({ column, cards, onAddCard, onUpdateCard, onDeleteCard }: KanbanColumnProps) => {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-80 bg-muted/30 rounded-lg p-4 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">{column.title}</h3>
        <span className="text-xs text-muted-foreground">{cards.length}</span>
      </div>

      <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 mb-3 overflow-y-auto">
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onUpdate={onUpdateCard}
              onDelete={onDeleteCard}
            />
          ))}
        </div>
      </SortableContext>

      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start"
        onClick={() => onAddCard(column.id)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar card
      </Button>
    </div>
  );
};
