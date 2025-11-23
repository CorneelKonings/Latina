import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

const USERS_KEY = 'via_latina_users';
const CURRENT_USER_KEY = 'via_latina_current_user';

interface StoredUser extends User {
  passwordHash: string; // In a real app, never store plain text, here we simulate
}

const getUsers =(): StoredUser[] => {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
}

const saveUsers = (users: StoredUser[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const login = async (email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password);
    
    if (user) {
        const { passwordHash, ...safeUser } = user;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
        return safeUser;
    }
    throw new Error("Ongeldig e-mailadres of wachtwoord.");
};

export const register = async (name: string, email: string, password: string): Promise<User> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!name || !email || !password) throw new Error("Vul alle velden in.");
    
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Dit e-mailadres is al in gebruik.");
    }

    const newUser: StoredUser = {
        id: uuidv4(),
        email: email.toLowerCase(),
        name,
        passwordHash: password
    };

    users.push(newUser);
    saveUsers(users);

    const { passwordHash, ...safeUser } = newUser;
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
    return safeUser;
};

export const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = (): User | null => {
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return stored ? JSON.parse(stored) : null;
};