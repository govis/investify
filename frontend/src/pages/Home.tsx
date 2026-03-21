import React, { useEffect, useState } from 'react';
import ThesisCard from '../components/ThesisCard';

interface Thesis {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
}

const Home: React.FC = () => {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Investify - Investment Themes";
    console.log('Fetching theses...');
    fetch('/api/theses.json')
      .then(res => {
        console.log('Response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('Fetched data:', data);
        setTheses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching theses:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '72px' }}>Investment Themes for 2026 and beyond</h1>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: '32px',
        justifyItems: 'center'
      }}>
        {theses.map(thesis => (
          <ThesisCard key={thesis.id} thesis={thesis} />
        ))}
      </div>
    </div>
  );
};

export default Home;
