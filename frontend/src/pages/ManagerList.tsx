import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';
import Navigation from '../components/Navigation';

interface ManagerCompany {
  name: string;
  ticker: string;
  exchange: string;
  role: string;
}

interface Manager {
  name: string;
  first_name: string;
  last_name: string;
  companies: ManagerCompany[];
  investment_theses: string[];
}

const ManagerList: React.FC = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Investify - Officers and Directors";
    fetch('/api/managers.json')
      .then(res => res.json())
      .then(data => {
        setManagers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching managers:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: '24px' }}>Loading...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
      <Navigation />

      <h1 style={{ 
        textAlign: 'left', 
        marginBottom: '48px', 
        fontSize: '36px', 
        lineHeight: '1.2', 
        letterSpacing: '-0.02em',
        marginTop: '64px'
      }}>
        All Officers and Directors
      </h1>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee' }}>
              <th style={{ width: '60px', padding: '12px' }}></th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Roles</th>
              <th style={{ textAlign: 'left', padding: '12px', fontWeight: '600' }}>Investment Theses</th>
            </tr>
          </thead>
          <tbody>
            {managers.map((manager, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px', width: '60px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={20} color="#ccc" />
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <Link to={`/manager/${encodeURIComponent(manager.name)}`} style={{ color: '#0066cc', textDecoration: 'none', fontWeight: '500', fontSize: '1.1rem' }}>
                    {manager.name}
                  </Link>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {manager.companies.map((comp, cIdx) => (
                      <div key={cIdx} style={{ fontSize: '0.95rem' }}>
                        <span style={{ fontWeight: '600', color: '#333' }}>{comp.role}</span>
                        <span style={{ color: '#666' }}> at </span>
                        <Link to={`/company/${comp.ticker}.${comp.exchange}`} style={{ color: '#0066cc', textDecoration: 'none' }}>
                          {comp.name} ({comp.ticker}.{comp.exchange})
                        </Link>
                      </div>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {manager.investment_theses.map((thesis, tIdx) => (
                      <Link 
                        key={tIdx} 
                        to={`/thesis/${thesis}`}
                        style={{ 
                          display: 'inline-block',
                          padding: '2px 10px',
                          backgroundColor: '#f0f0f0',
                          borderRadius: '12px',
                          color: '#666',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          border: '1px solid #ddd'
                        }}
                      >
                        {thesis}
                      </Link>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerList;
