import { NextRequest, NextResponse } from 'next/server'
import { savePokemonToCollection, updateUserCredits, getUserCredits } from '@/lib/pokemonCollection'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.userId || !body.pokemon) {
      return NextResponse.json(
        { error: 'ID de usuario y datos del Pokémon son requeridos' },
        { status: 400 }
      )
    }

    const { userId, pokemon, creditsUsed } = body

    // Validate Pokemon data
    if (!pokemon.id || !pokemon.name || !pokemon.type || !pokemon.rarity || !pokemon.image) {
      return NextResponse.json(
        { error: 'Datos del Pokémon incompletos' },
        { status: 400 }
      )
    }

    // Get current user credits
    const currentCredits = await getUserCredits(userId)
    
    if (currentCredits < creditsUsed) {
      return NextResponse.json(
        { error: 'No tienes suficientes pokébolas' },
        { status: 400 }
      )
    }

    // Save Pokemon to collection
    const pokemonSaved = await savePokemonToCollection(userId, pokemon)
    
    if (!pokemonSaved) {
      return NextResponse.json(
        { error: 'Error al guardar el Pokémon en la colección' },
        { status: 500 }
      )
    }

    // Update user credits
    const newCredits = currentCredits - creditsUsed
    const creditsUpdated = await updateUserCredits(userId, newCredits)
    
    if (!creditsUpdated) {
      return NextResponse.json(
        { error: 'Error al actualizar las pokébolas' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Pokémon capturado exitosamente',
        pokemon: pokemon,
        creditsRemaining: newCredits
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Pokemon catch error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
