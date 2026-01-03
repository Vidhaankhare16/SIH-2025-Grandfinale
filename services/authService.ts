import { UserRole } from '../types';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
}

// Predefined users - 2 for each role
export const users: User[] = [
  // Farmers
  { id: 'farmer_1', username: 'farmer1', password: 'farmer123', role: UserRole.FARMER, name: 'Ramesh Kumar' },
  { id: 'farmer_2', username: 'farmer2', password: 'farmer123', role: UserRole.FARMER, name: 'Suresh Patra' },
  
  // FPO
  { id: 'fpo_1', username: 'fpo1', password: 'fpo123', role: UserRole.FPO, name: 'Odisha FPO Cooperative' },
  { id: 'fpo_2', username: 'fpo2', password: 'fpo123', role: UserRole.FPO, name: 'Bhubaneswar FPO' },
  
  // Processor
  { id: 'processor_1', username: 'processor1', password: 'processor123', role: UserRole.PROCESSOR, name: 'Odisha Oil Processors' },
  { id: 'processor_2', username: 'processor2', password: 'processor123', role: UserRole.PROCESSOR, name: 'Cuttack Processing Unit' },
  
  // Retailer
  { id: 'retailer_1', username: 'retailer1', password: 'retailer123', role: UserRole.RETAILER, name: 'City Retail Store' },
  { id: 'retailer_2', username: 'retailer2', password: 'retailer123', role: UserRole.RETAILER, name: 'Market Retail Outlet' },
  
  // Government
  { id: 'govt_1', username: 'admin1', password: 'admin123', role: UserRole.GOVERNMENT, name: 'NMEO-OP Admin' },
  { id: 'govt_2', username: 'admin2', password: 'admin123', role: UserRole.GOVERNMENT, name: 'Odisha Agriculture Dept' },
];

export const getUserById = (id: string): User | undefined => {
  // Check in-memory users first
  let user = users.find(u => u.id === id);
  
  // If not found, check localStorage
  if (!user) {
    const storedUsers = getStoredUsers();
    user = storedUsers.find(u => u.id === id);
  }
  
  return user;
};

// Get users from localStorage
const getStoredUsers = (): User[] => {
  try {
    const stored = localStorage.getItem('kisansetu_users');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save users to localStorage
const saveStoredUsers = (newUsers: User[]) => {
  try {
    localStorage.setItem('kisansetu_users', JSON.stringify(newUsers));
  } catch (error) {
    console.error('Failed to save users to localStorage:', error);
  }
};

// Get all users (in-memory + stored)
export const getAllUsers = (): User[] => {
  const storedUsers = getStoredUsers();
  return [...users, ...storedUsers];
};

// Create a new user
export const createUser = (username: string, password: string, role: UserRole, name: string): User | null => {
  // Check if username already exists
  const allUsers = getAllUsers();
  if (allUsers.some(u => u.username === username)) {
    return null; // Username already exists
  }

  // Generate a unique ID
  const id = `${role.toLowerCase()}_${Date.now()}`;
  
  // Clear all past data before creating new account (pass role and userId for role-specific cleanup)
  try {
    const { clearAllPastData } = require('./dataCleanupService');
    clearAllPastData(role, id);
  } catch (error) {
    console.warn('Could not clear past data:', error);
  }
  
  const newUser: User = {
    id,
    username,
    password,
    role,
    name,
  };

  // Save to localStorage
  const storedUsers = getStoredUsers();
  storedUsers.push(newUser);
  saveStoredUsers(storedUsers);

  return newUser;
};

// Update login function to check both in-memory and stored users
export const login = (username: string, password: string): User | null => {
  const allUsers = getAllUsers();
  const user = allUsers.find(u => u.username === username && u.password === password);
  return user || null;
};

