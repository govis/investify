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
    <div className="thesis-card-container" style={{ position: 'relative', width: '300px' }}>
      <div 
        className="thesis-card"
        onClick={() => navigate(`/thesis/${thesis.id}`)}
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
          cursor: 'pointer',
          backgroundColor: '#fff',
          transition: 'transform 0.2s, box-shadow 0.2s',
          height: '320px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ height: '160px', overflow: 'hidden' }}>
          <img 
            src={thesis.imageUrl} 
            alt={thesis.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1rem', lineHeight: '1.4' }}>{thesis.title}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowPopup(!showPopup);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
            >
              <MoreHorizontal size={24} />
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
