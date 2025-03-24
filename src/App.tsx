import React from 'react';
import { HashRouter as Router, Route, Link, Switch, useLocation } from 'react-router-dom';
import StorytellerVisualization from './components/StorytellerVisualization';
import SentimentAnalysis from './components/SentimentAnalysis';
import WordCloudVisualization from './components/WordCloudVisualization';
import ThematicNetworkFixed from './components/ThematicNetworkFixed';
import ThematicTable from './components/ThematicTable';
import StoriesPage from './components/VideoGallery';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-amber-700 text-center">MMEIC School Holiday Program</h1>
            <p className="text-gray-600 text-center mt-2">Storytellers Stradbroke Island Data Visualization</p>
          </div>
        </header>

        <nav className="bg-white shadow-sm mt-4">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap justify-center gap-4">
              <NavLink to="/">
                Storyteller Analysis
              </NavLink>
              <NavLink to="/sentiment">
                Sentiment Analysis
              </NavLink>
              <NavLink to="/word-cloud">
                Word Cloud
              </NavLink>
              <NavLink to="/thematic-network">
                Thematic Network
              </NavLink>
              <NavLink to="/thematic-table">
                Thematic Table
              </NavLink>
              <NavLink to="/gallery">
                Stories
              </NavLink>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">
          <Switch>
            <Route exact path="/" component={StorytellerVisualization} />
            <Route path="/sentiment" component={SentimentAnalysis} />
            <Route path="/word-cloud" component={WordCloudVisualization} />
            <Route path="/thematic-network" component={ThematicNetworkFixed} />
            <Route path="/thematic-table" component={ThematicTable} />
            <Route path="/gallery" component={StoriesPage} />
          </Switch>
        </main>
      </div>
    </Router>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`px-6 py-2 rounded-lg transition-all ${
        isActive
          ? 'bg-amber-700 text-white shadow-lg'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
      }`}
    >
      {children}
    </Link>
  );
}

export default App;
