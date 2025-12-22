import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { CategorySelect } from './components/CategorySelect';
import { DynamicReportForm } from './components/DynamicReportForm';
import { MatchResult } from './components/MatchResult';
import { NoMatch } from './components/NoMatch';
import { ChatScreen } from './components/ChatScreen';
import { ChatListScreen, type ChatThread } from './components/ChatListScreen';
import { NotificationScreen } from './components/NotificationScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { EditProfileScreen } from './components/EditProfileScreen';
import { StorageManagementScreen } from './components/StorageManagementScreen';
import { BottomNav, type NavTab } from './components/BottomNav';
import { supabase } from './lib/supabase';


export type Screen = 
  | 'login'
  | 'home' 
  | 'category-select-lost'
  | 'category-select-found'
  | 'lost-form' 
  | 'found-form' 
  | 'match-result' 
  | 'no-match' 
  | 'chat-list'
  | 'chat-detail' 
  | 'notifications' 
  | 'history'
  | 'profile'
  | 'edit-profile'
  | 'storage-management';

export interface Report {
  id: string;
  type: 'lost' | 'found';
  category: string;
  brand: string;
  model: string;
  color: string;
  characteristics: string;
  location: string;
  date: string;
  photo?: string;
  status: 'pending' | 'matched' | 'chat-ongoing' | 'completed';
  matchCount?: number;
  userId?: string; // Track which user created the report
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  photo?: string;
  username?: string;
  phone?: string;
  about?: string;
  preferredCategories?: string[];
}

// Storage keys for persistent data


