"use client";

import React from 'react';
import Terminal from './Terminal/Terminal';
import useOpenAI from '../../hooks/useOpenAI';

const PrivateDashboard = () => {
  const { messages, sendToOpenAI, setMessages } = useOpenAI();

  return (
    <div className="dashboard">
      <Terminal messages={messages} sendToOpenAI={sendToOpenAI} setMessages={setMessages} />
    </div>
  );
};

export default PrivateDashboard; 