import React, { useState } from 'react'

interface TwoFactorVerificationProps {
  userId: string
  email: string
  onVerificationSuccess: (userData: any) => void
  onCancel: () => void
}

export default function TwoFactorVerification({ 
  userId, 
  email, 
  onVerificationSuccess, 
  onCancel 
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!code.trim() || code.length !== 6) {
        setError('Por favor ingresa un código de 6 dígitos')
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          code: code.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Verification successful
        onVerificationSuccess(data.user)
      } else {
        setError(data.error || 'Error en la verificación')
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>🔐 Verificación de Dos Pasos</h2>
        <p className="verification-text">
          Se ha enviado un código de 6 dígitos a:<br />
          <strong>{email}</strong>
        </p>
        
        <input
          type="text"
          placeholder="Código de 6 dígitos"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          required
          className="code-input"
        />
        
        {error && <div className="error">{error}</div>}
        
        <div className="button-group">
          <button type="submit" disabled={loading || code.length !== 6}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancelar
          </button>
        </div>
        
        <div className="help-text">
          ¿No recibiste el código? Revisa tu carpeta de spam.
        </div>
      </form>
      
      <style jsx>{`
        .auth-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80vh;
        }
        .auth-form {
          background: #fff;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-width: 350px;
          text-align: center;
        }
        .verification-text {
          color: #666;
          margin: 0;
          line-height: 1.5;
        }
        .code-input {
          padding: 1rem;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 1.5rem;
          text-align: center;
          letter-spacing: 0.5rem;
          font-family: monospace;
        }
        .code-input:focus {
          border-color: #6390F0;
          outline: none;
        }
        .button-group {
          display: flex;
          gap: 0.5rem;
        }
        .auth-form button {
          background: #6390F0;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.8rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
          flex: 1;
        }
        .auth-form button:hover:not(:disabled) {
          background: #4568b2;
        }
        .auth-form button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .cancel-btn {
          background: #e53935 !important;
        }
        .cancel-btn:hover {
          background: #b71c1c !important;
        }
        .error {
          color: #e53935;
          font-size: 0.9rem;
          margin: 0;
        }
        .help-text {
          color: #888;
          font-size: 0.85rem;
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  )
}
