import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import Navigation from '../components/Navigation';

interface SourcesData {
  title: string;
  content: string;
}

const Sources: React.FC = () => {
  const [sources, setSources] = useState<SourcesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Investify - Sources";
    fetch('/api/sources.json')
      .then(res => res.json())
      .then(data => {
        setSources(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching sources:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;
  if (!sources) return <div style={{ padding: '24px' }}>Sources not found.</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', textAlign: 'left', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px', marginBottom: '24px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', color: '#666', textDecoration: 'none' }}>
          <ChevronLeft size={20} />
          Back to Home
        </Link>
        <Navigation />
      </div>

      <h1 style={{ marginBottom: '32px' }}>{sources.title}</h1>
      
      <div 
        className="sources-content" 
        dangerouslySetInnerHTML={{ __html: sources.content }} 
        style={{ lineHeight: '1.6' }}
      />
    </div>
  );
};

export default Sources;
