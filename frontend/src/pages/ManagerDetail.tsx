import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, User, ExternalLink, Calendar, Building, Briefcase } from 'lucide-react';

interface ManagerCompany {
  name: string;
  ticker: string;
  exchange: string;
  website: string | null;
  title: string;
  startDate: string;
  endDate: string | null;
  formattedStartDate: string;
  formattedEndDate: string | null;
}

interface ManagerDetailData {
  id: string;
  name: string;
  background: string;
  pictureUrl: string | null;
  companies: ManagerCompany[];
  investmentTheses: string[];
  socials: any[];
  committees: string[];
  age: number | null;
  ageYear: number | null;
}

const ManagerDetail: React.FC = () => {
  const { name } = useParams();
  const [manager, setManager] = useState<ManagerDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (name) {
      document.title = `Investify Manager - ${name}`;
      console.log('Fetching manager detail for:', name);
      
      // Need to use the folder name which might have spaces
      fetch(`/api/managers/${encodeURIComponent(name)}.json`)
        .then(res => res.json())
        .then(data => {
          console.log('Fetched manager detail:', data);
          setManager(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching manager detail:', err);
          setLoading(false);
        });
    }
  }, [name]);

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;
  if (!manager) return <div style={{ padding: '24px' }}>Manager not found.</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
      <Link to="/managers" style={{ display: 'flex', alignItems: 'center', color: '#666', marginBottom: '24px', textDecoration: 'none' }}>
        <ChevronLeft size={20} />
        All Officers and Directors
      </Link>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            textAlign: 'left', 
            marginBottom: '16px', 
            fontSize: '36px', 
            lineHeight: '1.2', 
            letterSpacing: '-0.02em' 
          }}>
            {manager.name}
          </h1>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', color: '#666', fontSize: '1.1rem' }}>
            {manager.age && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} />
                <span><strong>Age:</strong> {manager.age} {manager.ageYear ? `(${manager.ageYear})` : ''}</span>
              </div>
            )}
            
            {manager.investmentTheses && manager.investmentTheses.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                <Briefcase size={18} />
                <strong>Theses:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {manager.investmentTheses.map((thesis, index) => (
                    <Link 
                      key={index} 
                      to={`/thesis/${thesis}`}
                      style={{ 
                        display: 'inline-block',
                        padding: '2px 10px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '16px',
                        color: '#333',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        border: '1px solid #ddd'
                      }}
                    >
                      {thesis}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ 
          width: '140px', 
          height: '140px', 
          marginLeft: '40px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '50%', 
          border: '1px solid #eee', 
          overflow: 'hidden' 
        }}>
          {manager.pictureUrl ? (
            <img src={manager.pictureUrl} alt={manager.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={64} color="#ccc" />
          )}
        </div>
      </div>

      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', borderBottom: '2px solid #eee', paddingBottom: '8px' }}>Biography</h2>
        <p style={{ lineHeight: '1.7', fontSize: '1.1rem', color: '#333', whiteSpace: 'pre-wrap' }}>
          {manager.background}
        </p>
      </div>

      {manager.companies && manager.companies.length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', borderBottom: '2px solid #eee', paddingBottom: '8px' }}>Corporate History</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {manager.companies.map((company, index) => (
              <div key={index} style={{ 
                padding: '24px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '12px', 
                border: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
                      <Link 
                        to={`/company/${company.ticker}.${company.exchange}`}
                        style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dashed #0066cc' }}
                      >
                        {company.name}
                      </Link>
                      <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>
                        ({company.ticker}.{company.exchange})
                      </span>
                    </h3>
                    {company.website && (
                      <a 
                        href={company.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          color: '#0066cc', 
                          textDecoration: 'none', 
                          fontSize: '0.95rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '500'
                        }}
                      >
                        Website
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <p style={{ margin: '0 0 12px 0', color: '#0066cc', fontWeight: '600', fontSize: '1.1rem' }}>
                    {company.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.95rem' }}>
                    <Calendar size={16} />
                    <span>
                      {company.formattedStartDate} – {company.formattedEndDate || 'Present'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {manager.committees && manager.committees.length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', borderBottom: '2px solid #eee', paddingBottom: '8px' }}>Committees</h2>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.8', fontSize: '1.1rem' }}>
            {manager.committees.map((committee, index) => (
              <li key={index}>{committee}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ManagerDetail;
