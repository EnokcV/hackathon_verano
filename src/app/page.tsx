"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import ClientOnly from "../components/ClientOnly";
import TwoFactorVerification from "../components/TwoFactorVerification";

// Lista de pokebolas válidas (solo archivos con 'ball' y sin '_open', 'empty', 'fainted')
const POKEBALL_IMAGES = [
  ...Array(24).keys()
].map(i => `/battle/ball${i.toString().padStart(2, '0')}.png`);


// Tipos
interface Pokemon {
  id: number;
  name: string;
  type: string;
  rarity: string;
  shiny: boolean;
  image: string;
}

type User = {
  id: string;
  username: string;
  email: string;
  credits: number;
  pokedex: Pokemon[];
};

type TwoFactorState = {
  userId: string;
  email: string;
  userData: any;
} | null;

const RARITY_PROBABILITIES: Record<string, number> = {
  Common: 0.6,
  Uncommon: 0.2,
  Rare: 0.1,
  Epic: 0.05,
  Legendary: 0.02,
};

const RARITY_COLORS: Record<string, string> = {
  Common: "#AAAAAA",
  Uncommon: "#7AC74C",
  Rare: "#6390F0",
  Epic: "#EE8130",
  Legendary: "#F7D02C",
};

// Login/Signup form
function LoginSignupForm({ onAuth }: { onAuth: (user: any) => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignup) {
        // Registration
        if (!email.trim() || !username.trim() || !password.trim()) {
          setError("Todos los campos son requeridos para el registro");
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            username: username.trim(),
            password: password.trim()
          })
        });

        const data = await response.json();

        if (response.ok) {
          // Registration successful, now login
          onAuth(data.user);
        } else {
          setError(data.error || 'Error en el registro');
        }
      } else {
        // Login
        if (!username.trim() || !password.trim()) {
          setError("Usuario y contraseña son requeridos");
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.trim(),
            password: password.trim()
          })
        });

        const data = await response.json();

        if (response.ok) {
          // Login successful
          onAuth(data.user);
        } else {
          setError(data.error || 'Error en el inicio de sesión');
        }
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>{isSignup ? "Registro" : "Iniciar sesión"}</h2>
        
        {isSignup && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        )}
        
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        
        {error && <div className="error">{error}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? "Cargando..." : (isSignup ? "Registrarse" : "Entrar")}
        </button>
        <div className="toggle-auth">
          {isSignup ? (
            <span>
              ¿Ya tienes cuenta?{' '}
              <a onClick={() => setIsSignup(false)}>Inicia sesión</a>
            </span>
          ) : (
            <span>
              ¿No tienes cuenta?{' '}
              <a onClick={() => setIsSignup(true)}>Regístrate</a>
            </span>
          )}
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
          min-width: 300px;
        }
        .auth-form input {
          padding: 0.5rem;
          border: 1px solid #aaa;
          border-radius: 6px;
        }
        .auth-form button {
          background: #6390F0;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.6rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .auth-form button:hover {
          background: #4568b2;
        }
        .toggle-auth a {
          color: #6390F0;
          cursor: pointer;
          text-decoration: underline;
        }
        .error {
          color: #e53935;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

// Pokemon Card destacado
function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
  return (
    <div
      className="pokemon-card"
      style={{ background: RARITY_COLORS[pokemon.rarity] || "#f7f7fa", transition: "background 0.4s" }}
    >
      <img
        src={
          pokemon.shiny
            ? pokemon.image.replace("./Front/", "/FrontShiny/")
            : pokemon.image.replace("./", "/")
        }
        alt={pokemon.name}
        width={180}
        height={180}
        style={undefined}
      />
      <h3>{pokemon.name}</h3>
      <div className="pokemon-type">{pokemon.type}</div>
      <div
        className="pokemon-rarity"
        style={{ background: "rgba(0,0,0,0.33)", color: "#fff" }}
      >
        {pokemon.rarity}
      </div>
      {pokemon.shiny && <span className="shiny">✨ Shiny</span>}
      <style jsx>{`
        .pokemon-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          /* El color de fondo ahora lo controla el style prop */
          border-radius: 16px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.11);
          padding: 2rem 1.5rem;
          margin: 1rem 0;
        }
        .pokemon-type {
          color: #333;
          margin-bottom: 0.5rem;
        }
        .pokemon-rarity {
          color: #fff;
          padding: 0.2rem 0.8rem;
          border-radius: 12px;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .shiny {
          color: gold;
          font-weight: bold;
          font-size: 1.1rem;
        }
      `}</style>
    </div>
  );
}

