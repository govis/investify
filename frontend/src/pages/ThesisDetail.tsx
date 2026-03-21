import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface ThesisDetail {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  content: string;
}

const ThesisDetail: React.FC = () => {
  const { id } = useParams();
  const [thesis, setThesis] = useState<ThesisDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      document.title = `Investify Thesis - ${id}`;
    }
    fetch(`/api/theses/${id}.json`)
      .then(res => res.json())
      .then(data => {
        setThesis(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching thesis detail:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!thesis) return <div>Thesis not found.</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', color: '#666', marginBottom: '24px', textDecoration: 'none' }}>
        <ChevronLeft size={20} />
        Back to Investment Themes
      </Link>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          textAlign: 'left', 
          marginBottom: '16px', 
          fontSize: '28px', 
          lineHeight: '1.3', 
          letterSpacing: '-0.01em' 
        }}>
          {thesis.title}
        </h1>
        
        <div style={{ width: '100%', height: '400px', overflow: 'hidden', borderRadius: '12px', marginBottom: '24px' }}>
          <img 
            src={thesis.imageUrl} 
            alt={thesis.title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>

        <div style={{ padding: '24px', backgroundColor: 'var(--social-bg)', borderRadius: '12px', marginBottom: '32px', border: '1px solid var(--border)' }}>
          <h2 style={{ marginTop: 0 }}>Executive Summary</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{thesis.summary}</p>
        </div>
      </div>

      <div 
        className="thesis-content" 
        dangerouslySetInnerHTML={{ __html: thesis.content }} 
        style={{ lineHeight: '1.6' }}
      />
    </div>
  );
};

export default ThesisDetail;
