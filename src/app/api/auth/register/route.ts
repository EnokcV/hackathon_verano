import { NextRequest, NextResponse } from 'next/server'
import { supabase, hashPassword, UserRegistration } from '@/lib/supabase'
import { generateVerificationCode, storeVerificationCode, sendVerificationEmail } from '@/lib/twoFactor'

export async function POST(request: NextRequest) {
  try {
    const body: UserRegistration = await request.json()
    
    // Validate required fields
    if (!body.email || !body.username || !body.password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos: email, username y password' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Formato de email inválido' },
        { status: 400 }
      )
    }

    // Validate username (alphanumeric, 3-50 characters)
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/
    if (!usernameRegex.test(body.username)) {
      return NextResponse.json(
        { error: 'El username debe tener entre 3-50 caracteres y solo contener letras, números y guiones bajos' },
        { status: 400 }
      )
    }

    // Validate password strength (minimum 8 characters, at least one letter and one number)
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/
    if (!passwordRegex.test(body.password)) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres, incluyendo al menos una letra y un número' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      )
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', body.username)
      .single()

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Este username ya está en uso' },
        { status: 409 }
      )
    }

    // Hash the password
    const hashedPassword = await hashPassword(body.password)

    // Insert new user with 2FA enabled by default
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          email: body.email,
          username: body.username,
          password_hash: hashedPassword,
          two_factor_enabled: true,
          credits: 5
        }
      ])
      .select('id, email, username, created_at')
      .single()

    if (error) {
      console.error('Error creating user:', error)
      return NextResponse.json(
        { error: 'Error interno del servidor al crear el usuario' },
        { status: 500 }
      )
    }

    // Generate and send 2FA verification code
    const verificationCode = generateVerificationCode()
    const codeStored = await storeVerificationCode(newUser.id, verificationCode)
    
    if (!codeStored) {
      console.error('Error storing verification code')
      return NextResponse.json(
        { error: 'Error al generar código de verificación' },
        { status: 500 }
      )
    }

    const emailSent = await sendVerificationEmail(body.email, verificationCode)
    
    if (!emailSent) {
      console.error('Error sending verification email')
      return NextResponse.json(
        { error: 'Error al enviar código de verificación' },
        { status: 500 }
      )
    }

    // Return success response requiring 2FA verification
    return NextResponse.json(
      {
        message: 'Usuario registrado. Se ha enviado un código de verificación a tu email.',
        requiresTwoFactor: true,
        userId: newUser.id,
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          created_at: newUser.created_at
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
