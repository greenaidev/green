export interface OpenAIResponse {
  message: string;
  totalTokens: number;
}

export const fetchOpenAIResponse = async (prompt: string, history: Array<{ role: string; content: string; tokens?: number }>): Promise<OpenAIResponse | null> => {
  try {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error from OpenAI API:', errorText);
      return null;
    }

    const data = await response.json();
    return {
      message: data.message,
      totalTokens: data.totalTokens,
    };
  } catch (error) {
    console.error('Error during OpenAI submission:', error);
    return null;
  }
}; 