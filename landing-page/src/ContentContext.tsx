import React, { createContext, useState } from 'react';
import CONTENT from './content.json';

const ContentContext = createContext<any | null>(null);

interface DataContextProps {
  children: React.ReactNode;
}

const ContentProvider = ({ children }: DataContextProps) => {
  const [content] = useState<any | null>(CONTENT);

  return (
    <ContentContext.Provider value={content}>
      {children}
    </ContentContext.Provider>
  );
};

export { ContentProvider, ContentContext };
