import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyTwoFactorCode } from '@/lib/twoFactor'
import { getUserPokemonCollection, getUserCredits } from '@/lib/pokemonCollection'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.userId || !body.code) {
      return NextResponse.json(
        { error: 'ID de usuario y código son requeridos' },
        { status: 400 }
      )
    }

    // Verify the 2FA code
    const isValidCode = await verifyTwoFactorCode(body.userId, body.code)
    
    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Código de verificación inválido o expirado' },
        { status: 401 }
      )
    }

    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, credits, created_at')
      .eq('id', body.userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Get user's Pokemon collection and credits
    const pokemonCollection = await getUserPokemonCollection(user.id)
    const userCredits = await getUserCredits(user.id)

    // Return success response with user data and collection
    return NextResponse.json(
      {
        message: 'Verificación exitosa',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          created_at: user.created_at,
          credits: userCredits,
          pokedex: pokemonCollection
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
