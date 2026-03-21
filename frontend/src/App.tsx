import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ThesisDetail from './pages/ThesisDetail';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/thesis/:id" element={<ThesisDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
