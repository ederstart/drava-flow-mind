-- Criar tabela de histórico de versões dos insights
CREATE TABLE public.insight_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}'::text[],
  source TEXT,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Índice para buscar versões de um insight
CREATE INDEX idx_insight_versions_insight_id ON public.insight_versions(insight_id);
CREATE INDEX idx_insight_versions_created_at ON public.insight_versions(created_at DESC);

-- RLS para insight_versions
ALTER TABLE public.insight_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insight versions"
ON public.insight_versions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own insight versions"
ON public.insight_versions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insight versions"
ON public.insight_versions
FOR DELETE
USING (auth.uid() = user_id);

-- Função para criar versão e limitar a 15 versões
CREATE OR REPLACE FUNCTION public.create_insight_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_version_number INTEGER;
  versions_count INTEGER;
BEGIN
  -- Obter próximo número de versão
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version_number
  FROM public.insight_versions
  WHERE insight_id = NEW.id;

  -- Criar nova versão
  INSERT INTO public.insight_versions (
    insight_id,
    title,
    content,
    tags,
    source,
    version_number,
    user_id
  ) VALUES (
    NEW.id,
    NEW.title,
    NEW.content,
    NEW.tags,
    NEW.source,
    next_version_number,
    NEW.user_id
  );

  -- Contar versões existentes
  SELECT COUNT(*)
  INTO versions_count
  FROM public.insight_versions
  WHERE insight_id = NEW.id;

  -- Se tiver mais de 15, deletar as mais antigas
  IF versions_count > 15 THEN
    DELETE FROM public.insight_versions
    WHERE id IN (
      SELECT id
      FROM public.insight_versions
      WHERE insight_id = NEW.id
      ORDER BY version_number ASC
      LIMIT (versions_count - 15)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger para criar versão automaticamente ao atualizar insight
CREATE TRIGGER create_version_on_insight_update
AFTER UPDATE ON public.insights
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content OR OLD.title IS DISTINCT FROM NEW.title)
EXECUTE FUNCTION public.create_insight_version();