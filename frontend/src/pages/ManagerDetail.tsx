import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, User, ExternalLink, Calendar, Briefcase } from 'lucide-react';
import Navigation from '../components/Navigation';

const LinkedInIcon = ({ size = 28 }: { size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 72 72" 
    width={size} 
    height={size}
    style={{ display: 'block' }}
  >
    <path fill="#0077b5" d="M8 0h56c4.4 0 8 3.6 8 8v56c0 4.4-3.6 8-8 8H8c-4.4 0-8-3.6-8-8V8c0-4.4 3.6-8 8-8z"/>
    <path fill="#fff" d="M22.2 57.3h-9.5V27.1h9.5v30.2zM17.5 23c-3 0-5.5-2.5-5.5-5.5s2.5-5.5 5.5-5.5 5.5 2.5 5.5 5.5-2.5 5.5-5.5 5.5zM59.8 57.3h-9.5V42.4c0-3.6-.1-8.1-5-8.1s-5.7 3.9-5.7 7.9v15.1h-9.5V27.1h9.1v4.1h.1c1.3-2.4 4.4-5 9.1-5 9.7 0 11.5 6.4 11.5 14.7v16.4z"/>
  </svg>
);

interface ManagerCompany {
  name: string;
  ticker: string;
  exchange: string;
  website: string | null;
  logoUrl: string | null;
  title: string;
  startDate: string;
  endDate: string | null;
  formattedStartDate: string;
  formattedEndDate: string | null;
}

interface ManagerSocial {
  name: string;
  url: string;
}

interface ManagerDetailData {
  id: string;
  name: string;
  background: string;
  pictureUrl: string | null;
  companies: ManagerCompany[];
  investmentTheses: string[];
  socials: ManagerSocial[];
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

  const linkedIn = manager.socials?.find(s => s.name === 'LinkedIn');

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', textAlign: 'left', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px', marginBottom: '24px' }}>
        <Link to="/managers" style={{ display: 'flex', alignItems: 'center', color: '#666', textDecoration: 'none' }}>
          <ChevronLeft size={20} />
          All Officers and Directors
        </Link>
        <Navigation />
      </div>

      <div className="manager-header">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <h1 style={{ 
              textAlign: 'left', 
              margin: 0, 
              fontSize: '36px', 
              lineHeight: '1.2', 
              letterSpacing: '-0.02em' 
            }}>
              {manager.name}
            </h1>
            {linkedIn && (
              <a 
                href={linkedIn.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#0077b5', display: 'flex', alignItems: 'center' }}
                title="LinkedIn Profile"
              >
                <LinkedInIcon size={28} />
              </a>
            )}
          </div>
          
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

        <div className="manager-picture-container">
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
              <div key={index} className="history-card">
                <div className="history-card-content">
                  <div className="history-card-header">
                    <h3 style={{ margin: 0, fontSize: '1.3rem' }}>
                      <Link 
                        to={`/company/${company.ticker}.${company.exchange}`}
                        style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px dashed #0066cc' }}
                      >
                        {company.name}
                      </Link>
                      <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px', fontSize: '0.9rem' }}>
                        ({company.ticker}.{company.exchange})
                      </span>
                    </h3>
                    {company.website && (
                      <div style={{ width: '100%', marginTop: '-4px' }}>
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ 
                            color: '#0066cc', 
                            textDecoration: 'none', 
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: '500'
                          }}
                        >
                          Website
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </div>
                  <p style={{ margin: '0 0 12px 0', color: '#0066cc', fontWeight: '600', fontSize: '1.1rem' }}>
                    {company.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.95rem' }}>
                    <Calendar size={16} />
                    <span>
                      {company.formattedStartDate ? (
                        <>
                          {company.formattedStartDate} – {company.formattedEndDate || 'Present'}
                        </>
                      ) : (
                        company.formattedEndDate || ''
                      )}
                    </span>
                  </div>
                </div>
                {company.logoUrl && (
                  <div className="history-card-logo">
                    <img src={company.logoUrl} alt={company.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                )}
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
