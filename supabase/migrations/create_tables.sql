-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum types
create type client_type as enum ('Residential', 'Commercial', 'Municipal');
create type job_status as enum ('Scheduled', 'In Progress', 'Completed', 'Cancelled');
create type equipment_status as enum ('Available', 'In Use', 'In Repair', 'Retired');
create type equipment_condition as enum ('Excellent', 'Good', 'Fair', 'Poor');
create type maintenance_type as enum ('Routine', 'Repair', 'Inspection');
create type recurring_type as enum ('none', 'weekly', 'biweekly', 'monthly');

-- Create clients table
create table if not exists clients (
  id bigint primary key generated always as identity,
  name text not null,
  email text,
  phone text,
  address text,
  type client_type not null default 'Residential',
  active_jobs integer default 0,
  total_spent decimal(10,2) default 0,
  last_service timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create jobs table
create table if not exists jobs (
  id bigint primary key generated always as identity,
  client_id bigint references clients(id) on delete cascade,
  service text not null,
  date date not null,
  time_slot text,
  status job_status not null default 'Scheduled',
  notes text,
  total_amount decimal(10,2),
  crew text[],
  recurring_type recurring_type not null default 'none',
  recurring_day integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create equipment table
create table if not exists equipment (
  id bigint primary key generated always as identity,
  name text not null,
  type text not null,
  model text,
  serial_number text,
  manufacturer text,
  supplier text,
  purchase_date date,
  purchase_price decimal(10,2),
  warranty_expiration date,
  status equipment_status not null default 'Available',
  condition equipment_condition not null default 'Good',
  location text,
  assigned_to text,
  next_service_date date,
  notes text,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create maintenance_records table
create table if not exists maintenance_records (
  id bigint primary key generated always as identity,
  equipment_id bigint references equipment(id) on delete cascade,
  date date not null,
  type maintenance_type not null,
  description text not null,
  cost decimal(10,2) not null default 0,
  performed_by text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create receipts table
create table if not exists receipts (
  id bigint primary key generated always as identity,
  job_id bigint references jobs(id) on delete set null,
  date date not null,
  vendor text not null,
  total_amount decimal(10,2) not null,
  items jsonb,
  image_url text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create function to increment active jobs
create or replace function increment_active_jobs(p_client_id bigint)
returns void as $$
begin
  update clients
  set active_jobs = active_jobs + 1
  where id = p_client_id;
end;
$$ language plpgsql;

-- Create function to decrement active jobs
create or replace function decrement_active_jobs(p_client_id bigint)
returns void as $$
begin
  update clients
  set active_jobs = greatest(0, active_jobs - 1)
  where id = p_client_id;
end;
$$ language plpgsql;

-- Create function to update client stats when a job is completed
create or replace function update_client_completed_job(p_client_id bigint, p_amount decimal)
returns void as $$
begin
  update clients
  set 
    active_jobs = greatest(0, active_jobs - 1),
    total_spent = total_spent + p_amount,
    last_service = now()
  where id = p_client_id;
end;
$$ language plpgsql;

-- Create function to update equipment status and maintenance schedule
create or replace function update_equipment_maintenance(p_equipment_id bigint, p_maintenance_type maintenance_type, p_cost decimal)
returns void as $$
begin
  -- Update equipment status based on maintenance type
  update equipment
  set 
    status = case 
      when p_maintenance_type = 'Repair' then 'In Repair'::equipment_status
      else status
    end,
    next_service_date = case 
      when p_maintenance_type = 'Routine' then now() + interval '3 months'
      else next_service_date
    end,
    updated_at = now()
  where id = p_equipment_id;
end;
$$ language plpgsql;

-- Create indexes for better performance
create index if not exists idx_jobs_client_id on jobs(client_id);
create index if not exists idx_jobs_date on jobs(date);
create index if not exists idx_jobs_status on jobs(status);
create index if not exists idx_equipment_status on equipment(status);
create index if not exists idx_equipment_type on equipment(type);
create index if not exists idx_maintenance_records_equipment_id on maintenance_records(equipment_id);
create index if not exists idx_receipts_job_id on receipts(job_id);
create index if not exists idx_receipts_date on receipts(date); 