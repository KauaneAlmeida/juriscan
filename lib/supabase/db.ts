/**
 * Database helper utilities for typed Supabase operations
 * These helpers work around TypeScript inference issues with the Supabase client
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// Generic insert helper that bypasses strict type checking
// Use this when the Supabase client has type inference issues
export async function dbInsert<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  data: T
) {
  return client.from(table).insert(data as never);
}

// Generic insert with select helper
export async function dbInsertAndSelect<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  data: T
) {
  return client.from(table).insert(data as never).select().single();
}

// Generic update helper - returns the query builder for chaining
export function dbUpdateQuery<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  data: T
) {
  return client.from(table).update(data as never);
}

// Generic upsert helper
export async function dbUpsert<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  data: T
) {
  return client.from(table).upsert(data as never);
}
