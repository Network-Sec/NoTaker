import React, { useState } from 'react';
import '../styles/global_search.css';
import { getServerUrl } from '../utils';
import type { MainView } from '../types';

const API_URL = getServerUrl();

interface Props {
    setMainView: (view: MainView) => void;
    setSelectedDate: (date: Date) => void;
    setScrollToMemoId: (id: number | null) => void;
    // Props for the integrated toggle
    mainStreamViewMode: 'memo' | 'ai_conv';
    setMainStreamViewMode: (mode: 'memo' | 'ai_conv') => void;
}

const GlobalSearchBar = ({ setMainView, setSelectedDate, setScrollToMemoId, mainStreamViewMode, setMainStreamViewMode }: Props) => {
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

    const searchBarBorderColor = "#53ffff94"; // From global_search.css

    const commonToggleClasses = "py-2 px-3 text-sm font-medium transition-all duration-200 ease-in-out relative cursor-pointer";
    const activeToggleClasses = "bg-gray-700 text-white border-white z-20"; // Darker background when active
    const inactiveToggleClasses = "bg-transparent text-gray-400 hover:text-white hover:bg-gray-800 z-10"; // Hover effect for inactive

    return (
        <div className="relative flex items-stretch w-full max-w-lg mx-auto"> {/* Outer container for entire search bar + toggles */}
            {/* Memo Button (Left Wing) */}
            <button
                className={`${commonToggleClasses} ${mainStreamViewMode === 'memo' ? activeToggleClasses : inactiveToggleClasses}`}
                style={{
                    border: `1px solid ${searchBarBorderColor}`,
                    borderRight: 'none', // No right border to be flush with search input
                    transform: 'skewX(15deg)', // Corrected angle for left button
                    transformOrigin: 'bottom left', // Corrected origin
                    paddingLeft: '20px',
                    paddingRight: '30px',
                    marginRight: '-15px', // Overlap with search bar
                }}
                onClick={() => setMainStreamViewMode('memo')}
            >
                <span style={{ transform: 'skewX(-15deg)', display: 'inline-block', whiteSpace: 'nowrap' }}>Memo</span> {/* Counter-skew content */}
            </button>

            {/* Search Input */}
            <div className="global-search-bar-container flex-grow"> {/* Search bar container itself needs flex-grow here */}
                <input
                    type="text"
                    placeholder="Search everywhere..."
                    value={searchTerm}
                    onChange={handleSearch}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)} // Delay to allow click on results
                    style={{ zIndex: 30 }} // Ensure input is above skewed buttons at overlap points
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

            {/* AI Convo Button (Right Wing) */}
            <button
                className={`${commonToggleClasses} ${mainStreamViewMode === 'ai_conv' ? activeToggleClasses : inactiveToggleClasses}`}
                style={{
                    border: `1px solid ${searchBarBorderColor}`,
                    borderLeft: 'none', // No left border to be flush with search input
                    transform: 'skewX(-15deg)', // Corrected angle for right button
                    transformOrigin: 'bottom right', // Corrected origin
                    paddingLeft: '30px',
                    paddingRight: '20px',
                    marginLeft: '-15px', // Overlap with search bar
                }}
                onClick={() => setMainStreamViewMode('ai_conv')}
            >
                <span style={{ transform: 'skewX(15deg)', display: 'inline-block', whiteSpace: 'nowrap' }}>AI Convo</span> {/* Counter-skew content */}
            </button>
        </div>
    );
};

export default GlobalSearchBar;
