import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL!,
  token: process.env.REDIS_TOKEN!
});

const SESSION_PREFIX = 'session:';
const AUTH_PREFIX = 'auth:';
const USER_PREFIX = 'user:';

export interface SessionData {
  walletAddress: string;
  lastSeen: number;
}

export interface AuthState {
  walletAddress: string;
  timestamp: number;
}

export interface UserData {
  telegramId?: string;
  telegramUsername?: string;
  groupMember?: boolean;
}

// Session management
export async function setSessionData(sessionId: string, data: SessionData) {
  await redis.set(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(data));
}

export async function getSessionData(sessionId: string): Promise<SessionData | null> {
  const data = await redis.get<string>(`${SESSION_PREFIX}${sessionId}`);
  return data ? JSON.parse(data) : null;
}

export async function clearSessionData(sessionId: string) {
  await redis.del(`${SESSION_PREFIX}${sessionId}`);
}

// Auth state management
export async function setAuthState(state: string, data: AuthState) {
  await redis.set(`${AUTH_PREFIX}${state}`, JSON.stringify(data), { ex: 300 }); // 5 minutes expiry
}

export async function getAuthState(state: string): Promise<AuthState | null> {
  const data = await redis.get<string>(`${AUTH_PREFIX}${state}`);
  return data ? JSON.parse(data) : null;
}

export async function clearAuthState(state: string) {
  await redis.del(`${AUTH_PREFIX}${state}`);
}

// User data management
export async function setUserData(walletAddress: string, data: UserData) {
  await redis.set(`${USER_PREFIX}${walletAddress}`, JSON.stringify(data));
}

export async function getUserData(walletAddress: string): Promise<UserData | null> {
  const data = await redis.get<string>(`${USER_PREFIX}${walletAddress}`);
  return data ? JSON.parse(data) : null;
}

export async function getAllUsers(): Promise<Record<string, UserData>> {
  const keys = await redis.keys(`${USER_PREFIX}*`);
  const users: Record<string, UserData> = {};
  
  for (const key of keys) {
    const walletAddress = key.replace(USER_PREFIX, '');
    const data = await redis.get<string>(key);
    if (data) {
      users[walletAddress] = JSON.parse(data);
    }
  }
  
  return users;
}

// Cleanup expired sessions
export async function cleanupExpiredSessions() {
  const keys = await redis.keys(`${SESSION_PREFIX}*`);
  const now = Date.now();
  const expiry = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const key of keys) {
    const data = await redis.get<string>(key);
    if (data) {
      const session: SessionData = JSON.parse(data);
      if (now - session.lastSeen > expiry) {
        await redis.del(key);
      }
    }
  }
}