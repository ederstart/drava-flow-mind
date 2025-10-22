import { motion } from 'framer-motion';
import { KanbanBoard } from './KanbanBoard';

export const KanbanView = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full"
    >
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold">Quadro Kanban</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Organize suas ideias visualmente
        </p>
      </div>
      
      <KanbanBoard />
    </motion.div>
  );
};
