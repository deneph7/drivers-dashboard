export type UserRole = 'admin' | 'driver' | 'viewer'
export type DriverStatusEnum = 'available' | 'unavailable' | 'contact'

export interface Profile {
  id: string
  name: string
  initial: string
  role: UserRole
  recent_vehicles: string[]
  sort_order: number | null
  created_at: string
}

export interface DriverStatus {
  driver_id: string
  status: DriverStatusEnum
  vehicle_number: string | null
  return_time: string | null
  updated_at: string
  updated_by: string | null
}

export interface DriverWithStatus {
  driver_id: string
  status: DriverStatusEnum
  vehicle_number: string | null
  return_time: string | null
  updated_at: string
  updated_by: string | null
  profiles: Profile
}

// Supabase Database generic type — Supabase 클라이언트 제네릭에 필요한 정확한 구조
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          initial: string
          role: UserRole
          recent_vehicles: string[]
          sort_order: number | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          initial: string
          role?: UserRole
          recent_vehicles?: string[]
          sort_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          initial?: string
          role?: UserRole
          recent_vehicles?: string[]
          sort_order?: number | null
          created_at?: string
        }
        Relationships: []
      }
      driver_status: {
        Row: {
          driver_id: string
          status: DriverStatusEnum
          vehicle_number: string | null
          return_time: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          driver_id: string
          status?: DriverStatusEnum
          vehicle_number?: string | null
          return_time?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          driver_id?: string
          status?: DriverStatusEnum
          vehicle_number?: string | null
          return_time?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'driver_status_driver_id_fkey'
            columns: ['driver_id']
            isOneToOne: true
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      driver_status_enum: DriverStatusEnum
    }
    CompositeTypes: Record<string, never>
  }
}
