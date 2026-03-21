import React, { useState } from 'react';
import { MoreHorizontal, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Thesis {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
}

const ThesisCard: React.FC<{ thesis: Thesis }> = ({ thesis }) => {
  const [showPopup, setShowPopup] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="thesis-card-container" style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
      <div 
        className="thesis-card"
        onClick={() => navigate(`/thesis/${thesis.id}`)}
        style={{
          border: '1px solid #ddd',
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: 'pointer',
          backgroundColor: '#fff',
          transition: 'all 0.3s ease',
          height: '340px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-8px)';
          e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
        }}
      >
        <div style={{ height: '160px', overflow: 'hidden' }}>
          <img 
            src={thesis.imageUrl} 
            alt={thesis.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem', lineHeight: '1.4', color: '#000' }}>{thesis.title}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowPopup(!showPopup);
              }}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text)',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-bg)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text)';
              }}
            >
              <MoreHorizontal size={24} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {showPopup && (
          <div 
            className="thesis-popup"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '16px',
              zIndex: 10,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <strong style={{ fontSize: '1rem' }}>Executive Summary</strong>
              <X 
                size={20} 
                style={{ cursor: 'pointer' }} 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPopup(false);
                }} 
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <p style={{ fontSize: '0.9rem', color: '#333', margin: 0, lineHeight: '1.5' }}>{thesis.summary}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThesisCard;
