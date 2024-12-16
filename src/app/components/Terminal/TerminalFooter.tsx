import { useState } from 'react';

const TerminalFooter = () => {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (input.startsWith('/')) {
        handleCommand(input);
      } else {
        await sendToOpenAI(input);
      }
    } catch (error) {
      console.error('Error during submission:', error);
    }

    setInput('');
  };

  const handleCommand = (command: string) => {
    switch (command) {
      case '/help':
        console.log('Help command executed');
        break;
      case '/imagine':
        console.log('Imagine command executed');
        break;
      default:
        console.warn('Unknown command:', command);
        break;
    }
  };

  const sendToOpenAI = async (prompt: string) => {
    try {
      const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
      console.log('Chat history loaded:', history);

      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error from OpenAI API:', errorText);
        return;
      }

      const data = await response.json();
      console.log('OpenAI response:', data.message);
      const newHistory = [...history, { role: 'user', content: prompt }, { role: 'assistant', content: data.message }];
      localStorage.setItem('chatHistory', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error during OpenAI submission:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="footer">
      <form className="terminal" onSubmit={handleSubmit}>
        <textarea
          required
          placeholder=">_"
          maxLength={5000}
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        ></textarea>
      </form>
    </div>
  );
};

export default TerminalFooter; 