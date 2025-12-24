import React from 'react';
import ReactMarkdown from 'https://esm.sh/react-markdown@9';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import { AIConversationItem } from '../types';
import { CodeBlock } from './CodeBlock'; // Re-use existing CodeBlock component

interface AIChatItemProps {
  item: AIConversationItem;
}

export const AIChatItem: React.FC<AIChatItemProps> = ({ item }) => {
  const formattedTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className={`memo-item ai-chat-item ${item.type}`} data-timestamp={item.timestamp}>
      <div className="memo-header ai-chat-header">
        <div className="ai-chat-sender">{item.type === 'user' ? 'User' : 'AI'}</div>
        <div className="memo-timestamp ai-chat-timestamp">{formattedTime}</div>
      </div>
      <div className="markdown-content ai-chat-content">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            pre: ({children}) => <>{children}</>,
            code: ({node, ...props}) => {
              const codeString = String(props.children);
              const match = /language-(\w+)/.exec(props.className || '');
              const explicitLang = match ? match[1] : 'text';
              const inline = !props.className || !props.className.startsWith('language-');

              return (
                <CodeBlock 
                  node={node} 
                  inline={inline} 
                  className={props.className} 
                  children={codeString} 
                  {...props}
                />
              );
            },
            p: ({children}) => {
                if (children && Array.isArray(children) && children.length === 1 && React.isValidElement(children[0]) && (children[0].type === CodeBlock)) {
                    return <>{children}</>;
                }
                return <p>{children}</p>;
            }
          }}
        >
          {item.content}
        </ReactMarkdown>
      </div>
      {item.model && item.type === 'ai' && <div className="ai-chat-model">Model: {item.model}</div>}
    </div>
  );
};