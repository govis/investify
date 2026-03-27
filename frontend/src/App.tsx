import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ThesisDetail from './pages/ThesisDetail';
import CompanyDetail from './pages/CompanyDetail';
import CompanyList from './pages/CompanyList';
import Sources from './pages/Sources';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/thesis/:id" element={<ThesisDetail />} />
          <Route path="/company/:id" element={<CompanyDetail />} />
          <Route path="/companies" element={<CompanyList />} />
          <Route path="/sources" element={<Sources />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
