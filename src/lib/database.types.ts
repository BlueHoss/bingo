export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string;
          name: string;
          board_data: string[][]; // 5x5 array of strings
          game_master_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          board_data: string[][];
          game_master_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          board_data?: string[][];
          game_master_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      game_participants: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          completed_cells: number[]; // array of cell indices that are completed
          score: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          completed_cells?: number[];
          score?: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          completed_cells?: number[];
          score?: number;
          joined_at?: string;
        };
      };
      game_invites: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          invited_by: string;
          status: "pending" | "accepted" | "declined";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          invited_by: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          invited_by?: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
