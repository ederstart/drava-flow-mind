import { motion } from 'framer-motion';

export const KanbanView = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">Quadro Kanban</h2>
        <p className="text-muted-foreground mb-8">
          Organize suas ideias visualmente em colunas personalizáveis.
        </p>
        
        <div className="insight-card p-12 text-center">
          <p className="text-lg text-muted-foreground">
            🚧 Em construção... Aguarde a próxima versão!
          </p>
        </div>
      </div>
    </motion.div>
  );
};
