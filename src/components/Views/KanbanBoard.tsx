import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { KanbanColumn } from './KanbanColumn';
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
  insight_id?: string;
}

export const KanbanBoard = () => {
  const [board, setBoard] = useState<any>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadBoard();
  }, []);

  const loadBoard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .limit(1)
        .single();

      if (boardError && boardError.code === 'PGRST116') {
        const { data: newBoard } = await supabase
          .from('boards')
          .insert({ 
            title: 'Meu Quadro',
            user_id: user.id
          })
          .select()
          .single();
        boardData = newBoard;

        const defaultColumns = [
          { board_id: newBoard!.id, title: 'Ideias', position: 0 },
          { board_id: newBoard!.id, title: 'Em desenvolvimento', position: 1 },
          { board_id: newBoard!.id, title: 'Concluído', position: 2 },
        ];

        await supabase.from('board_columns').insert(defaultColumns);
      }

      setBoard(boardData);

      if (boardData) {
        const { data: columnsData } = await supabase
          .from('board_columns')
          .select('*')
          .eq('board_id', boardData.id)
          .order('position');

        const { data: cardsData } = await supabase
          .from('cards')
          .select('*')
          .in('column_id', columnsData?.map(c => c.id) || [])
          .order('position');

        setColumns(columnsData || []);
        setCards(cardsData || []);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar quadro');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim() || !board) return;

    try {
      const { data, error } = await supabase
        .from('board_columns')
        .insert({
          board_id: board.id,
          title: newColumnTitle,
          position: columns.length,
        })
        .select()
        .single();

      if (error) throw error;

      setColumns([...columns, data]);
      setNewColumnTitle('');
      setAddingColumn(false);
      toast.success('Coluna adicionada');
    } catch (error: any) {
      toast.error('Erro ao adicionar coluna');
      console.error(error);
    }
  };

  const handleAddCard = async (columnId: string) => {
    try {
      const columnCards = cards.filter(c => c.column_id === columnId);
      
      const { data, error } = await supabase
        .from('cards')
        .insert({
          column_id: columnId,
          title: 'Novo card',
          position: columnCards.length,
        })
        .select()
        .single();

      if (error) throw error;

      setCards([...cards, data]);
      toast.success('Card adicionado');
    } catch (error: any) {
      toast.error('Erro ao adicionar card');
      console.error(error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || active.id === over.id) return;

    const activeCard = cards.find(c => c.id === active.id);
    const overColumn = columns.find(c => c.id === over.id);
    
    if (!activeCard) return;

    if (overColumn && activeCard.column_id !== overColumn.id) {
      try {
        const newCards = cards.map(card =>
          card.id === activeCard.id
            ? { ...card, column_id: overColumn.id }
            : card
        );
        setCards(newCards);

        const { error } = await supabase
          .from('cards')
          .update({ column_id: overColumn.id })
          .eq('id', activeCard.id);

        if (error) throw error;
        toast.success('Card movido');
      } catch (error: any) {
        toast.error('Erro ao mover card');
        loadBoard();
      }
    }
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<Card>) => {
    try {
      const { error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', cardId);

      if (error) throw error;

      setCards(cards.map(c => c.id === cardId ? { ...c, ...updates } : c));
    } catch (error: any) {
      toast.error('Erro ao atualizar card');
      console.error(error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      setCards(cards.filter(c => c.id !== cardId));
      toast.success('Card excluído');
    } catch (error: any) {
      toast.error('Erro ao excluir card');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando quadro...
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-6 min-h-full">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              cards={cards.filter(c => c.column_id === column.id)}
              onAddCard={handleAddCard}
              onUpdateCard={handleUpdateCard}
              onDeleteCard={handleDeleteCard}
            />
          ))}

          {addingColumn ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-shrink-0 w-80 insight-card p-4"
            >
              <Input
                placeholder="Nome da coluna"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddColumn();
                  if (e.key === 'Escape') setAddingColumn(false);
                }}
                autoFocus
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddColumn}>
                  Adicionar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAddingColumn(false)}>
                  Cancelar
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button
              variant="outline"
              className="flex-shrink-0 w-80 h-fit"
              onClick={() => setAddingColumn(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar coluna
            </Button>
          )}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="insight-card p-3 w-80 rotate-3">
              <h4 className="font-medium">{activeCard.title}</h4>
              {activeCard.content && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {activeCard.content}
                </p>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
