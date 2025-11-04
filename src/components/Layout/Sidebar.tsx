import { motion } from 'framer-motion';
import { FileEdit, LayoutGrid, Palette, Calendar, Plus, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeView: 'editor' | 'kanban' | 'canvas' | 'agenda' | 'mindmap';
  onViewChange: (view: 'editor' | 'kanban' | 'canvas' | 'agenda' | 'mindmap') => void;
  onNewInsight: () => void;
}

const menuItems = [
  { id: 'editor', label: 'Insights', icon: FileEdit },
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'mindmap', label: 'Mapa Mental', icon: Network },
  { id: 'canvas', label: 'Canvas', icon: Palette },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
] as const;

export const Sidebar = ({ activeView, onViewChange, onNewInsight }: SidebarProps) => {
  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col"
    >
      {/* Logo/Title */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-foreground">Drava</h1>
        <p className="text-sm text-muted-foreground mt-1">Flow mental</p>
      </div>

      {/* New Insight Button */}
      <div className="px-4 mb-4">
        <Button
          onClick={onNewInsight}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Insight
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id as any)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">
          Pressione Ctrl+N para novo insight
        </p>
      </div>
    </motion.aside>
  );
};
