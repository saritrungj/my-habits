export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      myhabit_workspaces: Table<
        { user_id: string; payload: Json; revision: number; updated_at: string },
        { user_id: string; payload?: Json; revision?: number; updated_at?: string },
        { payload?: Json; revision?: number; updated_at?: string }
      >
      myhabit_mutation_receipts: Table<
        { user_id: string; mutation_id: string; revision: number; created_at: string },
        { user_id: string; mutation_id: string; revision: number; created_at?: string },
        never
      >
      habit_days: Table<
        { user_id: string; day: string; habits: Json; updated_at: string },
        { user_id?: string; day: string; habits?: Json; updated_at?: string },
        { habits?: Json; updated_at?: string }
      >
    }
    Views: Record<string, never>
    Functions: {
      myhabit_save_workspace: {
        Args: { p_payload: Json; p_expected_revision: number; p_mutation_id: string }
        Returns: { revision: number }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
