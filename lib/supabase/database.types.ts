export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          owner_id: string;
          display_name: string;
          base_salary: number;
          currency: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          display_name?: string;
          base_salary?: number;
          currency?: string;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          owner_id: string;
          display_name: string;
          base_salary: number;
          currency: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      purpose_accounts: {
        Row: {
          id: string;
          owner_id: string;
          purpose_type: string;
          bank_name: string;
          card_name: string;
          monthly_limit: number;
          usage_summary: string;
          note: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          purpose_type: string;
          bank_name?: string;
          card_name?: string;
          monthly_limit?: number;
          usage_summary?: string;
          note?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          owner_id: string;
          purpose_type: string;
          bank_name: string;
          card_name: string;
          monthly_limit: number;
          usage_summary: string;
          note: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      living_groups: {
        Row: {
          id: string;
          owner_id: string;
          group_type: string;
          label: string;
          default_amount: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          group_type: string;
          label: string;
          default_amount?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          owner_id: string;
          group_type: string;
          label: string;
          default_amount: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      months: {
        Row: {
          id: string;
          owner_id: string;
          yyyymm: string;
          salary_amount: number;
          carry_cash_from_prev: number;
          status: "draft" | "closed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          yyyymm: string;
          salary_amount?: number;
          carry_cash_from_prev?: number;
          status?: "draft" | "closed";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          owner_id: string;
          yyyymm: string;
          salary_amount: number;
          carry_cash_from_prev: number;
          status: "draft" | "closed";
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      planned_items: {
        Row: {
          id: string;
          owner_id: string;
          month_id: string;
          category_type: string;
          item_name: string;
          amount: number;
          card_name: string;
          memo: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          month_id: string;
          category_type: string;
          item_name: string;
          amount?: number;
          card_name?: string;
          memo?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          owner_id: string;
          month_id: string;
          category_type: string;
          item_name: string;
          amount: number;
          card_name: string;
          memo: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "planned_items_month_id_fkey";
            columns: ["month_id"];
            isOneToOne: false;
            referencedRelation: "months";
            referencedColumns: ["id"];
          },
        ];
      };
      actual_items: {
        Row: {
          id: string;
          owner_id: string;
          month_id: string;
          category_type: string;
          item_name: string;
          amount: number;
          card_name: string;
          memo: string;
          is_from_plan: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          month_id: string;
          category_type: string;
          item_name: string;
          amount?: number;
          card_name?: string;
          memo?: string;
          is_from_plan?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          owner_id: string;
          month_id: string;
          category_type: string;
          item_name: string;
          amount: number;
          card_name: string;
          memo: string;
          is_from_plan: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "actual_items_month_id_fkey";
            columns: ["month_id"];
            isOneToOne: false;
            referencedRelation: "months";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      monthly_summary: {
        Row: {
          month_id: string;
          owner_id: string;
          yyyymm: string;
          planned_total: number;
          actual_total: number;
          updated_at: string;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
