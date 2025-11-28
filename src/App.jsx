import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Workload from './pages/Workload';
import Calendar from './pages/Calendar';
import Deployments from './pages/Deployments';
import OrgChart from './pages/OrgChart';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects':
        return <Projects />;
      case 'workload':
        return <Workload />;
      case 'calendar':
        return <Calendar />;
      case 'org':
        return <OrgChart />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;
