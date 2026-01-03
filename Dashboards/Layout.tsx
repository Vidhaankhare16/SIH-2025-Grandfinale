import React, { useState } from 'react';
import { UserRole } from '../types';
import { LogOut, Phone, User as UserIcon, ChevronDown, Search, Menu, X, Home, FileText, BarChart2, MapPin, Gavel, IndianRupee, Car, BookOpen } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  role: UserRole;
  setRole: (role: UserRole) => void;
  lang: string;
  setLang: (l: string) => void;
  onWarehousesNav?: () => void;
  onSchemesNav?: () => void;
  onHomeNav?: () => void;
  onDashboardNav?: () => void;
  onLogisticsNav?: () => void;
  onVoiceAssistantOpen?: () => void;
  currentView?: 'main' | 'warehouses' | 'schemes' | 'advisory' | 'dashboard' | 'bidding' | 'logistics';
  userName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, role, setRole, lang, setLang, onWarehousesNav, onSchemesNav, onHomeNav, onDashboardNav, onLogisticsNav, onVoiceAssistantOpen, currentView = 'main', userName }) => {
  // Translation helper
  const t = (en: string, or: string) => lang === 'en' ? en : or;
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isFarmer = role === UserRole.FARMER;
  const isGovernment = role === UserRole.GOVERNMENT;

  const scrollToSection = (id: string) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNavClick = (target: string) => {
    switch (target) {
      case 'home':
        if (onHomeNav) {
          onHomeNav();
        } else {
          scrollToSection('top');
        }
        break;
      case 'about':
        if (onSchemesNav) {
          onSchemesNav();
        }
        break;
      case 'dashboard':
        if (onDashboardNav) {
          onDashboardNav();
        } else {
          scrollToSection(isFarmer ? 'farmer-input' : 'fpo-overview');
        }
        break;
      case 'warehouses':
        if (onWarehousesNav) {
          onWarehousesNav();
        } else {
          scrollToSection('fpo-logistics');
        }
        break;
      case 'bidding':
        if (onWarehousesNav) {
          onWarehousesNav();
        }
        break;
      case 'logistics':
        if (onLogisticsNav) {
          onLogisticsNav();
        }
        break;
      default:
        break;
    }
  };

  const NavItem = ({ icon: Icon, label, active = false, onClick }: any) => (
    <li
      onClick={onClick}
      className={`px-5 py-3 cursor-pointer border-b-4 transition-all flex items-center gap-2 whitespace-nowrap
      ${active 
        ? 'border-govt-orange bg-black/10' 
        : 'border-transparent hover:border-govt-orange hover:bg-black/10'}`
      }
    >
      {Icon && <Icon size={18} className="md:hidden lg:block opacity-80" />}
      <span>{label}</span>
      {!active && <ChevronDown size={14} className="opacity-70 ml-auto md:hidden" />}
    </li>
  );

  return (
    <div id="top" className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* 1. Top Strip - Contact & Utilities (Hidden on Mobile) */}
      <div className="bg-white border-b border-gray-200 text-xs py-2 px-4 hidden md:flex justify-between items-center text-gray-600">
         <div className="flex gap-6">
           <a 
             href="https://www.agriwelfare.gov.in/"
             target="_blank"
             rel="noopener noreferrer"
             className="flex items-center gap-1 hover:text-govt-orange cursor-pointer"
           >
             {t('GOI Directory', 'GOI ଡାଇରେକ୍ଟୋରୀ')}
           </a>
            <a 
              href="https://krushakregd.odisha.gov.in/website/home"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-govt-orange cursor-pointer"
            >
              {t('Farmers Portal', 'କୃଷକ ପୋର୍ଟାଲ୍')}
            </a>
         </div>
         <div className="flex items-center gap-6">
            <a href="tel:18002700224" className="flex items-center gap-1 font-bold text-gray-800 hover:text-enam-dark">
               <Phone size={14} className="text-enam-dark" /> {t('Toll Free:', 'ଟୋଲ୍ ଫ୍ରି:')} 1800-270-0224
            </a>
            <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
               <span>{t('Language:', 'ଭାଷା:')}</span>
               <select 
                 value={lang} 
                 onChange={(e) => setLang(e.target.value)}
                 className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer hover:text-enam-dark"
               >
                 <option value="en">{t('English', 'ଇଂରାଜୀ')}</option>
                 <option value="or">Odia (ଓଡ଼ିଆ)</option>
               </select>
            </div>
            <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
               <button onClick={() => setRole(UserRole.NONE)} className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium transition-colors">
                  <LogOut size={14} /> {t('Logout', 'ଲଗ୍ ଆଉଟ୍')}
               </button>
            </div>
         </div>
      </div>

      {/* 2. Main Header */}
      <header className="bg-white py-3 md:py-4 shadow-sm relative z-20 border-b-4 border-govt-orange">
        <div className="container mx-auto px-4 flex justify-between items-center">
          {/* Left: Govt Emblem */}
          <a 
            href="https://www.agriwelfare.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 md:gap-4"
          >
             <div className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
                  alt="Emblem" 
                  className="w-full h-full object-contain" 
                />
             </div>
             <div>
                <h2 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wide">Government of India</h2>
                <h1 className="text-xs md:text-lg font-extrabold text-gray-800 leading-tight">Ministry of Agriculture & <br className="hidden md:block"/> Farmers Welfare</h1>
             </div>
          </a>

          {/* Center: App Name */}
          <div className="flex items-center gap-3">
             <div className="flex flex-col items-end">
                <h1 className="text-2xl md:text-4xl font-extrabold text-enam-dark tracking-tighter">
                  Kisan<span className="text-enam-green">Setu</span>
                </h1>
                <p className="text-[8px] md:text-xs text-enam-green font-bold uppercase tracking-widest bg-enam-dark/5 px-2 py-0.5 rounded">
                  NMEO-OP Initiative
                </p>
             </div>
             {/* Desktop Partner Logos */}
             <div className="hidden lg:flex gap-4 opacity-90 items-center border-l border-gray-300 pl-4 ml-4">
                 <div className="text-right">
                   <div className="text-[10px] text-gray-500 font-bold">{t('Call Center', 'କଲ୍ ସେଣ୍ଟର୍')}</div>
                   <a href="tel:18001801551" className="text-lg font-bold text-enam-dark hover:text-enam-green transition-colors">1800 180 1551</a>
                 </div>
             </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* 3. Navigation Bar - Hidden for Government */}
      {!isGovernment && (
      <nav className={`bg-gradient-to-r from-enam-green to-enam-dark text-white shadow-md sticky top-0 z-30 transition-all duration-300 ${isMobileMenuOpen ? 'max-h-screen' : 'max-h-0 md:max-h-16 overflow-hidden'}`}>
         <div className="container mx-auto px-4">
            <ul className="flex flex-col md:flex-row md:items-center text-sm font-semibold">
               <NavItem icon={Home} label={t('Dashboard', 'ଡ୍ୟାସବୋର୍ଡ୍')} active={currentView === 'main'} onClick={() => handleNavClick('home')} />
                 {isFarmer ? (
                   <>
                     <NavItem icon={IndianRupee} label={t('Finance', 'ଅର୍ଥ')} active={currentView === 'dashboard'} onClick={() => handleNavClick('dashboard')} />
                     <NavItem icon={Gavel} label={t('Bidding', 'ବିଡିଂ')} active={currentView === 'bidding'} onClick={() => handleNavClick('bidding')} />
                     <NavItem icon={BookOpen} label={t('About Schemes', 'ଯୋଜନା ବିଷୟରେ')} active={currentView === 'schemes'} onClick={() => handleNavClick('about')} />
                   </>
                 ) : null}
               
               {/* Mobile Only Extras */}
               <div className="md:hidden border-t border-white/20 mt-2 pt-2 pb-4 space-y-3 px-5">
                 <div className="flex items-center justify-between">
                   <span>{t('Language', 'ଭାଷା')}</span>
                   <select 
                     value={lang} 
                     onChange={(e) => setLang(e.target.value)}
                     className="bg-black/20 text-white border border-white/30 rounded px-2 py-1 text-xs"
                   >
                     <option value="en" className="text-black">{t('English', 'ଇଂରାଜୀ')}</option>
                     <option value="or" className="text-black">Odia (ଓଡ଼ିଆ)</option>
                   </select>
                 </div>
                 {userName && (
                   <div className="text-white text-sm font-medium py-2 border-b border-white/20">
                     {userName}
                   </div>
                 )}
                 <button onClick={() => setRole(UserRole.NONE)} className="w-full text-left flex items-center gap-2 text-red-200 py-2">
                    <LogOut size={16} /> {t('Logout', 'ଲଗ୍ ଆଉଟ୍')}
                 </button>
               </div>

               {/* Desktop Search - Only for Farmer role on home page */}
               {isFarmer && currentView === 'main' && (
               <li className="ml-auto px-4 py-2 hidden md:block">
                   <div 
                     onClick={() => onVoiceAssistantOpen?.()}
                     className="bg-white/10 rounded-full flex items-center px-3 py-1 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
                   >
                      <input 
                        type="text" 
                        placeholder={t('Search...', 'ଖୋଜନ୍ତୁ...')} 
                        readOnly
                        className="bg-transparent border-none focus:outline-none text-xs text-white placeholder-white/70 w-24 lg:w-32 cursor-pointer" 
                      />
                    <Search size={14} className="opacity-70" />
                 </div>
               </li>
               )}
            </ul>
         </div>
      </nav>
      )}

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-4 md:py-8 bg-gray-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
         <div className="flex items-center gap-2 mb-4 md:mb-6 text-xs text-gray-500 bg-white p-2 rounded shadow-sm w-fit">
            <span 
              className="hover:text-enam-dark cursor-pointer"
              onClick={() => handleNavClick('home')}
            >
              {t('Home', 'ହୋମ୍')}
            </span> 
            <span>/</span> 
            <span className="font-bold text-enam-dark uppercase">
              {currentView === 'dashboard'
                ? t('My Farming Dashboard', 'ମୋର କୃଷି ଡ୍ୟାସବୋର୍ଡ୍')
                : currentView === 'schemes' 
                ? t('Government Schemes', 'ସରକାରୀ ଯୋଜନା')
                : currentView === 'warehouses'
                ? t('Warehouse Locator', 'ଗୋଦାମ ସ୍ଥାନ')
                : currentView === 'advisory'
                ? t('Cultivation Advisory', 'କୃଷି ପରାମର୍ଶ')
                : currentView === 'logistics'
                ? t('Fleet Management', 'ଫ୍ଲିଟ୍ ପରିଚାଳନା')
                : role === UserRole.FARMER 
                ? t('Dashboard', 'ଡ୍ୟାସବୋର୍ଡ୍')
                : role === UserRole.FPO
                ? t('FPO Dashboard', 'FPO ଡ୍ୟାସବୋର୍ଡ୍')
                : role === UserRole.PROCESSOR
                ? t('Processor Dashboard', 'ପ୍ରକ୍ରିୟାକରଣ ଡ୍ୟାସବୋର୍ଡ୍')
                : role === UserRole.RETAILER
                ? t('Retailer Dashboard', 'ଖୁଚୁରା ବିକ୍ରେତା ଡ୍ୟାସବୋର୍ଡ୍')
                : t('Dashboard', 'ଡ୍ୟାସବୋର୍ଡ୍')}
            </span>
         </div>
         {children}
      </main>

      {/* Footer (Simplified for Mobile) */}
      <footer className="bg-enam-dark text-white pt-8 md:pt-12 pb-6 border-t-8 border-govt-orange">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-sm text-center md:text-left">
             <div className="md:col-span-1">
                <h4 className="font-bold text-lg mb-4 text-enam-green">KisanSetu</h4>
                <p className="opacity-80 text-xs leading-relaxed">
                   {t('A unified digital platform for farmers and FPOs to boost oilseed production in Odisha.', 'ଓଡ଼ିଶାରେ ତେଲ ବିଜ ଉତ୍ପାଦନ ବୃଦ୍ଧି କରିବା ପାଇଁ କୃଷକ ଏବଂ FPO ମାନଙ୍କ ପାଇଁ ଏକ ଏକୀକୃତ ଡିଜିଟାଲ୍ ପ୍ଲାଟଫର୍ମ |')}
                </p>
             </div>
             {/* Hidden on small mobile to save space, visible on md+ */}
             <div className="hidden md:block">
                <h4 className="font-bold text-lg mb-4 text-enam-green">{t('Quick Links', 'ଦ୍ରୁତ ଲିଙ୍କ୍')}</h4>
                <ul className="space-y-2 opacity-90 text-xs">
                   <li>
                     <a
                       href="https://nfsm.gov.in/Guidelines/NMEO-OPGUIEDELINES.pdf"
                       target="_blank"
                       rel="noopener noreferrer"
                       className="hover:text-govt-orange transition"
                     >
                       {t('NMEO-OP Guidelines', 'NMEO-OP ଦିଗନିର୍ଦେଶ')}
                     </a>
                   </li>
                   <li>
                     <button
                       onClick={() => handleNavClick('warehouses')}
                       className="hover:text-govt-orange transition underline underline-offset-4"
                     >
                       {t('Warehouse Map', 'ଗୋଦାମ ମାନଚିତ୍ର')}
                     </button>
                   </li>
                   <li>{t('Mandi Prices', 'ମଣ୍ଡି ମୂଲ୍ୟ')}</li>
                </ul>
             </div>
             <div className="md:col-span-2 text-center md:text-right">
                <p className="text-xs opacity-60">{t('© 2024 National Mission on Edible Oils - Oil Palm (NMEO-OP).', '© ୨୦୨୪ ଜାତୀୟ ଖାଦ୍ୟ ତେଲ ମିଶନ - ତେଲ ଖଜୁରୀ (NMEO-OP) |')}<br/>{t('Ministry of Agriculture & Farmers Welfare, Govt. of India.', 'କୃଷି ଏବଂ କୃଷକ କଲ୍ୟାଣ ମନ୍ତ୍ରଣାଳୟ, ଭାରତ ସରକାର |')}</p>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;