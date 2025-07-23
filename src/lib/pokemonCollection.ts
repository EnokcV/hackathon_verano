import { supabase } from './supabase'

export interface Pokemon {
  id: number
  name: string
  type: string
  rarity: string
  shiny: boolean
  image: string
}

export interface UserPokemon {
  id: string
  user_id: string
  pokemon_id: number
  pokemon_name: string
  pokemon_type: string
  rarity: string
  is_shiny: boolean
  image_url: string
  caught_at: string
}

// Save a caught Pokemon to user's collection
export async function savePokemonToCollection(userId: string, pokemon: Pokemon): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_pokemon')
      .insert([{
        user_id: userId,
        pokemon_id: pokemon.id,
        pokemon_name: pokemon.name,
        pokemon_type: pokemon.type,
        rarity: pokemon.rarity,
        is_shiny: pokemon.shiny,
        image_url: pokemon.image
      }])

    if (error) {
      // If it's a duplicate constraint error, that's okay - user already has this Pokemon
      if (error.code === '23505') {
        return true
      }
      console.error('Error saving Pokemon to collection:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error saving Pokemon to collection:', error)
    return false
  }
}

// Get user's Pokemon collection
export async function getUserPokemonCollection(userId: string): Promise<Pokemon[]> {
  try {
    const { data, error } = await supabase
      .from('user_pokemon')
      .select('*')
      .eq('user_id', userId)
      .order('caught_at', { ascending: false })

    if (error) {
      console.error('Error fetching Pokemon collection:', error)
      return []
    }

    // Convert database format to frontend format
    return data.map((userPokemon: UserPokemon) => ({
      id: userPokemon.pokemon_id,
      name: userPokemon.pokemon_name,
      type: userPokemon.pokemon_type,
      rarity: userPokemon.rarity,
      shiny: userPokemon.is_shiny,
      image: userPokemon.image_url
    }))
  } catch (error) {
    console.error('Error fetching Pokemon collection:', error)
    return []
  }
}

// Update user credits
export async function updateUserCredits(userId: string, credits: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ credits: credits })
      .eq('id', userId)

    return !error
  } catch (error) {
    console.error('Error updating user credits:', error)
    return false
  }
}

// Get user credits
export async function getUserCredits(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return 0
    }

    return data.credits || 0
  } catch (error) {
    console.error('Error fetching user credits:', error)
    return 0
  }
}