// Pokédex del usuario
function Pokedex({ pokemons }: { pokemons: Pokemon[] }) {
  if (!pokemons.length) return <div className="empty-pokedex">Aún no tienes Pokémon en tu Pokédex.</div>;
  return (
    <div className="pokedex">
      {pokemons.map(p => (
        <div
          key={p.id + (p.shiny ? "-shiny" : "")}
          className="pokedex-item"
          title={p.name}
          style={{ background: RARITY_COLORS[p.rarity] || "#fff"}}
        >
          <img src={
          p.shiny
            ? p.image.replace("./Front/", "/FrontShiny/")
            : p.image.replace("./", "/")
        } alt={p.name} width={60} height={60} />
          <span>{p.name}</span>
          {p.shiny && <span className="shiny">✨</span>}
        </div>
      ))}
      <style jsx>{`
        .pokedex {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin: 1.5rem 0;
        }
        .pokedex-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.07);
          padding: 0.5rem 1rem;
        }
        .shiny {
          color: gold;
          font-size: 1.1rem;
        }
        .empty-pokedex {
          color: #888;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}

// Botón de Roll
function RollButton({ onRoll, loading, disabled }: { onRoll: () => void; loading: boolean, disabled?: boolean }) {
  return (
    <>
      <button className="roll-btn" onClick={onRoll} disabled={loading||disabled}>
        {loading ? "Abriendo..." : disabled ? "Sin pokébolas" : "¡Abrir Pokébola!"}
      </button>
      <style jsx>{`
        .roll-btn {
          background: linear-gradient(90deg, #6390F0 60%, #7AC74C 100%);
          color: #fff;
          font-size: 1.3rem;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          padding: 1rem 2.5rem;
          margin: 1.5rem 0;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(99,144,240,0.12);
          transition: background 0.2s, transform 0.1s;
        }
        .roll-btn:active {
          transform: scale(0.98);
        }
        .roll-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

// Lógica de roll de rareza
function getRandomRarity(): string {
  const rand = Math.random();
  let acc = 0;
  for (const [rarity, prob] of Object.entries(RARITY_PROBABILITIES)) {
    acc += prob;
    if (rand < acc) return rarity;
  }
  return "Common";
}

function getRandomPokemonByRarity(pokemons: Pokemon[], rarity: string): Pokemon | null {
  const filtered = pokemons.filter(p => p.rarity === rarity);
  if (!filtered.length) return null;
  // 5% de probabilidad de shiny
  const base = filtered[Math.floor(Math.random() * filtered.length)];
  const isShiny = Math.random() < 0.025;
  return { ...base, shiny: isShiny };
}

// Componente auxiliar para pokebolas flotantes
function PokeballSpawner({ onCollect }: { onCollect: () => void }) {
  // Estado: array de pokebolas en pantalla
  const [balls, setBalls] = useState<{id:number, x:number, y:number, img:string}[]>([]);
  
  // Añadir pokebola aleatoria cada X segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now() + Math.random();
      const x = Math.random() * 80 + 5; // 5% - 85% horizontal
      const y = Math.random() * 70 + 10; // 10% - 80% vertical
      const img = POKEBALL_IMAGES[Math.floor(Math.random()*POKEBALL_IMAGES.length)];
      setBalls(balls => balls.length >= 5 ? balls : [...balls, {id, x, y, img}]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  // Eliminar bola al recolectar
  const handleCollect = (id:number) => {
    setBalls(balls => balls.filter(b => b.id !== id));
    onCollect();
  };
  return (
    <>
      {balls.map(ball => (
        <img
          key={ball.id}
          src={ball.img}
          alt="pokeball"
          className="pokeball-float"
          style={{
            position: 'fixed',
            left: `${ball.x}%`,
            top: `${ball.y}%`,
            width: 48,
            height: 48*2,
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'top 0.7s, left 0.7s'
          }}
          onClick={() => handleCollect(ball.id)}
        />
      ))}
      <style jsx global>{`
        .pokeball-float {
          filter: drop-shadow(0 2px 8px #2226);
          animation: bounce 1.2s infinite alternate;
        }
        @keyframes bounce {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-14px); }
        }
      `}</style>
    </>
  );
}

// Main Page
export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [error, setError] = useState("");
  const [twoFactorState, setTwoFactorState] = useState<TwoFactorState>(null);

  // Cargar pokemons.json
  useEffect(() => {
    fetch("/pokemos.json")
      .then(res => res.json())
      .then(setPokemons)
      .catch(() => setError("No se pudo cargar la lista de Pokémon"));
  }, []);

  // Handle successful authentication
  const handleAuth = (userData: any) => {
    if (userData.requiresTwoFactor) {
      // Set 2FA state for verification
      setTwoFactorState({
        userId: userData.userId,
        email: userData.user.email,
        userData: userData.user
      });
    } else {
      // Direct login success
      setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        credits: userData.credits || 5,
        pokedex: userData.pokedex || []
      });
      setCurrentPokemon(null);
      setTwoFactorState(null);
    }
  };

  // Handle successful 2FA verification
  const handle2FASuccess = (userData: any) => {
    setUser({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      credits: userData.credits || 5,
      pokedex: userData.pokedex || []
    });
    setCurrentPokemon(null);
    setTwoFactorState(null);
  };

  // Handle 2FA cancellation
  const handle2FACancel = () => {
    setTwoFactorState(null);
  };

  // Cambiar fondo del body según rareza
  useEffect(() => {
    if (
      currentPokemon &&
      (currentPokemon.rarity === "Epic" || currentPokemon.rarity === "Legendary")
    ) {
      document.body.style.transition = "background 0.6s";
      document.body.style.background =
        currentPokemon.rarity === "Legendary"
          ? "linear-gradient(120deg,rgb(255, 224, 100) 0%, #ffffff 100%)"
          : "linear-gradient(120deg,rgb(238, 174, 125) 0%, #ffffff 100%)";
    } else {
      document.body.style.background = "#f7f7fa";
    }
  }, [currentPokemon]);

  // Roll Pokemon with backend integration
  const handleRoll = async () => {
    if (!user || user.credits <= 0) return;
    
    setLoading(true);
    
    try {
      // Generate Pokemon locally first
      const rarity = getRandomRarity();
      const poke = getRandomPokemonByRarity(pokemons, rarity);
      
      if (!poke) {
        setError("No hay Pokémon de rareza " + rarity);
        setLoading(false);
        return;
      }

      // Save Pokemon to backend
      const response = await fetch('/api/pokemon/catch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          pokemon: poke,
          creditsUsed: 1
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state with caught Pokemon and new credits
        setCurrentPokemon(poke);
        setUser(prev => {
          if (!prev) return prev;
          
          const exists = prev.pokedex.find(p => p.id === poke.id && p.shiny === poke.shiny);
          let newPokedex = prev.pokedex;
          
          if (!exists) {
            // Add new Pokemon
            newPokedex = [...prev.pokedex, poke];
          } else if (poke.shiny && !exists.shiny) {
            // Replace normal with shiny
            newPokedex = prev.pokedex.map(p =>
              p.id === poke.id && !p.shiny ? poke : p
            );
          }
          
          return {
            ...prev,
            pokedex: newPokedex,
            credits: data.creditsRemaining
          };
        });
      } else {
        setError(data.error || 'Error al capturar Pokémon');
      }
    } catch (error) {
      setError('Error de conexión al capturar Pokémon');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return <div className="error-page">{error}</div>;
  }

  if (!user) {
    return <LoginSignupForm onAuth={handleAuth} />;
  }

  return (
    <main className="main-container">

      <ClientOnly>
        <PokeballSpawner onCollect={() => setUser(prev => prev ? { ...prev, credits: prev.credits + 1 } : prev)} />
      </ClientOnly>
      <header className="header">
        <h1>Pokédex de {user.username}</h1>
        <button className="logout" onClick={() => setUser(null)}>
          Cerrar sesión
        </button>
      </header>
      <section className="roll-section">
        <div style={{marginBottom:'0.7rem', fontWeight:'bold', fontSize:'1.1rem', color:'#333'}}>
          Pokébolas: <span style={{color:'#6390F0'}}>{user.credits}</span>
        </div>
        <RollButton onRoll={handleRoll} loading={loading} disabled={user.credits<=0} />
        {currentPokemon && (
          <div className="current-pokemon">
            <PokemonCard pokemon={currentPokemon} />
          </div>
        )}
      </section>
      <section>
        <h2>Tu Pokédex</h2>
        <Pokedex pokemons={user.pokedex} />
      </section>
      <style jsx>{`
        .main-container {
          max-width: 700px;
          margin: 0 auto;
          padding: 2rem 1rem 3rem 1rem;
          font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .header h1 {
          font-size: 2.2rem;
          color: #6390F0;
        }
        .logout {
          background: #e53935;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1.2rem;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }
        .logout:hover {
          background: #b71c1c;
        }
        .roll-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .current-pokemon {
          margin-top: 1.5rem;
        }
        .error-page {
          color: #e53935;
          font-size: 1.3rem;
          text-align: center;
          margin-top: 4rem;
        }
      `}</style>
    </main>
  );
}
