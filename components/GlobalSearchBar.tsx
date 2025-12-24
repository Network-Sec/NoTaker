import React, { useState } from 'react';
import '../styles/global_search.css';
import { getServerUrl } from '../utils';
import type { MainView } from '../types';

const API_URL = getServerUrl();

interface Props {
    setMainView: (view: MainView) => void;
    setSelectedDate: (date: Date) => void;
    setScrollToMemoId: (id: number | null) => void;
}

const GlobalSearchBar = ({ setMainView, setSelectedDate, setScrollToMemoId }: Props) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isFocused, setIsFocused] = useState(false);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchTerm(query);
        if (query.length > 2) {
            try {
                const response = await fetch(`${API_URL}/api/search?q=${query}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch search results');
                }
                const data = await response.json();
                setResults(data);
            } catch (error) {
                console.error(error);
                setResults([]);
            }
        } else {
            setResults([]);
        }
    };

    const handleResultClick = (result: any) => {
        setMainView('dashboard');
        setSelectedDate(new Date(result.timestamp));
        setScrollToMemoId(result.id);
        setIsFocused(false); // Close dropdown
        setSearchTerm(''); // Clear search term
    };

    const renderResult = (result) => {
        switch (result.type) {
            case 'memo':
                return (
                    <>
                        <span className="result-type memo">Memo</span>
                        <p>{result.content}</p>
                    </>
                );
            case 'bookmark':
                return (
                    <>
                        <span className="result-type bookmark">Bookmark</span>
                        <p>{result.title}</p>
                        <small>{result.url}</small>
                    </>
                );
            case 'history':
                return (
                    <>
                        <span className="result-type history">History</span>
                        <p>{result.title}</p>
                        <small>{result.url}</small>
                    </>
                );
            default:
                return null;
        }
    }

    return (
        <div className="global-search-bar-container">
            <input
                type="text"
                placeholder="Search everywhere..."
                value={searchTerm}
                onChange={handleSearch}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click on results
            />
            {isFocused && results.length > 0 && (
                <div className="search-results-dropdown">
                    {results.map(result => (
                        <div key={`${result.type}-${result.id}`} className="search-result-item" onClick={() => handleResultClick(result)}>
                            {renderResult(result)}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GlobalSearchBar;
