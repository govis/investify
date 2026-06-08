import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
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
  pictureUrl?: string;
  companies: ManagerCompany[];
  investment_theses: string[];
}

const ManagerList: React.FC = () => {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const totalPages = Math.ceil(managers.length / pageSize);
  const paginatedManagers = managers.slice((page - 1) * pageSize, page * pageSize);

  const goToPage = (newPage: number) => {
    setSearchParams({ page: newPage.toString(), pageSize: pageSize.toString() });
    window.scrollTo(0, 0);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchParams({ page: '1', pageSize: e.target.value });
    window.scrollTo(0, 0);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', textAlign: 'left' }}>
      <div className="list-header">
        <h1 style={{ 
          textAlign: 'left', 
          margin: 0, 
          fontSize: '36px', 
          lineHeight: '1.2', 
          letterSpacing: '-0.02em'
        }}>
          All Officers and Directors
        </h1>

        <div className="list-header-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', fontSize: '0.95rem' }}>
            <span className="hide-mobile">Show:</span>
            <select 
              value={pageSize} 
              onChange={handlePageSizeChange}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '0.95rem',
                color: '#333',
                outline: 'none'
              }}
            >
              <option value="50">50{isMobile ? '' : ' per page'}</option>
              <option value="100">100{isMobile ? '' : ' per page'}</option>
              <option value="200">200{isMobile ? '' : ' per page'}</option>
            </select>
          </div>
          <Navigation />
        </div>
      </div>

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
            {paginatedManagers.map((manager, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px', width: '60px' }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: '#f0f0f0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid #eee'
                  }}>
                    {manager.pictureUrl ? (
                      <img src={manager.pictureUrl} alt={manager.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={20} color="#ccc" />
                    )}
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

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        marginTop: '48px', 
        gap: '16px',
        padding: '24px 0'
      }}>
        <button 
          onClick={() => goToPage(page - 1)} 
          disabled={page <= 1}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            backgroundColor: page <= 1 ? '#f5f5f5' : '#fff',
            cursor: page <= 1 ? 'not-allowed' : 'pointer',
            color: page <= 1 ? '#999' : '#333',
            fontSize: '0.95rem'
          }}
        >
          <ChevronLeft size={18} />
          Previous
        </button>

        <span style={{ fontSize: '1rem', color: '#666' }}>
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </span>

        <button 
          onClick={() => goToPage(page + 1)} 
          disabled={page >= totalPages}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            backgroundColor: page >= totalPages ? '#f5f5f5' : '#fff',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer',
            color: page >= totalPages ? '#999' : '#333',
            fontSize: '0.95rem'
          }}
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ManagerList;
