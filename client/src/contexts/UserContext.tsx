import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface UserContextType {
  user: User | null;
  login: (phone: string, name: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'user_data';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // 从localStorage加载用户信息
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('加载用户信息失败:', error);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }, []);

  const login = async (phone: string, name: string) => {
    // 验证输入
    if (!phone || !name) {
      throw new Error('Por favor complete todos los campos');
    }

    // 验证电话号码格式（简单验证）
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Número de teléfono inválido');
    }

    // 检查是否已存在该电话号码的用户
    let userData: User;
    const existingUser = localStorage.getItem(USER_STORAGE_KEY);
    
    if (existingUser) {
      try {
        const parsed = JSON.parse(existingUser);
        if (parsed.phone === phone) {
          // 如果电话号码匹配，更新姓名（可能用户改名了）
          userData = {
            ...parsed,
            name: name,
          };
        } else {
          // 电话号码不同，创建新用户
          userData = {
            id: uuidv4(),
            phone: phone.trim(),
            name: name.trim(),
            createdAt: new Date().toISOString(),
          };
        }
      } catch {
        // 如果解析失败，创建新用户
        userData = {
          id: uuidv4(),
          phone: phone.trim(),
          name: name.trim(),
          createdAt: new Date().toISOString(),
        };
      }
    } else {
      // 创建新用户
      userData = {
        id: uuidv4(),
        phone: phone.trim(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };
    }

    // 保存用户信息
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: user !== null,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

