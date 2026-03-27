import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Globe, ExternalLink } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  ticker: string;
  website: string;
  country: string;
  type: string;
}

const CompanyList: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Investify - Companies";
    fetch('/api/companies.json')
      .then(res => res.json())
      .then(data => {
        setCompanies(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching companies:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', color: '#666', marginBottom: '24px', textDecoration: 'none' }}>
        <ChevronLeft size={20} />
        Investment Themes
      </Link>

      <h1 style={{ 
        textAlign: 'left', 
        marginBottom: '48px', 
        fontSize: '36px', 
        lineHeight: '1.2', 
        letterSpacing: '-0.02em' 
      }}>
        All Companies
      </h1>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Ticker</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Website</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Country</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Type</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px' }}>
                  <Link to={`/company/${company.id}`} style={{ color: '#0066cc', textDecoration: 'none', fontWeight: '500' }}>
                    {company.name}
                  </Link>
                </td>
                <td style={{ padding: '12px', color: '#666' }}>{company.ticker}</td>
                <td style={{ padding: '12px' }}>
                  {company.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', color: '#666', textDecoration: 'none' }}>
                      <Globe size={16} style={{ marginRight: '4px' }} />
                      Visit <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                    </a>
                  ) : '-'}
                </td>
                <td style={{ padding: '12px', color: '#666' }}>{company.country}</td>
                <td style={{ padding: '12px', color: '#666' }}>{company.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyList;
