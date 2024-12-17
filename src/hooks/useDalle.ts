import { useState } from 'react';

const useDalle = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (prompt: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/imagine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
      console.error('Error generating image:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateMeme = async (prompt: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/meme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meme');
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate meme');
      console.error('Error generating meme:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    generateImage,
    generateMeme,
    imageUrl,
    loading,
    error,
  };
};

export default useDalle;