function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<any>(null);


  // Navigation state
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Data state - PERSISTENT across all users
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: '1',
      type: 'match-found',
      message: 'A new found item matches your lost laptop report',
      timestamp: '2 hours ago',
      read: false
    }
  ]);

  const requireAuth = (screen: Screen) => {
    const protectedScreens: Screen[] = [
      'profile',
      'edit-profile',
      'chat-list',
      'chat-detail',
      'notifications',
      'storage-management'
    ];

    if (protectedScreens.includes(screen)) {
      if (!user) {
        setCurrentScreen('login');
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.full_name,
          photo: session.user.user_metadata.avatar_url
        });
        setIsLoggedIn(true);
        setCurrentScreen('home');
      } else {
        setIsLoggedIn(false);
        setCurrentScreen('login');
      }
    });

  return () => subscription.unsubscribe();
}, []);


  // Mock chat threads - PERSISTENT across all users
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([
    {
      id: '1',
      userName: 'Sarah Johnson',
      itemType: 'Lost Phone - iPhone 14',
      lastMessage: 'Yes, that sounds like my phone! When can we meet?',
      timestamp: '10:30 AM',
      unread: true
    },
    {
      id: '2',
      userName: 'Mike Chen',
      itemType: 'Found Wallet',
      lastMessage: 'I found a wallet near the library.',
      timestamp: 'Yesterday',
      unread: false
    }
  ]);

  const fetchReports = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch reports error:', error.message);
      return;
    }

    setAllReports(data || []);
  };



  useEffect(() => {
    if (!user) return;

    fetchReports();
  }, [user]);
  


  const loadReportsFromBackend = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setAllReports(data || []);
    }
  };


  useEffect(() => {
    if (user) {
      loadReportsFromBackend();
    }
  }, [user]);

  useEffect(() => {
    if (!user && !isGuest && currentScreen !== 'login') {
      setCurrentScreen('login');
    }
  }, [user, isGuest, currentScreen]);


  // Load persistent data on mount
 

  // Save reports whenever they change


  // Save chats whenever they change


  // Save current user whenever it changes
  

  

  // Handle Google login with real user data


  // Handle guest login
  const handleContinueAsGuest = () => {
    setIsGuest(true);
    setIsLoggedIn(false);
    setCurrentScreen('home');

  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentScreen('login');
  };


  // Save profile changes
  const handleSaveProfile = (updatedUser: UserProfile) => {
    setUser({
      ...user!,
      ...updatedUser
    });
  };

  // Navigation handlers
  const handleNavTabChange = (tab: NavTab) => {
    setActiveNavTab(tab);
    
    if (tab === 'home') {
      setCurrentScreen('home');
    } else if (tab === 'chat') {
      setCurrentScreen('chat-list');
    } else if (tab === 'profile') {
      requireAuth('profile') && setCurrentScreen('profile');
    }
  };

  const handleCategorySelect = (category: string, type: 'lost' | 'found') => {
    setSelectedCategory(category);
    setCurrentScreen(type === 'lost' ? 'lost-form' : 'found-form');
  };

  const calculateMatchScore = (a: any, b: any) => {
    let score = 0;

    if (a.brand && b.brand && a.brand === b.brand) score += 3;
    if (a.color && b.color && a.color === b.color) score += 2;
    if (a.model && b.model && a.model === b.model) score += 3;

    if (
      a.characteristics &&
      b.characteristics &&
      b.characteristics.toLowerCase().includes(a.characteristics.toLowerCase())
    ) {
      score += 2;
    }

    if (a.location === b.location) score += 1;

    return score;
  };


  const checkMatchingAndNotify = async (data: any, type: 'lost' | 'found') => {
    if (!user) return;

    const oppositeType = type === 'lost' ? 'found' : 'lost';

    const { data: candidates } = await supabase
      .from('reports')
      .select('*')
      .eq('type', oppositeType)
      .eq('category', data.category)
      .neq('user_id', user.id);

    if (!candidates || candidates.length === 0) {
      setCurrentScreen('no-match');
      return;
    }

    const matchedReports = candidates.filter((r) => {
      const score = calculateMatchScore(data, r);
      return score >= 5; // 🎯 threshold
    });

    if (matchedReports.length > 0) {
      const newNotification = {
        id: Date.now().toString(),
        type: 'match-found',
        message: `Ada laporan ${oppositeType} yang sangat cocok dengan laporan ${type} Anda`,
        timestamp: 'Baru saja',
        read: false
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setCurrentScreen('match-result');
    } else {
      setCurrentScreen('no-match');
    }
  };


  const isDuplicateReport = (
    newReport: Report,
    existingReports: Report[],
    userId: string
  ) => {
    return existingReports.some((r) => {
      if (r.userId !== userId) return false;

      const sameCategory = r.category === newReport.category;
      const sameLocation = r.location === newReport.location;
      const sameTypeOpposite = r.type !== newReport.type;

      return sameCategory && sameLocation && sameTypeOpposite;
    });
  };


  const handleSubmitReport = async (data: any, type: 'lost' | 'found') => {
    if (!user) return;

    // 🔴 CEK DUPLIKAT
    const tempReport: Report = {
      id: 'temp',
      userId: user.id,
      type,
      category: data.category,
      brand: data.brand || '',
      model: data.model || '',
      color: data.color || '',
      characteristics: data.characteristics || '',
      location: data.location,
      date: data.date,
      status: 'pending'
    };

    const duplicate = isDuplicateReport(
      tempReport,
      allReports,
      user.id
    );

    if (duplicate) {
      alert(
        'Anda sudah pernah melaporkan barang yang sama.\n' +
        'Laporan tidak disimpan.'
      );
      return;
    }

    // 🔵 INSERT KE SUPABASE
    const { data: inserted, error } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        type,
        category: data.category,
        brand: data.brand || '',
        model: data.model || '',
        color: data.color || '',
        characteristics: data.characteristics || '',
        location: data.location,
        date: data.date,
        photo: data.photo,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    setCurrentReport(inserted);
    await checkMatchingAndNotify(inserted, type);
  };


  

  const handleStartChat = () => {
    if (currentReport) {
      setAllReports(allReports.map(r => 
        r.id === currentReport.id ? { ...r, status: 'chat-ongoing' } : r
      ));
      
      // Add to chat threads if not exists
      const chatExists = chatThreads.some(c => c.id === currentReport.id);
      if (!chatExists) {
        const newChat: ChatThread = {
          id: currentReport.id,
          userName: 'Match User',
          itemType: `${currentReport.type === 'lost' ? 'Lost' : 'Found'} ${currentReport.category}`,
          lastMessage: 'Chat started',
          timestamp: 'Just now',
          unread: false
        };
        setChatThreads([newChat, ...chatThreads]);
      }
    }
    setCurrentScreen('chat-detail');
  };

  const handleChatClick = (chatId: string) => {
    setCurrentChatId(chatId);
    // Mark as read
    setChatThreads(chatThreads.map(c => 
      c.id === chatId ? { ...c, unread: false } : c
    ));
    setCurrentScreen('chat-detail');
  };

  // Storage management
  const handleClearStorage = async () => {
  if (!user) return;

  await supabase.from('reports').delete().eq('user_id', user.id);
  await supabase.from('chats').delete().eq('user_id', user.id);

  setAllReports([]);
  setChatThreads([]);
  setNotifications([]);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!user) {
      alert('Silakan login untuk menghapus laporan');
      return;
    }

    if (!confirm('Hapus laporan ini?')) return;

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setAllReports(prev => prev.filter(r => r.id !== reportId));
  };


  const handleExportData = () => {
    const data = {
      reports: allReports,
      chats: chatThreads,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `losthere-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show bottom nav on main screens
  const showBottomNav = 
    currentScreen === 'home' || 
    currentScreen === 'chat-list' || 
    currentScreen === 'profile';

  const unreadChatCount = chatThreads.filter(c => c.unread).length;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* Mobile Frame */}
      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden relative" style={{ height: '812px' }}>
        {/* Login Screen */}
        {currentScreen === 'login' && (
          <LoginScreen
            onLoginWithGoogle={async () => {
            await supabase.auth.signInWithOAuth({
            provider: 'google'
          });
        }}
        onContinueAsGuest={handleContinueAsGuest}
      />

        )}

        {/* Home Screen */}
        {currentScreen === 'home' && (
          <HomeScreen
            onReportLost={() => setCurrentScreen('category-select-lost')}
            onReportFound={() => setCurrentScreen('category-select-found')}
            onOpenNotifications={() => setCurrentScreen('notifications')}
            onOpenHistory={() => setCurrentScreen('history')}
            notificationCount={notifications.filter(n => !n.read).length}
          />
        )}

        {/* Category Selection */}
        {currentScreen === 'category-select-lost' && (
          <CategorySelect
            type="lost"
            onBack={() => setCurrentScreen('home')}
            onSelectCategory={(category) => handleCategorySelect(category, 'lost')}
          />
        )}

        {currentScreen === 'category-select-found' && (
          <CategorySelect
            type="found"
            onBack={() => setCurrentScreen('home')}
            onSelectCategory={(category) => handleCategorySelect(category, 'found')}
          />
        )}

        {/* Report Forms */}
        {currentScreen === 'lost-form' && (
          <DynamicReportForm
            type="lost"
            category={selectedCategory}
            onBack={() => setCurrentScreen('category-select-lost')}
            onSubmit={(data) => handleSubmitReport(data, 'lost')}
          />
        )}

        {currentScreen === 'found-form' && (
          <DynamicReportForm
            type="found"
            category={selectedCategory}
            onBack={() => setCurrentScreen('category-select-found')}
            onSubmit={(data) => handleSubmitReport(data, 'found')}
          />
        )}

        {/* Match Results */}
        {currentScreen === 'match-result' && currentReport && (
          <MatchResult
            matchCount={currentReport.matchCount || 0}
            reportType={currentReport.type}
            onStartChat={() => {
              if (isGuest) {
                setCurrentScreen('login');
              } else {
                handleStartChat();
              }
          }}
            onBackHome={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'no-match' && (
          <NoMatch
            onBackHome={() => setCurrentScreen('home')}
          />
        )}

        {/* Chat Screens */}
        {currentScreen === 'chat-list' && (
          <ChatListScreen
            chats={chatThreads}
            onChatClick={handleChatClick}
            isGuest={isGuest}
          />
        )}

        {currentScreen === 'chat-detail' && (
          <ChatScreen
            userName={chatThreads.find(c => c.id === currentChatId)?.userName || 'User'}
            itemType={chatThreads.find(c => c.id === currentChatId)?.itemType || 'Item'}
            reportType={currentReport?.type || 'lost'}
            onBack={() => setCurrentScreen('chat-list')}
          />
        )}

        {/* Notifications */}
        {currentScreen === 'notifications' && (
          <NotificationScreen
            notifications={notifications}
            onBack={() => setCurrentScreen('home')}
            onNotificationClick={() => setCurrentScreen('match-result')}
          />
        )}

        {/* History */}
        {currentScreen === 'history' && (
          <HistoryScreen
            reports={allReports}
            onDeleteReport={handleDeleteReport}
            onBack={() => setCurrentScreen('home')}
            onReportClick={(report) => {
              setCurrentReport(report);
              if (report.status === 'matched' || report.status === 'chat-ongoing') {
                if (isGuest) {
                  setCurrentScreen('login');
                } else {
                  setCurrentScreen('chat-detail');
                }
              }
            }}
          />
        )}

        {/* Profile */}
        {currentScreen === 'profile' && (
          <ProfileScreen
            isGuest={isGuest}
            user={user}
            reportCount={allReports.length}
            onLoginWithGoogle={() => setCurrentScreen('login')}
            onEditProfile={() => setCurrentScreen('edit-profile')}
            onViewReports={() => setCurrentScreen('history')}
            onNotificationSettings={() => {
              alert('Notification settings coming soon!');
            }}
            onStorageManagement={() => setCurrentScreen('storage-management')}
            onLogout={handleLogout}
          />
        )}

        {/* Edit Profile */}
        {currentScreen === 'edit-profile' && user && (
          <EditProfileScreen
            user={user}
            onBack={() => setCurrentScreen('profile')}
            onSave={(updatedUser) => {
              handleSaveProfile(updatedUser);
              requireAuth('profile') && setCurrentScreen('profile');
            }}
          />
        )}

        


        {/* Storage Management */}
        {currentScreen === 'storage-management' && (
          <StorageManagementScreen
            onBack={() => setCurrentScreen('profile')}
            reportCount={allReports.length}
            chatCount={chatThreads.length}
            onClearStorage={handleClearStorage}
            onExportData={handleExportData}
          />
        )}

        {/* Bottom Navigation */}
        {showBottomNav && (
          <BottomNav
            activeTab={activeNavTab}
            onTabChange={handleNavTabChange}
            unreadChatCount={unreadChatCount}
          />
        )}
      </div>
    </div>
  );
}

export default App;
