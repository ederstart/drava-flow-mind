import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useInsightStore } from '@/store/useInsightStore';
import { toast } from 'sonner';

export const InsightEditor = () => {
  const { currentInsight, addInsight, updateInsight, saveStatus, setSaveStatus } = useInsightStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [source, setSource] = useState('');
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentInsight) {
      setTitle(currentInsight.title);
      setContent(currentInsight.content);
      setTags(currentInsight.tags.join(', '));
      setSource(currentInsight.source || '');
    }
  }, [currentInsight]);

  const handleAutoSave = useCallback(() => {
    if (!title && !content) return;

    setSaveStatus('saving');
    
    const tagsArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (currentInsight) {
      updateInsight(currentInsight.id, {
        title,
        content,
        tags: tagsArray,
        source: source || undefined,
      });
    } else {
      addInsight({
        title: title || 'Sem título',
        content,
        tags: tagsArray,
        source: source || undefined,
      });
    }

    setTimeout(() => {
      setSaveStatus('saved');
      toast.success('💾 Insight salvo automaticamente');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  }, [title, content, tags, source, currentInsight, addInsight, updateInsight, setSaveStatus]);

  const handleChange = useCallback(() => {
    if (saveTimer) clearTimeout(saveTimer);
    
    const timer = setTimeout(() => {
      handleAutoSave();
    }, 5000);
    
    setSaveTimer(timer);
  }, [saveTimer, handleAutoSave]);

  useEffect(() => {
    handleChange();
    return () => {
      if (saveTimer) clearTimeout(saveTimer);
    };
  }, [title, content, tags, source]);

  const handleManualSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    handleAutoSave();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleManualSave]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto p-8"
    >
      <div className="insight-card p-8 space-y-6">
        {/* Header with save status */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            {currentInsight ? 'Editando insight' : 'Novo insight'}
          </h2>
          
          <AnimatePresence mode="wait">
            {saveStatus === 'saving' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Save className="w-4 h-4 animate-pulse" />
                <span>Salvando...</span>
              </motion.div>
            )}
            {saveStatus === 'saved' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 text-sm text-accent"
              >
                <Check className="w-4 h-4" />
                <span>Salvo</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Title */}
        <Input
          placeholder="Título do insight..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-semibold border-0 px-0 focus-visible:ring-0 bg-transparent"
        />

        {/* Content */}
        <Textarea
          placeholder="Escreva suas ideias livremente... O texto será salvo automaticamente após 5 segundos."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[300px] resize-none border-0 px-0 focus-visible:ring-0 bg-transparent text-base leading-relaxed"
        />

        {/* Source */}
        <Input
          placeholder="Fonte de inspiração (ex: Podcast: Naval — 32:10)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="text-sm text-muted-foreground border-border/50"
        />

        {/* Tags */}
        <Input
          placeholder="Tags (separe por vírgula)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className="text-sm border-border/50"
        />

        {/* Manual save button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleManualSave}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar agora (Ctrl+S)
          </Button>
        </div>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50"
      >
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">💡 Dica:</span> Seus insights são salvos automaticamente. Use{' '}
          <kbd className="px-2 py-1 bg-background rounded text-xs">Ctrl+S</kbd> para salvar
          imediatamente.
        </p>
      </motion.div>
    </motion.div>
  );
};
