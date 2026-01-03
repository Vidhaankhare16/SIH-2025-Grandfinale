import React, { useEffect, useState } from 'react';
import { Factory } from 'lucide-react';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';
import FarmerDashboard from './components/FarmerDashboard';
import FPODashboard from './components/FPODashboard';
import ProcessorDashboard from './components/ProcessorDashboard';
import RetailerDashboard from './components/RetailerDashboard';
import GovernmentDashboard from './components/GovernmentDashboard';
import VoiceAssistant from './components/VoiceAssistant';
import WarehouseLocator from './components/WarehouseLocator';
import AdvisoryPage from './components/AdvisoryPage';
import AboutSchemes from './components/AboutSchemes';
import FinancialPlanningPage from './components/FinancialPlanningPage';
import BiddingPage from './components/BiddingPage';
import FarmerWorkflow from './components/FarmerWorkflow';
import { AdvisoryPlan, UserRole } from './types';
import { resolveLocationToDistrictState } from './services/geminiService';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [lang, setLang] = useState<string>('en'); // 'en' or 'or' (Oriya)
  const [location, setLocation] = useState<string>('');
  const [showLocationPrompt, setShowLocationPrompt] = useState<boolean>(true);
  const [view, setView] = useState<'main' | 'warehouses' | 'advisory' | 'schemes' | 'dashboard' | 'bidding' | 'logistics' | 'workflow'>('main');
  const [advisoryPlan, setAdvisoryPlan] = useState<AdvisoryPlan | null>(null);
  const [advisoryContext, setAdvisoryContext] = useState<{
    district: string;
    soil: string;
    water: string;
  } | null>(null);
  const [voiceAssistantOpenTrigger, setVoiceAssistantOpenTrigger] = useState(0);

  // Load advisory from localStorage on mount
  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('farmerAdvisoryPlan');
      const savedContext = localStorage.getItem('farmerAdvisoryContext');
      if (savedPlan) {
        const plan = JSON.parse(savedPlan);
        setAdvisoryPlan(plan);
        if (savedContext) {
          setAdvisoryContext(JSON.parse(savedContext));
        }
      }
    } catch (error) {
      console.error('Error loading advisory from localStorage:', error);
    }
  }, []);

  // Save advisory to localStorage whenever it changes
  useEffect(() => {
    if (advisoryPlan) {
      try {
        localStorage.setItem('farmerAdvisoryPlan', JSON.stringify(advisoryPlan));
        if (advisoryContext) {
          localStorage.setItem('farmerAdvisoryContext', JSON.stringify(advisoryContext));
        }
      } catch (error) {
        console.error('Error saving advisory to localStorage:', error);
      }
    }
  }, [advisoryPlan, advisoryContext]);

  // Debug: Log when advisoryPlan changes
  useEffect(() => {
    if (advisoryPlan) {
      console.log("AdvisoryPlan state updated:", advisoryPlan);
      console.log("Current view:", view);
    }
  }, [advisoryPlan, view]);

  const handleLogin = (userRole: UserRole, id: string, name: string) => {
    setRole(userRole);
    setUserId(id);
    setUserName(name);
  };

  const handleLogout = () => {
    setRole(UserRole.NONE);
    setUserId('');
    setUserName('');
    setView('main');
    // Optionally clear advisory on logout, or keep it for next login
    // localStorage.removeItem('farmerAdvisoryPlan');
    // localStorage.removeItem('farmerAdvisoryContext');
  };

  // Attempt geolocation on bootup
  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc = `Lat ${latitude.toFixed(3)}, Lng ${longitude.toFixed(3)}`;
        setLocation((prev) => prev || loc);
        // Try to resolve to district/state
        const resolved = await resolveLocationToDistrictState(latitude, longitude);
        if (resolved) {
          setLocation(resolved);
        }
      },
      () => {},
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  }, []);

  const handleDetectLocation = () => {
    if (!navigator?.geolocation) {
      alert('Location not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const loc = `Lat ${latitude.toFixed(3)}, Lng ${longitude.toFixed(3)}`;
        setLocation(loc);
        const resolved = await resolveLocationToDistrictState(latitude, longitude);
        if (resolved) {
          setLocation(resolved);
        }
        setShowLocationPrompt(false);
      },
      (err) => {
        alert('Unable to detect location. Please enter manually.');
        console.error(err);
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
    );
  };

  const handlePlanReady = (plan: AdvisoryPlan, context: { district: string; soil: string; water: string }) => {
    console.log("handlePlanReady called with plan:", plan);
    console.log("Plan keys:", plan ? Object.keys(plan) : 'null');
    if (!plan) {
      console.error("Plan is null or undefined!");
      return;
    }
    // Set state first
    setAdvisoryPlan(plan);
    setAdvisoryContext(context);
    // Force view update - use a small delay to ensure state is set
    setTimeout(() => {
    setView('advisory');
      console.log("View changed to advisory, advisoryPlan:", plan);
    }, 10);
  };

  if (role === UserRole.NONE) {
    return <LoginPage onLogin={handleLogin} lang={lang} />;
  }

  return (
    <Layout 
      role={role} 
      setRole={handleLogout} 
      lang={lang} 
      setLang={setLang}
      onWarehousesNav={() => setView(role === UserRole.FARMER ? 'bidding' : 'warehouses')}
      onSchemesNav={() => setView('schemes')}
      onHomeNav={() => setView('main')}
      onDashboardNav={() => setView('dashboard')}
      onLogisticsNav={() => setView('main')}
      onVoiceAssistantOpen={() => setVoiceAssistantOpenTrigger(prev => prev + 1)}
      currentView={view}
      userName={userName}
    >
      {showLocationPrompt && (
        <div className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">
              {lang === 'en' ? 'Share your location' : 'ଆପଣଙ୍କ ସ୍ଥାନ ଦିଅନ୍ତୁ'}
            </h3>
            <p className="text-sm text-gray-600">
              {lang === 'en'
                ? 'We use your nearest town/village for weather-aware advice.'
                : 'ଆମେ ଆପଣଙ୍କ ନଜିକ ସ୍ଥାନ ଦ୍ୱାରା ଆବହାଅ ଆଧାରିତ ପରାମର୍ଶ ଦେଉଛୁ |'}
            </p>
            <div className="space-y-2">
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={lang === 'en' ? 'e.g., Khordha, Odisha' : 'ଉଦାହରଣ: ଖୋର୍ଧା, ଓଡ଼ିଶା'}
                className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-enam-green outline-none"
              />
              <button
                onClick={handleDetectLocation}
                className="w-full bg-enam-dark text-white font-bold py-3 rounded-xl shadow hover:bg-enam-green transition"
              >
                {lang === 'en' ? 'Detect my location' : 'ମୋ ସ୍ଥାନ ସନ୍ଧାନ କରନ୍ତୁ'}
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLocationPrompt(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600"
              >
                {lang === 'en' ? 'Skip' : 'ଛାଡନ୍ତୁ'}
              </button>
              <button
                onClick={() => setShowLocationPrompt(false)}
                className="px-4 py-2 text-sm font-bold text-white bg-govt-orange rounded-lg"
                disabled={!location.trim()}
              >
                {lang === 'en' ? 'Save & Continue' : 'ସେଭ କରନ୍ତୁ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'workflow' && role === UserRole.FARMER ? (
        <FarmerWorkflow
          lang={lang}
          location={location}
          userId={userId}
          onComplete={() => setView('main')}
        />
      ) : view === 'dashboard' && role === UserRole.FARMER ? (
        <FinancialPlanningPage
          lang={lang}
          location={location}
          userId={userId}
          onBack={() => setView('main')}
        />
      ) : view === 'bidding' && role === UserRole.FARMER ? (
        <BiddingPage
          lang={lang}
          location={location}
          userId={userId}
          onBack={() => setView('main')}
        />
      ) : view === 'warehouses' ? (
        <WarehouseLocator 
          lang={lang} 
          location={location} 
          setLocation={setLocation} 
          onDetectLocation={handleDetectLocation}
          onBack={() => setView('main')}
        />
      ) : view === 'schemes' ? (
        <AboutSchemes
          lang={lang}
          onBack={() => setView('main')}
          userId={userId}
          location={location}
        />
      ) : view === 'advisory' && advisoryPlan ? (
        <AdvisoryPage
          lang={lang}
          location={location}
          plan={advisoryPlan}
          context={advisoryContext}
          onBack={() => setView('main')}
          onBiddingNav={() => setView('bidding')}
        />
      ) : role === UserRole.FARMER ? (
        <>
          <FarmerDashboard 
            lang={lang} 
            location={location} 
            setLocation={setLocation}
            onSchemesNav={() => setView('schemes')} 
            onDetectLocation={handleDetectLocation}
            onPlanReady={handlePlanReady}
            userId={userId}
            onStartWorkflow={() => setView('workflow')}
          />
          <VoiceAssistant lang={lang} location={location} openTrigger={voiceAssistantOpenTrigger} />
        </>
      ) : role === UserRole.FPO ? (
        <FPODashboard key={view} initialTab="overview" userId={userId} lang={lang} />
      ) : role === UserRole.GOVERNMENT ? (
        <GovernmentDashboard lang={lang} />
      ) : role === UserRole.PROCESSOR ? (
        <ProcessorDashboard userId={userId} />
      ) : role === UserRole.RETAILER ? (
        <RetailerDashboard lang={lang} />
      ) : null}
    </Layout>
  );
};

export default App;