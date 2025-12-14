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
const STORAGE_KEYS = {
  ALL_REPORTS: 'losthere_all_reports',
  ALL_CHATS: 'losthere_all_chats',
  CURRENT_USER: 'losthere_current_user',
  ALL_USERS: 'losthere_all_users',
  AUTH_STATE: 'losthere_auth_state'
};

function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [user, setUser] = useState<UserProfile | undefined>(undefined);

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

  // Load persistent data on mount
  useEffect(() => {
    loadPersistentData();
  }, []);

  // Save reports whenever they change
  useEffect(() => {
    if (allReports.length >= 0) {
      localStorage.setItem(STORAGE_KEYS.ALL_REPORTS, JSON.stringify(allReports));
    }
  }, [allReports]);

  // Save chats whenever they change
  useEffect(() => {
    if (chatThreads.length >= 0) {
      localStorage.setItem(STORAGE_KEYS.ALL_CHATS, JSON.stringify(chatThreads));
    }
  }, [chatThreads]);

  // Save current user whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      
      // Also save to users list
      const allUsersStr = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
      const allUsers = allUsersStr ? JSON.parse(allUsersStr) : [];
      const existingUserIndex = allUsers.findIndex((u: UserProfile) => u.id === user.id);
      
      if (existingUserIndex >= 0) {
        allUsers[existingUserIndex] = user;
      } else {
        allUsers.push(user);
      }
      
      localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(allUsers));
    }
  }, [user]);

  const loadPersistentData = () => {
    // Load all reports (persistent across users)
    const savedReports = localStorage.getItem(STORAGE_KEYS.ALL_REPORTS);
    if (savedReports) {
      setAllReports(JSON.parse(savedReports));
    }

    // Load all chats (persistent across users)
    const savedChats = localStorage.getItem(STORAGE_KEYS.ALL_CHATS);
    if (savedChats) {
      setChatThreads(JSON.parse(savedChats));
    }

    // Load current user session
    const savedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const savedAuthState = localStorage.getItem(STORAGE_KEYS.AUTH_STATE);

    if (savedUser && savedAuthState) {
      const authState = JSON.parse(savedAuthState);
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(authState.isLoggedIn);
      setIsGuest(authState.isGuest);
      
      if (authState.isLoggedIn || authState.isGuest) {
        setCurrentScreen('home');
      }
    }
  };

  // Handle Google login with real user data
  const handleLoginWithGoogle = (googleUserData: any) => {
    // Create or update user profile
    const userProfile: UserProfile = {
      id: googleUserData.id,
      name: googleUserData.name,
      email: googleUserData.email,
      photo: googleUserData.picture,
      username: undefined,
      phone: undefined,
      about: undefined,
      preferredCategories: []
    };

    // Check if user exists in storage
    const allUsersStr = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    const allUsers = allUsersStr ? JSON.parse(allUsersStr) : [];
    const existingUser = allUsers.find((u: UserProfile) => u.id === googleUserData.id);
    
    if (existingUser) {
      // Load existing user data
      setUser(existingUser);
    } else {
      // New user
      setUser(userProfile);
    }

    setIsLoggedIn(true);
    setIsGuest(false);
    setCurrentScreen('home');

    localStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify({ 
      isLoggedIn: true, 
      isGuest: false 
    }));
  };

  // Handle guest login
  const handleContinueAsGuest = () => {
    setIsGuest(true);
    setIsLoggedIn(false);
    setCurrentScreen('home');

    localStorage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify({ 
      isLoggedIn: false, 
      isGuest: true 
    }));
  };

  // Handle logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsGuest(false);
    setUser(undefined);
    setCurrentScreen('login');
    setActiveNavTab('home');

    // Remove current user but keep all reports and chats
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_STATE);
    
    // Reports and chats remain in storage!
  };

  // Save profile changes
  const handleSaveProfile = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  // Navigation handlers
  const handleNavTabChange = (tab: NavTab) => {
    setActiveNavTab(tab);
    
    if (tab === 'home') {
      setCurrentScreen('home');
    } else if (tab === 'chat') {
      setCurrentScreen('chat-list');
    } else if (tab === 'profile') {
      setCurrentScreen('profile');
    }
  };

  const handleCategorySelect = (category: string, type: 'lost' | 'found') => {
    setSelectedCategory(category);
    setCurrentScreen(type === 'lost' ? 'lost-form' : 'found-form');
  };

  const handleSubmitReport = (data: any, type: 'lost' | 'found') => {
    // Simulate matching logic - check against existing reports
    const oppositeType = type === 'lost' ? 'found' : 'lost';
    const matchingReports = allReports.filter(r => 
      r.type === oppositeType && 
      r.category === data.category &&
      r.color.toLowerCase() === data.color.toLowerCase()
    );
    
    const matchCount = matchingReports.length;
    
    const newReport: Report = {
      id: Date.now().toString(),
      type,
      category: data.category,
      brand: data.brand || '',
      model: data.model || data.itemName || '',
      color: data.color || '',
      characteristics: data.characteristics || '',
      location: data.location,
      date: data.date,
      photo: data.photo,
      status: matchCount > 0 ? 'matched' : 'pending',
      matchCount,
      userId: user?.id || 'guest'
    };

    const updatedReports = [...allReports, newReport];
    setAllReports(updatedReports);
    setCurrentReport(newReport);

    // If there's a match, create notification for matched users
    if (matchCount > 0) {
      const newNotification = {
        id: Date.now().toString(),
        type: 'match-found',
        message: `A new ${type} item matches your ${oppositeType} ${data.category} report`,
        timestamp: 'Just now',
        read: false
      };
      setNotifications([newNotification, ...notifications]);
      setCurrentScreen('match-result');
    } else {
      setCurrentScreen('no-match');
    }
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
  const handleClearStorage = () => {
    // Clear all persistent data
    localStorage.removeItem(STORAGE_KEYS.ALL_REPORTS);
    localStorage.removeItem(STORAGE_KEYS.ALL_CHATS);
    setAllReports([]);
    setChatThreads([]);
    setNotifications([]);
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
            onLoginWithGoogle={handleLoginWithGoogle}
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
            onStartChat={isGuest ? handleLoginWithGoogle : handleStartChat}
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
            onBack={() => setCurrentScreen('home')}
            onReportClick={(report) => {
              setCurrentReport(report);
              if (report.status === 'matched' || report.status === 'chat-ongoing') {
                if (isGuest) {
                  handleLoginWithGoogle({
                    id: 'google_demo',
                    email: 'demo@university.edu',
                    name: 'Demo User'
                  });
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
            onLoginWithGoogle={() => handleLoginWithGoogle({
              id: 'google_demo',
              email: 'demo@university.edu',
              name: 'Demo User'
            })}
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
              setCurrentScreen('profile');
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
