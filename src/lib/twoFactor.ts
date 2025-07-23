import { supabase } from './supabase'

// Generate a 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Store verification code in database
export async function storeVerificationCode(userId: string, code: string): Promise<boolean> {
  try {
    // Delete any existing unused codes for this user
    await supabase
      .from('two_factor_codes')
      .delete()
      .eq('user_id', userId)
      .eq('used', false)

    // Store new code with 5-minute expiration
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    const { error } = await supabase
      .from('two_factor_codes')
      .insert([{
        user_id: userId,
        code: code,
        expires_at: expiresAt.toISOString()
      }])

    return !error
  } catch (error) {
    console.error('Error storing verification code:', error)
    return false
  }
}

// Verify 2FA code
export async function verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('two_factor_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return false
    }

    // Mark code as used
    await supabase
      .from('two_factor_codes')
      .update({ used: true })
      .eq('id', data.id)

    return true
  } catch (error) {
    console.error('Error verifying 2FA code:', error)
    return false
  }
}

// Clean up expired codes (should be run periodically)
export async function cleanupExpiredCodes(): Promise<void> {
  try {
    await supabase
      .from('two_factor_codes')
      .delete()
      .lt('expires_at', new Date().toISOString())
  } catch (error) {
    console.error('Error cleaning up expired codes:', error)
  }
}

// Simple email simulation (in production, use a real email service)
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  // In a real application, you would integrate with an email service like:
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP
  // - Resend
  
  console.log(`📧 Sending verification code to ${email}: ${code}`)
  
  // For development, we'll just log it and return success
  // In production, replace this with actual email sending logic
  return true
}
