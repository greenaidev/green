import { useState } from 'react';

const useDalle = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateImage = async (prompt: string) => {
    setLoading(true);
    try {
      console.log('Sending request to /api/imagine with prompt:', prompt);
      const response = await fetch('/api/imagine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error from DALL-E API:', errorText);
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Received image URL:', data.imageUrl);
      setImageUrl(data.imageUrl);
    } catch (error) {
      console.error('Error during image generation:', error);
    } finally {
      setLoading(false);
    }
  };

  return { imageUrl, generateImage, loading };
};

export default useDalle;