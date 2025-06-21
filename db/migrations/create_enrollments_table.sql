-- Create enrollments table to track which exams users are enrolled in
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  exam_ids TEXT[] NOT NULL DEFAULT '{}',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT enrollments_user_id_unique UNIQUE (user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments USING btree (user_id);

-- Set up trigger for updated_at
CREATE TRIGGER set_enrollments_updated_at
BEFORE UPDATE ON public.enrollments
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add RLS (Row Level Security) policies for enrollments table
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own enrollments
CREATE POLICY select_own_enrollments ON public.enrollments
  FOR SELECT USING (user_id = request.header('x-user-id')::text);

-- Policy: Users can update their own enrollments
CREATE POLICY update_own_enrollments ON public.enrollments
  FOR UPDATE USING (user_id = request.header('x-user-id')::text);

-- Policy: Users can insert their own enrollments
CREATE POLICY insert_own_enrollments ON public.enrollments
  FOR INSERT WITH CHECK (user_id = request.header('x-user-id')::text);

-- Policy: Admin can do all operations
CREATE POLICY admin_all_enrollments ON public.enrollments
  USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.user_id = request.header('x-user-id')::text 
    AND 'admin' = ANY(u.role)
  ));

-- Policy: Teachers can view all enrollments
CREATE POLICY teacher_select_enrollments ON public.enrollments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.user_id = request.header('x-user-id')::text 
    AND 'teacher' = ANY(u.role)
  ));

-- Policy: Teachers can update all enrollments
CREATE POLICY teacher_update_enrollments ON public.enrollments
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM users u 
    WHERE u.user_id = request.header('x-user-id')::text 
    AND 'teacher' = ANY(u.role)
  ));

COMMENT ON TABLE public.enrollments IS 'Stores user enrollments in exams';
COMMENT ON COLUMN public.enrollments.exam_ids IS 'Array of exam IDs the user is enrolled in';
