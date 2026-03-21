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
    fetch('http://localhost:5000/api/theses')
      .then(res => res.json())
      .then(data => {
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
      <h1>2026 and beyond Investment Theses</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
        {theses.map(thesis => (
          <ThesisCard key={thesis.id} thesis={thesis} />
        ))}
      </div>
    </div>
  );
};

export default Home;
