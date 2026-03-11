import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import HelpView from './components/HelpView';
import GlobalFooter from './components/GlobalFooter';
import NewProjectView from './components/NewProjectView';
import ProjectListView from './components/ProjectListView';
import CadView from './components/CadView';
import { SavedLocation, Project } from './types';
import { geoidService } from './services/GeoidService';

const App = () => {
  type ViewType = 'onboarding' | 'dashboard' | 'help' | 'newProject' | 'projectList' | 'cadView';
  const [view, setView] = useState<ViewType>('onboarding');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);

  // Navigation wrapper to sync with browser history
  const navigateTo = (newView: ViewType) => {
    if (newView !== view) {
      window.history.pushState({ view: newView }, '');
      setView(newView);
    }
  };

  useEffect(() => {
    geoidService.initialize();

    // Always start with onboarding as requested
    setView('onboarding');
    window.history.replaceState({ view: 'onboarding' }, '');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
      } else {
        setView('onboarding');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const CURRENT_KEY = 'kml_projects_v1.0.6';
    const OLD_KEY = 'kml_projects_v1.0.5';
    
    const loadProjects = async () => {
      try {
        let savedProjects = await localforage.getItem<Project[]>(CURRENT_KEY);
        
        if (!savedProjects) {
          // Try to migrate from localStorage if localforage is empty
          const oldLocalData = localStorage.getItem(OLD_KEY);
          if (oldLocalData) {
            savedProjects = JSON.parse(oldLocalData);
            await localforage.setItem(CURRENT_KEY, savedProjects);
          }
        }
        
        if (savedProjects) {
          setProjects(savedProjects);
        }
      } catch (e) {
        console.error("Projeler yüklenirken hata oluştu:", e);
      }
    };
    
    loadProjects();
  }, []);

  useEffect(() => {
    // Sadece projeler değiştiğinde kaydet
    if (projects.length > 0) {
      localforage.setItem('kml_projects_v1.0.6', projects).catch(e => {
        console.error("Projeler kaydedilirken hata oluştu:", e);
      });
    }
  }, [projects]);

  const handleFinishOnboarding = () => {
    localStorage.setItem('onboarding_v1.0.6_done', 'true');
    // Use replaceState so dashboard becomes the root (can't go back to onboarding)
    window.history.replaceState({ view: 'dashboard' }, '');
    setView('dashboard');
  };

  const resetToDashboard = () => {
    setSelectedProjects([]);
    navigateTo('dashboard');
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
    resetToDashboard();
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const handleContinueProjects = (selected: Project[]) => {
    setSelectedProjects(selected);
    navigateTo('cadView');
  };

  return (
    <div className="h-full bg-white font-sans text-slate-900 overflow-hidden flex flex-col">
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        
        {view === 'onboarding' && (
          <div className="flex-1 flex flex-col overflow-y-auto h-full">
            <Onboarding onFinish={handleFinishOnboarding} />
            <GlobalFooter />
          </div>
        )}
        
        {view === 'dashboard' && (
          <div className="flex-1 flex flex-col overflow-y-auto h-full no-scrollbar">
            <Dashboard 
              onStartCapture={() => navigateTo('newProject')} 
              onStakeout={() => navigateTo('projectList')}
              onShowList={() => {}}
              onShowExport={() => {}}
              onShowHelp={() => navigateTo('help')}
            />
            <GlobalFooter showAd={true} />
          </div>
        )}

        {view === 'help' && (
          <HelpView onBack={resetToDashboard} />
        )}

        {view === 'newProject' && (
          <NewProjectView 
            onBack={resetToDashboard}
            onProjectCreated={handleProjectCreated}
          />
        )}

        {view === 'projectList' && (
          <ProjectListView 
            projects={projects}
            onBack={resetToDashboard}
            onContinue={handleContinueProjects}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {view === 'cadView' && (
          <CadView 
            projects={selectedProjects}
            onBack={() => navigateTo('projectList')}
          />
        )}

      </div>
    </div>
  );
};

export default App;
