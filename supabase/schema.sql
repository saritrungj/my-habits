-- ตารางเก็บเช็กลิสต์รายวัน: 1 แถว = 1 วันของผู้ใช้ 1 คน
create table if not exists public.habit_days (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  day        date        not null,
  habits     jsonb       not null default '{}'::jsonb,   -- เช่น {"wake":true,"dog":true,"am":false}
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

-- เปิด Row Level Security: แต่ละคนเห็นและแก้ได้เฉพาะข้อมูลของตัวเอง
alter table public.habit_days enable row level security;

drop policy if exists "read own days"   on public.habit_days;
drop policy if exists "insert own days" on public.habit_days;
drop policy if exists "update own days" on public.habit_days;
drop policy if exists "delete own days" on public.habit_days;

create policy "read own days"   on public.habit_days for select to authenticated using (auth.uid() = user_id);
create policy "insert own days" on public.habit_days for insert to authenticated with check (auth.uid() = user_id);
create policy "update own days" on public.habit_days for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own days" on public.habit_days for delete to authenticated using (auth.uid() = user_id);
