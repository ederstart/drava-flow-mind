import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Card {
  id: string;
  column_id: string;
  title: string;
  content?: string;
  position: number;
}

interface KanbanCardProps {
  card: Card;
  onUpdate: (cardId: string, updates: Partial<Card>) => void;
  onDelete: (cardId: string) => void;
}

export const KanbanCard = ({ card, onUpdate, onDelete }: KanbanCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [content, setContent] = useState(card.content || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    onUpdate(card.id, { title, content });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(card.title);
    setContent(card.content || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Deseja excluir este card?')) {
      onDelete(card.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="insight-card p-3 group cursor-grab active:cursor-grabbing"
    >
      {isEditing ? (
        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="text-sm"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Conteúdo (opcional)"
            className="text-sm min-h-[60px] resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Check className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm mb-1">{card.title}</h4>
              {card.content && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {card.content}
                </p>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
