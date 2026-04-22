import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface InvestmentThesis {
  thesis_name: string;
  company_type: string;
}

interface CompanyDetail {
  id: string;
  name: string;
  logoUrl: string;
  content: string;
  website?: string;
  country?: string;
  type?: string;
  investment_theses?: InvestmentThesis[];
}

const CompanyDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      document.title = `Investify Company - ${id}`;
      console.log('Fetching company detail for:', id);
    }
    fetch(`/api/companies/${id}.json`)
      .then(res => res.json())
      .then(data => {
        console.log('Fetched company detail:', data);
        setCompany(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching company detail:', err);
        setLoading(false);
      });
  }, [id]);

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      const href = target.getAttribute('href');
      if (href && href.startsWith('/')) {
        e.preventDefault();
        navigate(href);
      }
    }
  };

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;
  if (!company) return <div style={{ padding: '24px' }}>Company not found.</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
      <Link to="/companies" style={{ display: 'flex', alignItems: 'center', color: '#666', marginBottom: '24px', textDecoration: 'none' }}>
        <ChevronLeft size={20} />
        All Companies
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ 
            textAlign: 'left', 
            marginBottom: '16px', 
            fontSize: '36px', 
            lineHeight: '1.2', 
            letterSpacing: '-0.02em' 
          }}>
            {company.name}
          </h1>
          <div style={{ color: '#666', fontSize: '1.1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><strong>Ticker:</strong> {company.id}</div>
            {company.website && (
              <div>
                <strong>Website:</strong>{' '}
                <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'none' }}>
                  {company.website}
                </a>
              </div>
            )}
            {company.country && <div><strong>Country:</strong> {company.country}</div>}
            {company.type && <div><strong>Type:</strong> {company.type}</div>}
            
            {company.investment_theses && company.investment_theses.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <strong>Investment Theses:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {company.investment_theses.map((thesis, index) => (
                    <Link 
                      key={index} 
                      to={`/thesis/${thesis.thesis_name}`}
                      style={{ 
                        display: 'inline-block',
                        padding: '4px 12px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '16px',
                        color: '#333',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        border: '1px solid #ddd'
                      }}
                    >
                      {thesis.thesis_name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {company.logoUrl && (
          <div style={{ width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '12px' }}>
            <img src={company.logoUrl} alt={`${company.name} logo`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        )}
      </div>

      <div 
        className="company-content" 
        dangerouslySetInnerHTML={{ __html: company.content }} 
        style={{ lineHeight: '1.6', fontSize: '1.1rem' }}
        onClick={handleContentClick}
      />
    </div>
  );
};

export default CompanyDetail;
