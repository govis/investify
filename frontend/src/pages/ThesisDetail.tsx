import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const ThesisDetail: React.FC = () => {
  const { id } = useParams();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/theses/${id}`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching thesis detail:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', color: '#666', marginBottom: '24px', textDecoration: 'none' }}>
        <ChevronLeft size={20} />
        Back to Home
      </Link>
      <div 
        className="thesis-content" 
        dangerouslySetInnerHTML={{ __html: content }} 
        style={{ lineHeight: '1.6' }}
      />
    </div>
  );
};

export default ThesisDetail;
