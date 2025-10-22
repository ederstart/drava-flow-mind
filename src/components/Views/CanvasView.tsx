import { motion } from 'framer-motion';
import { CanvasBoard } from './CanvasBoard';

export const CanvasView = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold">Canvas Livre</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Desenhe livremente e visualize suas ideias
        </p>
      </div>
      
      <div className="flex-1">
        <CanvasBoard />
      </div>
    </motion.div>
  );
};
