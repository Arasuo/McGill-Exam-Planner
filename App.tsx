
import React, { useState, useEffect, useMemo } from 'react';
import { RAW_CSV_DATA } from './constants';
import { HISTORICAL_CSV_DATA } from './historical_data';
import { parseCSV, parseHistoricalCSV } from './utils/helpers';
import { Exam, ViewMode } from './types';
import SearchBar from './components/SearchBar';
import ExamCard from './components/ExamCard';
import ScheduleSidebar from './components/ScheduleSidebar';
import AuthModal from './components/AuthModal';
import ContactPage from './components/ContactPage';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { GraduationCap, History, CalendarDays, User as UserIcon, LogOut, LogIn, Moon, Sun, Loader2, Mail } from 'lucide-react';

function App() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [schedule, setSchedule] = useState<Exam[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.CURRENT);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScheduleInitialized, setIsScheduleInitialized] = useState(false);
  const [currentView, setCurrentView] = useState<'planner' | 'contact'>('planner');

  const { user, isAuthenticated, logout, updateUser, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Parse data on mount
  useEffect(() => {
    const currentExams = parseCSV(RAW_CSV_DATA);
    const historicalExams = parseHistoricalCSV(HISTORICAL_CSV_DATA);
    
    console.log(`Parsed ${currentExams.length} current exams and ${historicalExams.length} historical exams.`);
    console.log(`Total records: ${currentExams.length + historicalExams.length}`);

    setExams([...currentExams, ...historicalExams]);
  }, []);

  // 1. Handle Initial Load & Auth Sync (Source of Truth: Server/Storage -> App)
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
        // If user is logged in, their DB schedule is the source of truth.
        setSchedule(user.savedSchedule);
    } else {
        // If guest, try to load from local storage
        const savedSchedule = localStorage.getItem('mcgill-exam-schedule');
        if (savedSchedule) {
            try {
                setSchedule(JSON.parse(savedSchedule));
            } catch (e) { 
              console.error("Failed to parse local schedule", e); 
            }
        }
    }
    setIsScheduleInitialized(true);
  }, [isLoading, isAuthenticated, user?.id]); 

  // 2. Handle Schedule Changes (Persistence: App -> Server/Storage)
  useEffect(() => {
    if (isLoading || !isScheduleInitialized) return;

    if (isAuthenticated && user) {
      const isDifferent = JSON.stringify(user.savedSchedule) !== JSON.stringify(schedule);
      if (isDifferent) {
        updateUser({ savedSchedule: schedule });
      }
    } else if (!isAuthenticated) {
      localStorage.setItem('mcgill-exam-schedule', JSON.stringify(schedule));
    }
  }, [schedule, isAuthenticated, isLoading, user, updateUser, isScheduleInitialized]);

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleExamInSchedule = (exam: Exam) => {
    setSchedule(prev => {
      const exists = prev.find(e => e.id === exam.id);
      if (exists) {
        return prev.filter(e => e.id !== exam.id);
      }
      return [...prev, exam];
    });
  };

  const removeExam = (examId: string) => {
    setSchedule(prev => prev.filter(e => e.id !== examId));
  };

  const handleSaveSearch = () => {
    if (!isAuthenticated) {
      setAuthMode('signup');
      setIsAuthModalOpen(true);
      return;
    }
    if (user && searchQuery.trim()) {
      const trimmedQuery = searchQuery.trim();
      if (!user.savedSearches.includes(trimmedQuery)) {
        updateUser({ savedSearches: [trimmedQuery, ...user.savedSearches] });
      }
    }
  };

  const isCurrentTerm = (year: string) => year === 'W2026';

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const searchTerms = searchQuery.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
    
    return exams.filter(exam => {
      const matchesSearch = searchTerms.some(term => 
        exam.course.toUpperCase().includes(term)
      );
      if (!matchesSearch) return false;

      if (viewMode === ViewMode.CURRENT) {
        return isCurrentTerm(exam.year);
      } else {
        return !isCurrentTerm(exam.year);
      }
    });
  }, [exams, searchQuery, viewMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="bg-mcgill text-white p-4 rounded-2xl inline-flex mb-4 shadow-lg">
            <GraduationCap size={48} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-mcgill animate-pulse">McGill Exam Planner</h2>
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'contact') {
    return <ContactPage onBack={() => setCurrentView('planner')} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-2 transition-colors duration-300">
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        defaultMode={authMode}
      />

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm backdrop-blur-sm bg-card/90 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('planner')}>
            <div className="bg-mcgill text-white p-2 rounded-lg">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold text-mcgill leading-none tracking-tight hidden sm:block">McGill</span>
                <span className="text-sm font-sans font-medium text-muted-foreground tracking-wide">EXAM PLANNER</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded-md border border-mcgill/30 text-[10px] text-mcgill font-bold uppercase tracking-tighter">Beta</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex bg-muted p-1 rounded-lg mr-2">
               <button
                  onClick={() => setViewMode(ViewMode.CURRENT)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === ViewMode.CURRENT ? 'bg-card text-mcgill shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
               >
                  <CalendarDays size={14} />
                  Current
               </button>
               <button
                  onClick={() => setViewMode(ViewMode.HISTORICAL)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === ViewMode.HISTORICAL ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
               >
                  <History size={14} />
                  Historical
               </button>
             </div>

             <button 
               onClick={toggleTheme}
               className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
               aria-label="Toggle theme"
             >
               {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
             </button>

             {/* Auth Section */}
             {isAuthenticated && user ? (
               <div className="relative">
                 <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-border hover:border-mcgill/50 bg-card transition-all shadow-sm"
                 >
                   <div className="w-8 h-8 rounded-full bg-mcgill/10 text-mcgill flex items-center justify-center font-bold font-serif border border-mcgill/20">
                     {user.name.charAt(0).toUpperCase()}
                   </div>
                   <span className="text-sm font-medium text-foreground max-w-[100px] truncate hidden md:block">{user.name}</span>
                 </button>
                 
                 {isUserMenuOpen && (
                   <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-xl border border-border py-1 z-20 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Signed in as</p>
                        <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                      </div>
                      <button 
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                   </>
                 )}
               </div>
             ) : (
               <div className="flex gap-2">
                 <button 
                    onClick={() => { setAuthMode('login'); setIsAuthModalOpen(true); }}
                    className="text-muted-foreground hover:text-mcgill font-medium text-sm px-3 py-2 transition-colors hidden sm:block"
                 >
                   Log in
                 </button>
                 <button 
                    onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}
                    className="bg-foreground text-background hover:opacity-90 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                 >
                   <LogIn size={16} className="hidden sm:block" />
                   Sign up
                 </button>
               </div>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="text-center py-8">
              <h2 className="font-serif text-3xl font-bold mb-4 text-foreground">Find your exam schedule</h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Search for multiple courses by separating them with a comma.
                {!isAuthenticated && (
                  <span className="block mt-2 text-sm text-mcgill cursor-pointer hover:underline" onClick={() => { setAuthMode('signup'); setIsAuthModalOpen(true); }}>
                    Sign up to sync your schedule across devices.
                  </span>
                )}
              </p>
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery} 
                onSaveSearch={handleSaveSearch}
              />
            </div>

            <div className="space-y-4">
              {searchQuery && (
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <h3 className="font-serif text-xl font-bold text-foreground">
                    {viewMode === ViewMode.CURRENT ? 'W2026 Exams' : 'Historical Data'}
                  </h3>
                  <span className="text-sm text-muted-foreground">{filteredExams.length} results found</span>
                </div>
              )}

              {filteredExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExams.map((exam) => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      isAdded={schedule.some(e => e.id === exam.id)}
                      onToggle={toggleExamInSchedule}
                    />
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border">
                  <p className="text-muted-foreground">No exams found for your search in {viewMode === ViewMode.CURRENT ? 'Winter 2026' : 'historical records'}.</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Try switching to {viewMode === ViewMode.CURRENT ? 'Historical' : 'Current'} view.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8">
                  <div className="p-6 bg-card border border-border rounded-xl shadow-soft">
                    <h4 className="font-bold mb-2">Sync Anywhere</h4>
                    <p className="text-xs text-muted-foreground">Create an account to access your saved exams on any device.</p>
                  </div>
                  <div className="p-6 bg-card border border-border rounded-xl shadow-soft">
                    <h4 className="font-bold mb-2">Smart Alerts</h4>
                    <p className="text-xs text-muted-foreground">We automatically check for conflicts and 24-hour hardships.</p>
                  </div>
                  <div className="p-6 bg-card border border-border rounded-xl shadow-soft">
                    <h4 className="font-bold mb-2">Export Easy</h4>
                    <p className="text-xs text-muted-foreground">One-click export to Google, Apple, or Outlook calendars.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <ScheduleSidebar 
              schedule={schedule} 
              onRemove={removeExam} 
            />
          </div>

        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 py-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
        <div className="flex flex-col sm:items-start items-center gap-2">
           <p>© 2026 McGill Exam Planner (Unofficial)</p>
           <button 
             onClick={() => setCurrentView('contact')}
             className="bg-mcgill/10 text-mcgill hover:bg-mcgill hover:text-white px-4 py-1.5 rounded-full font-semibold transition-all flex items-center gap-2 border border-mcgill/20"
           >
             <Mail size={14} />
             Contact Me
           </button>
        </div>
        <div className="flex gap-6">
          <a href="https://www.mcgill.ca/exams/" target="_blank" rel="noreferrer" className="hover:text-mcgill transition-colors">Official McGill Exam Site</a>
          <p>Schedule last updated: Feb 1, 2026</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
