import { NextRequest, NextResponse } from 'next/server'
import { supabase, verifyPassword, UserLogin } from '@/lib/supabase'
import { generateVerificationCode, storeVerificationCode, sendVerificationEmail } from '@/lib/twoFactor'
import { getUserPokemonCollection } from '@/lib/pokemonCollection'

export async function POST(request: NextRequest) {
  try {
    const body: UserLogin = await request.json()
    
    // Validate required fields
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username y password son requeridos' },
        { status: 400 }
      )
    }

    // Find user by username
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, password_hash, two_factor_enabled, created_at')
      .eq('username', body.username)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(body.password, user.password_hash)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      // Generate and send 2FA verification code
      const verificationCode = generateVerificationCode()
      const codeStored = await storeVerificationCode(user.id, verificationCode)
      
      if (!codeStored) {
        console.error('Error storing verification code')
        return NextResponse.json(
          { error: 'Error al generar código de verificación' },
          { status: 500 }
        )
      }

      const emailSent = await sendVerificationEmail(user.email, verificationCode)
      
      if (!emailSent) {
        console.error('Error sending verification email')
        return NextResponse.json(
          { error: 'Error al enviar código de verificación' },
          { status: 500 }
        )
      }

      // Return response requiring 2FA verification
      return NextResponse.json(
        {
          message: 'Se ha enviado un código de verificación a tu email.',
          requiresTwoFactor: true,
          userId: user.id,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            created_at: user.created_at
          }
        },
        { status: 200 }
      )
    }

    // Load user's Pokemon collection
    const userCollection = await getUserPokemonCollection(user.id);

    // Return success response (without password hash) - no 2FA required
    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          created_at: user.created_at,
          pokedex: userCollection
        },
        message: 'Inicio de sesión exitoso'
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
