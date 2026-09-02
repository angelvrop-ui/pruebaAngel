Supabase setup for `orders` table

1) Create table `orders` with columns:
   - id: uuid (Primary key) default: gen_random_uuid()
   - user_id: text
   - user_email: text
   - items: jsonb
   - total: numeric
   - created_at: timestamptz default: now()

   4) Profiles table (store user metadata)

   Run this SQL to create a `profiles` table and RLS policies:

   ```sql
   create table if not exists public.profiles (
      user_id uuid primary key,
      full_name text,
      email text,
      dob date,
      created_at timestamptz default now()
   );

   alter table public.profiles enable row level security;

   drop policy if exists "Insert own profile" on public.profiles;
   create policy "Insert own profile"
      on public.profiles
      for insert
      with check ( user_id = auth.uid()::uuid );

   drop policy if exists "Select own profile" on public.profiles;
   create policy "Select own profile"
      on public.profiles
      for select
      using ( user_id = auth.uid()::uuid );

   drop policy if exists "Update own profile" on public.profiles;
   create policy "Update own profile"
      on public.profiles
      for update
      using ( user_id = auth.uid()::uuid )
      with check ( user_id = auth.uid()::uuid );
   ```

2) Policies (Row Level Security):
   - Enable RLS on `orders` table.
   - Create policy to allow authenticated users to INSERT their own orders:
     ```sql
     CREATE POLICY "Insert orders for authenticated users"
     ON public.orders
     FOR INSERT
     USING (auth.role() = 'authenticated');
     ```

   - Optionally restrict SELECT to the same user only:
     ```sql
     CREATE POLICY "Select own orders"
     ON public.orders
     FOR SELECT
     USING (user_id = auth.uid());
     ```

3) Testing:
   - From the client (publishable key + authenticated user), checkout will call `supabase.from('orders').insert(...)`.
   - If you prefer server-side inserts, use the service_role key from a secure server.

Notes:
- The publishable key (anon) only works if policies permit authenticated inserts. Never embed the service_role key in client code.
