import { useEffect } from 'react';
import { useAppStore } from './store';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Candidates } from './pages/Candidates';
import { CandidateProfile } from './pages/CandidateProfile';
import { Jobs } from './pages/Jobs';
import { JobDetail } from './pages/JobDetail';
import { JobImport } from './pages/JobImport';
import { JobMatches } from './pages/JobMatches';
import { ResumeImport } from './pages/ResumeImport';
import { Settings } from './pages/Settings';

function App() {
  const { currentPage, theme } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-black');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'black') {
      root.classList.add('dark', 'theme-black');
    }
  }, [theme]);

  const renderPage = () => {
    switch (currentPage) {
      case 'overview': return <Overview />;
      case 'candidates': return <Candidates />;
      case 'candidate-profile': return <CandidateProfile />;
      case 'jobs': return <Jobs />;
      case 'job-detail': return <JobDetail />;
      case 'job-import': return <JobImport />;
      case 'job-matches': return <JobMatches />;
      case 'resume-import': return <ResumeImport />;
      case 'settings': return <Settings />;
      default: return <Overview />;
    }
  };

  return (
    <Layout>
      <div className="page-enter" key={currentPage}>
        {renderPage()}
      </div>
    </Layout>
  );
}

export default App;
