import React, { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'https://esm.sh/react-syntax-highlighter@15';
import { vscDarkPlus } from 'https://esm.sh/react-syntax-highlighter@15/dist/esm/styles/prism';

interface CodeBlockProps {
    node?: any;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
}

// Helper to auto-detect JS/TS if user forgot to specify language
const detectLanguage = (code: string, explicitLang: string): string => {
    if (explicitLang && explicitLang !== 'text') return explicitLang;
    if (code.includes('import ') && code.includes('from ')) return 'typescript';
    if (code.includes('const ') || code.includes('let ') || code.includes('function ')) return 'javascript';
    if (code.includes('class ') && code.includes('{')) return 'css';
    if (code.startsWith('<') && code.includes('>')) return 'html';
    return 'text';
};

export const CodeBlock = ({ inline, className, children, ...props }: CodeBlockProps) => {
    // DEFAULT TO FALSE (Expanded) for chat stream readability
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const codeString = String(children).replace(/\n$/, '');
    const match = /language-(\w+)/.exec(className || '');
    const explicitLang = match ? match[1] : 'text';
    const language = detectLanguage(codeString, explicitLang);
    const displayLabel = language === 'text' ? 'CODE' : language.toUpperCase();

    useEffect(() => {
        if (!document.getElementById('font-jetbrains-mono')) {
            const link = document.createElement('link');
            link.id = 'font-jetbrains-mono';
            link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap';
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    }, []);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(codeString);
    };

    if (!inline) {
        return (
            <pre className="code-block-container">
                <div 
                    className="code-header" 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="code-header-left">
                        <svg 
                            width="12" height="12" viewBox="0 0 24 24" 
                            fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                            className={`collapse-icon ${isCollapsed ? '' : 'expanded'}`}
                        >
                            <path d="M9 18l6-6-6-6"/>
                        </svg>

                        <span className="language-label">
                            {displayLabel}
                        </span>
                        
                        {isCollapsed && (
                             <span className="code-preview">
                                {codeString.split('\n')[0]}...
                             </span>
                        )}
                    </div>

                    <button 
                        onClick={handleCopy}
                        className="copy-button"
                    >
                        Copy
                    </button>
                </div>

                {!isCollapsed && (
                    <SyntaxHighlighter
                        {...props}
                        style={vscDarkPlus}
                        language={language}
                        PreTag="div"
                        wrapLongLines={true}
                        codeTagProps={{
                            className: 'syntax-highlighter-code'
                        }}
                        customStyle={{ 
                            margin: 0, 
                            padding: '12px', 
                            backgroundColor: '#1e1e1e',
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace"
                        }}
                    >
                        {codeString}
                    </SyntaxHighlighter>
                )}
            </pre>
        );
    }

    return (
        <code className={`inline-code ${className}`}>
            {children}
        </code>
    );
};