-- Consolidated schema for SIPD-RKA application

-- Enable UUID extension just in case we need it
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. User Management (Auth integration)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT UNIQUE,
    username TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'username');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- RPC: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO is_admin
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN coalesce(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get email for username (for login flow)
CREATE OR REPLACE FUNCTION public.admin_email_for_username(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
  found_email TEXT;
BEGIN
  SELECT email INTO found_email
  FROM public.users
  WHERE username = username_input;
  
  RETURN found_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Master Data Tables (Referensi)

-- Master Urusan
CREATE TABLE IF NOT EXISTS master_urusans (
    kode TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Master Bidang Urusan
CREATE TABLE IF NOT EXISTS master_bidang_urusans (
    kode TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    urusan_kode TEXT REFERENCES master_urusans(kode),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Master Program
CREATE TABLE IF NOT EXISTS master_programs (
    kode TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    bidang_urusan_kode TEXT REFERENCES master_bidang_urusans(kode),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Master Kegiatan
CREATE TABLE IF NOT EXISTS master_kegiatans (
    kode TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    program_kode TEXT REFERENCES master_programs(kode),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Master Sub Kegiatan
CREATE TABLE IF NOT EXISTS master_sub_kegiatans (
    kode TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    kegiatan_kode TEXT REFERENCES master_kegiatans(kode),
    kinerja TEXT,
    satuan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Master Sumber Dana
-- Included is_input column from migration
CREATE TABLE IF NOT EXISTS master_sumber_dana (
    id SERIAL PRIMARY KEY,
    kode TEXT UNIQUE,
    nama TEXT NOT NULL,
    is_input BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Master Satuan
CREATE TABLE IF NOT EXISTS master_satuan (
    id SERIAL PRIMARY KEY,
    nama TEXT NOT NULL UNIQUE
);

-- 2. Organization Table (OPD)
CREATE TABLE IF NOT EXISTS opds (
    id SERIAL PRIMARY KEY,
    kode TEXT NOT NULL UNIQUE,
    nama TEXT NOT NULL,
    singkatan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Standar Harga Tables (Split into 4)

-- SSH (Standar Satuan Harga) - Matching Spreadsheet
CREATE TABLE IF NOT EXISTS ssh (
    id SERIAL PRIMARY KEY,
    kode_kelompok_barang TEXT,
    uraian_kelompok_barang TEXT,
    id_standar_harga TEXT, -- keeping as text to be safe, though looks numeric
    kode_barang TEXT,
    uraian_barang TEXT,
    spesifikasi TEXT,
    satuan TEXT,
    harga_satuan NUMERIC DEFAULT 0,
    kode_rekening TEXT,
    tahun INTEGER DEFAULT 2026,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- SBU (Standar Biaya Umum)
CREATE TABLE IF NOT EXISTS sbu (
    id SERIAL PRIMARY KEY,
    kode TEXT, -- Generic kode if structure differs, usually grouped
    uraian TEXT,
    spesifikasi TEXT,
    satuan TEXT,
    harga NUMERIC DEFAULT 0,
    kode_rekening TEXT,
    tahun INTEGER DEFAULT 2026,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- HSPK (Harga Satuan Pokok Kegiatan)
CREATE TABLE IF NOT EXISTS hspk (
    id SERIAL PRIMARY KEY,
    kode TEXT,
    uraian TEXT,
    spesifikasi TEXT,
    satuan TEXT,
    harga NUMERIC DEFAULT 0,
    kode_rekening TEXT,
    tahun INTEGER DEFAULT 2026,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ASB (Analisis Standar Belanja)
CREATE TABLE IF NOT EXISTS asb (
    id SERIAL PRIMARY KEY,
    kode TEXT,
    uraian TEXT,
    spesifikasi TEXT,
    satuan TEXT,
    harga NUMERIC DEFAULT 0,
    kode_rekening TEXT,
    tahun INTEGER DEFAULT 2026,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. RKA Transaction Tables

-- Header RKA
CREATE TABLE IF NOT EXISTS rka_renja (
    id SERIAL PRIMARY KEY,
    opd_id INTEGER REFERENCES opds(id),
    sub_kegiatan_kode TEXT REFERENCES master_sub_kegiatans(kode),
    tahun INTEGER NOT NULL,
    pagu_validasi NUMERIC DEFAULT 0,
    latar_belakang TEXT,
    target_kinerja TEXT,
    status TEXT DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Rincian Belanja
-- Included kode_rekening and koefisien_multi columns from migrations
CREATE TABLE IF NOT EXISTS rka_rincian (
    id SERIAL PRIMARY KEY,
    rka_id INTEGER REFERENCES rka_renja(id) ON DELETE CASCADE,
    uraian TEXT NOT NULL,
    volume NUMERIC DEFAULT 0,
    satuan TEXT,
    harga_satuan NUMERIC DEFAULT 0,
    koefisien TEXT,
    total NUMERIC DEFAULT 0,
    sumber_dana_id INTEGER REFERENCES master_sumber_dana(id),
    jenis_belanja TEXT,
    kode_rekening TEXT,
    koefisien_multi JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Jadwal RKA
CREATE TABLE IF NOT EXISTS rka_jadwal (
    id SERIAL PRIMARY KEY,
    tahapan TEXT NOT NULL,
    mulai DATE NOT NULL,
    selesai DATE NOT NULL,
    status TEXT DEFAULT 'Aktif', -- Aktif, Selesai, Terkunci
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ssh_uraian ON ssh USING gin(to_tsvector('indonesian', uraian_barang));
CREATE INDEX IF NOT EXISTS idx_ssh_kode_rekening ON ssh(kode_rekening);
CREATE INDEX IF NOT EXISTS idx_sbu_uraian ON sbu USING gin(to_tsvector('indonesian', uraian));
CREATE INDEX IF NOT EXISTS idx_hspk_uraian ON hspk USING gin(to_tsvector('indonesian', uraian));
CREATE INDEX IF NOT EXISTS idx_asb_uraian ON asb USING gin(to_tsvector('indonesian', uraian));

-- Row Level Security (RLS)
ALTER TABLE master_urusans ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_bidang_urusans ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_kegiatans ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_sub_kegiatans ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_sumber_dana ENABLE ROW LEVEL SECURITY;
ALTER TABLE opds ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssh ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbu ENABLE ROW LEVEL SECURITY;
ALTER TABLE hspk ENABLE ROW LEVEL SECURITY;
ALTER TABLE asb ENABLE ROW LEVEL SECURITY;
ALTER TABLE rka_renja ENABLE ROW LEVEL SECURITY;
ALTER TABLE rka_rincian ENABLE ROW LEVEL SECURITY;
ALTER TABLE rka_jadwal ENABLE ROW LEVEL SECURITY;

-- Policies (Permissive Policies for Dev/Mockup Auth)

-- Master Urusan
CREATE POLICY "Enable all access for all users" ON master_urusans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Master Bidang Urusan
CREATE POLICY "Enable all access for all users" ON master_bidang_urusans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Master Program
CREATE POLICY "Enable all access for all users" ON master_programs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Master Kegiatan
CREATE POLICY "Enable all access for all users" ON master_kegiatans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Master Sub Kegiatan
CREATE POLICY "Enable all access for all users" ON master_sub_kegiatans FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Master Sumber Dana
CREATE POLICY "Enable all access for all users" ON master_sumber_dana FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- OPDs
CREATE POLICY "Enable all access for all users" ON opds FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Standar Harga (SSH, SBU, HSPK, ASB)
CREATE POLICY "Enable all access for all users" ON ssh FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON sbu FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON hspk FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON asb FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- RKA Tables
CREATE POLICY "Enable all access for all users" ON rka_renja FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON rka_rincian FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for all users" ON rka_jadwal FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
