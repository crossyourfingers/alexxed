import React, { useState } from 'react';
import { useAuth } from './auth/useAuth';

function RavenSVG({ coverEyes }: { coverEyes: boolean }) {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body - chibi style (large round) */}
      <ellipse cx="70" cy="85" rx="28" ry="32" fill="#1a1a1a" />
      <ellipse cx="70" cy="85" rx="26" ry="30" fill="#2d2d2d" />

      {/* Head - oversized chibi head */}
      <circle cx="70" cy="50" r="30" fill="#1a1a1a" />
      <circle cx="70" cy="50" r="28" fill="#2d2d2d" />

      {/* Cute feather tuft on head */}
      <path d="M 70 22 Q 66 18 64 20 Q 68 16 70 15 Q 72 16 76 20 Q 74 18 70 22 Z" fill="#1a1a1a" />

      {/* Beak - small and cute */}
      <ellipse cx="78" cy="52" rx="6" ry="4" fill="#fbbf24" />
      <path d="M 78 52 L 84 52 L 78 54 Z" fill="#f59e0b" />

      {/* Large anime eyes - sparkly */}
      <g style={{
        opacity: coverEyes ? 0 : 1,
        transition: 'opacity 0.3s ease-in-out'
      }}>
        {/* Left eye */}
        <ellipse cx="58" cy="48" rx="8" ry="10" fill="white" />
        <circle cx="58" cy="48" r="6" fill="#1a1a1a" />
        <circle cx="56" cy="46" r="2.5" fill="white" />
        <circle cx="59" cy="50" r="1" fill="white" />

        {/* Right eye */}
        <ellipse cx="82" cy="48" rx="8" ry="10" fill="white" />
        <circle cx="82" cy="48" r="6" fill="#1a1a1a" />
        <circle cx="80" cy="46" r="2.5" fill="white" />
        <circle cx="83" cy="50" r="1" fill="white" />
      </g>

      {/* Wings - positioned to cover face */}
      <g style={{
        transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        transformOrigin: '35px 70px',
        transform: coverEyes ? 'translate(15px, -25px) rotate(-15deg) scale(1.3)' : 'rotate(-25deg)'
      }}>
        <ellipse cx="35" cy="70" rx="12" ry="22" fill="#1a1a1a" />
        <ellipse cx="35" cy="70" rx="9" ry="19" fill="#2d2d2d" />
        {/* Feather details */}
        <path d="M 35 60 Q 32 65 35 70 Q 32 75 35 80" stroke="#1a1a1a" strokeWidth="1.5" />
      </g>

      <g style={{
        transition: 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        transformOrigin: '105px 70px',
        transform: coverEyes ? 'translate(-15px, -25px) rotate(15deg) scale(1.3)' : 'rotate(25deg)'
      }}>
        <ellipse cx="105" cy="70" rx="12" ry="22" fill="#1a1a1a" />
        <ellipse cx="105" cy="70" rx="9" ry="19" fill="#2d2d2d" />
        {/* Feather details */}
        <path d="M 105 60 Q 108 65 105 70 Q 108 75 105 80" stroke="#1a1a1a" strokeWidth="1.5" />
      </g>

      {/* Cute blush marks */}
      <ellipse cx="48" cy="58" rx="4" ry="2" fill="#ef4444" opacity="0.3" />
      <ellipse cx="92" cy="58" rx="4" ry="2" fill="#ef4444" opacity="0.3" />

      {/* Tail feathers - fluffy */}
      <path d="M 70 112 Q 60 122 58 128 Q 65 120 70 118 Q 75 120 82 128 Q 80 122 70 112 Z" fill="#1a1a1a" />
      <path d="M 70 114 Q 62 122 60 126 Q 66 120 70 118 Q 74 120 80 126 Q 78 122 70 114 Z" fill="#2d2d2d" />

      {/* Cute little feet */}
      <g>
        <ellipse cx="60" cy="115" rx="4" ry="2" fill="#fbbf24" />
        <line x1="58" y1="117" x2="56" y2="120" stroke="#fbbf24" strokeWidth="1.5" />
        <line x1="60" y1="117" x2="60" y2="121" stroke="#fbbf24" strokeWidth="1.5" />
        <line x1="62" y1="117" x2="64" y2="120" stroke="#fbbf24" strokeWidth="1.5" />
      </g>
      <g>
        <ellipse cx="80" cy="115" rx="4" ry="2" fill="#fbbf24" />
        <line x1="78" y1="117" x2="76" y2="120" stroke="#fbbf24" strokeWidth="1.5" />
        <line x1="80" y1="117" x2="80" y2="121" stroke="#fbbf24" strokeWidth="1.5" />
        <line x1="82" y1="117" x2="84" y2="120" stroke="#fbbf24" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

export function LoginForm() {
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const auth = useAuth();

  const handleLogin = () => {
    auth.login();
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        width: '100%',
        maxWidth: '400px',
        border: '2px solid #22c55e',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <RavenSVG coverEyes={isPasswordFocused} />
        </div>

        <h1 style={{
          marginBottom: '30px',
          textAlign: 'center',
          color: '#22c55e',
          fontWeight: 'bold',
        }}>
          Welcome
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#86efac',
          marginBottom: '30px',
          fontSize: '14px',
        }}>
          Sign in with SpacetimeAuth to continue
        </p>

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#22c55e',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#16a34a'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#22c55e'}
        >
          Sign In
        </button>
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginTop: '20px',
          fontSize: '12px',
        }}>
          Powered by SpacetimeAuth
        </p>
      </div>
    </div>
  );
}
