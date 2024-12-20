// Types for Redis data
export interface UserData {
  user: string;
  [key: string]: string | number;
}

// These functions are now handled by API routes
export async function updateUserData(walletAddress: string, tokenBalance: number): Promise<void> {
  const response = await fetch('/api/redis/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      walletAddress,
      tokenBalance,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update Redis data');
  }
}

export async function getUserData(walletAddress: string): Promise<UserData | null> {
  const response = await fetch(`/api/redis/get?wallet=${walletAddress}`);
  
  if (!response.ok) {
    return null;
  }

  const { data } = await response.json();
  return data;
} 