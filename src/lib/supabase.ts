import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wmppfsxbuxldighbdnws.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtcHBmc3hidXhsZGlnaGJkbndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTExMTYsImV4cCI6MjA2ODI2NzExNn0.xYQtBShOxQPZalgtWJhfhm6R0XTXnYSSvlSDOc5YN6s'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  username: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface UserRegistration {
  email: string
  username: string
  password: string
}

export interface UserLogin {
  username: string
  password: string
}

// Utility functions for password hashing
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcryptjs')
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require('bcryptjs')
  return await bcrypt.compare(password, hash)
}
