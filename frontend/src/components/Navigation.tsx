import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const links = [
    { name: 'Investment Themes', path: '/' },
    { name: 'Public Companies', path: '/companies' },
    { name: 'Officers and Directors', path: '/managers' },
  ];

  return (
    <nav style={{ position: 'fixed', top: '24px', left: '24px', zIndex: 1000 }}>
      <button 
        onClick={toggleMenu}
        style={{
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <>
          <div 
            onClick={toggleMenu}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.05)',
              backdropFilter: 'blur(2px)',
              zIndex: 999
            }}
          />
          <div style={{
            position: 'absolute',
            top: '48px',
            left: 0,
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '12px',
            padding: '12px 0',
            width: '240px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            zIndex: 1000,
            marginTop: '8px'
          }}>
            {links.filter(link => location.pathname !== link.path).map((link) => {
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px 20px',
                    textDecoration: 'none',
                    color: '#333',
                    fontWeight: '500',
                    fontSize: '1rem',
                    transition: 'all 0.1s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9f9f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </nav>
  );
};

export default Navigation;
