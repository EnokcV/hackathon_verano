import { NextRequest, NextResponse } from 'next/server'
import { updateUserCredits, getUserCredits } from '@/lib/pokemonCollection'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.userId) {
      return NextResponse.json(
        { error: 'ID de usuario es requerido' },
        { status: 400 }
      )
    }

    const { userId } = body

    // Get current user credits
    const currentCredits = await getUserCredits(userId)
    
    // Add one pokeball
    const newCredits = currentCredits + 1
    const creditsUpdated = await updateUserCredits(userId, newCredits)
    
    if (!creditsUpdated) {
      return NextResponse.json(
        { error: 'Error al actualizar las pokébolas' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Pokébola recolectada',
        creditsTotal: newCredits
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Pokeball collection error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
