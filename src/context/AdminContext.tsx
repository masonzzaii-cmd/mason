import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  isAdmin: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  isPdfManagerOpen: boolean;
  openPdfManager: () => void;
  closePdfManager: () => void;
  isCodeSyncOpen: boolean;
  openCodeSync: () => void;
  closeCodeSync: () => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ADMIN_EMAIL = 'masonzzall@outlook.com';
const ADMIN_PASSWORD = '984166396As';
const AUTH_STORAGE_KEY = 'mason_portfolio_admin_authorized';

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPdfManagerOpen, setIsPdfManagerOpen] = useState(false);
  const [isCodeSyncOpen, setIsCodeSyncOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const login = (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail === ADMIN_EMAIL.toLowerCase() && pass === ADMIN_PASSWORD) {
      setIsAdmin(true);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      } catch (e) {
        console.error(e);
      }
      setIsLoginModalOpen(false);
      showToast('🛡️ 管理员身份验证成功！已解锁网站全站编辑、PDF管理与代码保存权限。');
      return { success: true };
    }
    return { success: false, error: '账号或密码错误，请检查输入' };
  };

  const logout = () => {
    setIsAdmin(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    showToast('已退出管理员模式，当前为只读展示状态。');
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const openPdfManager = () => setIsPdfManagerOpen(true);
  const closePdfManager = () => setIsPdfManagerOpen(false);

  const openCodeSync = () => setIsCodeSyncOpen(true);
  const closeCodeSync = () => setIsCodeSyncOpen(false);

  return (
    <AdminContext.Provider
      value={{
        isAdmin,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
        toastMessage,
        showToast,
        isPdfManagerOpen,
        openPdfManager,
        closePdfManager,
        isCodeSyncOpen,
        openCodeSync,
        closeCodeSync,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
