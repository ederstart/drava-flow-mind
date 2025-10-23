import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, PencilBrush } from 'fabric';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Pen, Eraser, Save, Trash2 } from 'lucide-react';

type Tool = 'pen' | 'eraser';

export const CanvasBoard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#1F2937');

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth - 300,
      height: window.innerHeight - 120,
      backgroundColor: '#ffffff',
    });

    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = color;
    canvas.freeDrawingBrush.width = 3;

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = true;
    
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = tool === 'eraser' ? '#ffffff' : color;
      fabricCanvas.freeDrawingBrush.width = tool === 'eraser' ? 20 : 3;
    }
  }, [tool, color, fabricCanvas]);

  const saveDrawing = async () => {
    if (!fabricCanvas) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const json = fabricCanvas.toJSON();
      
      await supabase.from('drawings').insert([{
        user_id: user.id,
        title: 'Canvas',
        canvas_data: json,
      }]);
      
      toast.success('Canvas salvo!');
    } catch (error: any) {
      toast.error('Erro ao salvar');
    }
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    toast.success('Canvas limpo!');
  };

  const colors = ['#1F2937', '#EF4444', '#3B82F6', '#10B981'];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex gap-2">
          <Button size="icon" variant={tool === 'pen' ? 'default' : 'outline'} onClick={() => setTool('pen')}>
            <Pen className="w-4 h-4" />
          </Button>
          <Button size="icon" variant={tool === 'eraser' ? 'default' : 'outline'} onClick={() => setTool('eraser')}>
            <Eraser className="w-4 h-4" />
          </Button>
          {colors.map((c) => (
            <button 
              key={c} 
              className="w-8 h-8 rounded-full border-2" 
              style={{ backgroundColor: c, borderColor: color === c ? '#000' : '#ddd' }} 
              onClick={() => setColor(c)} 
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={clearCanvas}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button size="sm" onClick={saveDrawing}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>
      <div className="flex-1 bg-canvas">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};
