-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create insights table
CREATE TABLE public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Insights policies
CREATE POLICY "Users can view own insights"
  ON public.insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own insights"
  ON public.insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON public.insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON public.insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create boards table for Kanban
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Boards policies
CREATE POLICY "Users can view own boards"
  ON public.boards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own boards"
  ON public.boards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boards"
  ON public.boards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own boards"
  ON public.boards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create columns table for Kanban
CREATE TABLE public.board_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;

-- Columns policies
CREATE POLICY "Users can view columns of own boards"
  ON public.board_columns FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = board_columns.board_id
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can create columns in own boards"
  ON public.board_columns FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = board_columns.board_id
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update columns in own boards"
  ON public.board_columns FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = board_columns.board_id
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete columns in own boards"
  ON public.board_columns FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards
    WHERE boards.id = board_columns.board_id
    AND boards.user_id = auth.uid()
  ));

-- Create cards table for Kanban
CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES public.board_columns(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES public.insights(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Cards policies
CREATE POLICY "Users can view cards in own boards"
  ON public.cards FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.board_columns
    JOIN public.boards ON boards.id = board_columns.board_id
    WHERE board_columns.id = cards.column_id
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can create cards in own boards"
  ON public.cards FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.board_columns
    JOIN public.boards ON boards.id = board_columns.board_id
    WHERE board_columns.id = cards.column_id
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can update cards in own boards"
  ON public.cards FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.board_columns
    JOIN public.boards ON boards.id = board_columns.board_id
    WHERE board_columns.id = cards.column_id
    AND boards.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete cards in own boards"
  ON public.cards FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.board_columns
    JOIN public.boards ON boards.id = board_columns.board_id
    WHERE board_columns.id = cards.column_id
    AND boards.user_id = auth.uid()
  ));

-- Create drawings table for Canvas
CREATE TABLE public.drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  insight_id UUID REFERENCES public.insights(id) ON DELETE SET NULL,
  title TEXT,
  canvas_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;

-- Drawings policies
CREATE POLICY "Users can view own drawings"
  ON public.drawings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own drawings"
  ON public.drawings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drawings"
  ON public.drawings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drawings"
  ON public.drawings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insights_updated_at
  BEFORE UPDATE ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_columns_updated_at
  BEFORE UPDATE ON public.board_columns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drawings_updated_at
  BEFORE UPDATE ON public.drawings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();