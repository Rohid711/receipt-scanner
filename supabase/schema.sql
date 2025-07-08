-- Create tables
CREATE TABLE IF NOT EXISTS public.clients (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    type TEXT CHECK (type IN ('Residential', 'Commercial', 'Municipal')),
    active_jobs INTEGER DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    last_service TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.jobs (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES public.clients(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    status TEXT CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Scheduled',
    date TIMESTAMP WITH TIME ZONE,
    description TEXT,
    total_amount DECIMAL(10,2),
    recurring_type TEXT CHECK (recurring_type IN ('none', 'weekly', 'biweekly', 'monthly')) DEFAULT 'none',
    recurring_day INTEGER CHECK (recurring_day >= 1 AND recurring_day <= 31),
    next_occurrence TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.equipment (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT CHECK (status IN ('Available', 'In Use', 'Maintenance', 'Out of Service')) DEFAULT 'Available',
    purchase_date DATE,
    last_maintenance DATE,
    next_maintenance DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.receipts (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES public.jobs(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create functions for managing client stats
CREATE OR REPLACE FUNCTION public.increment_active_jobs(p_client_id BIGINT)
RETURNS void AS $$
BEGIN
    UPDATE public.clients
    SET active_jobs = active_jobs + 1,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.decrement_active_jobs(p_client_id BIGINT)
RETURNS void AS $$
BEGIN
    UPDATE public.clients
    SET active_jobs = GREATEST(active_jobs - 1, 0),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_client_completed_job(p_client_id BIGINT, p_amount DECIMAL)
RETURNS void AS $$
BEGIN
    UPDATE public.clients
    SET active_jobs = GREATEST(active_jobs - 1, 0),
        total_spent = total_spent + p_amount,
        last_service = TIMEZONE('utc'::text, NOW()),
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_client_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.clients
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.clients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.clients
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.clients
    FOR DELETE USING (true);

-- Repeat similar policies for other tables
CREATE POLICY "Enable read access for all users" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.jobs FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.jobs FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.equipment FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.equipment FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.equipment FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.receipts FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.receipts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.receipts FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.receipts FOR DELETE USING (true); 