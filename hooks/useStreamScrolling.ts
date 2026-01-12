import { useEffect, useRef } from 'react';
import { isSameDay } from '../utils';
import type { Memo, AIConversationItem, MainView } from '../types';

interface UseStreamScrollingProps {
    memos: Memo[];
    aiConversations: AIConversationItem[];
    mainView: MainView;
    mainStreamViewMode: 'memo' | 'ai_conv';
    selectedDate: Date;
    continueTimestamp: boolean;
    scrollToMemoId: number | null;
    setScrollToMemoId: (id: number | null) => void;
    initialDataLoaded: boolean;
    showLoadingScreen: boolean;
    minLoadTimeElapsed: boolean;
    dashboardStreamRef: React.RefObject<HTMLDivElement>;
    aiConversationStreamRef: React.RefObject<HTMLDivElement>;
}

export const useStreamScrolling = ({
    memos,
    aiConversations,
    mainView,
    mainStreamViewMode,
    selectedDate,
    continueTimestamp,
    scrollToMemoId,
    setScrollToMemoId,
    initialDataLoaded,
    showLoadingScreen,
    minLoadTimeElapsed,
    dashboardStreamRef,
    aiConversationStreamRef
}: UseStreamScrollingProps) => {
    
    const prevSelectedDateRef = useRef<Date>(selectedDate);
    const prevMainStreamViewModeRef = useRef<string>(mainStreamViewMode);
    const prevMemosLength = useRef(0);
    const initialScrollDoneRef = useRef(false);
    const SEARCH_BAR_HEIGHT_OFFSET = 100;

    // --- Comprehensive Auto-Scrolling Effect for Memo Stream ---
    useEffect(() => {
        const streamElement = dashboardStreamRef.current;
        
        // Only proceed if we are in the dashboard memo view and NOT loading
        if (!showLoadingScreen && streamElement && mainView === 'dashboard' && mainStreamViewMode === 'memo') {
            const isScrolledToBottom = streamElement.scrollHeight - streamElement.clientHeight <= streamElement.scrollTop + 50; // Tolerance of 50px
            
            // Determine triggers
            const isInitialLoadScroll = initialDataLoaded && minLoadTimeElapsed && !initialScrollDoneRef.current;
            const isDateChange = !isSameDay(prevSelectedDateRef.current, selectedDate) && !continueTimestamp;
            const isViewChange = prevMainStreamViewModeRef.current !== mainStreamViewMode;
            const hasNewMemosAndUserAtBottom = memos.length > prevMemosLength.current && isScrolledToBottom;

            if (isInitialLoadScroll || isDateChange || isViewChange || hasNewMemosAndUserAtBottom) {
                setTimeout(() => {
                    if (streamElement) {
                        streamElement.scrollTop = streamElement.scrollHeight;
                    }
                }, 50); // Small delay to allow DOM paint
                
                if (isInitialLoadScroll) {
                    initialScrollDoneRef.current = true;
                }
            }
            
            // Update refs for next run
            prevMemosLength.current = memos.length;
            prevSelectedDateRef.current = selectedDate;
            prevMainStreamViewModeRef.current = mainStreamViewMode;

        } else {
            // Even if not scrolling, keep refs updated to prevent stale comparisons when switching back
            prevMemosLength.current = memos.length;
            prevSelectedDateRef.current = selectedDate;
            prevMainStreamViewModeRef.current = mainStreamViewMode;
        }
    }, [memos, mainView, selectedDate, continueTimestamp, mainStreamViewMode, initialDataLoaded, showLoadingScreen, minLoadTimeElapsed, dashboardStreamRef]);

    // Auto-scrolling effect for AI conversation stream
    useEffect(() => {
        if (!showLoadingScreen && aiConversationStreamRef.current && mainStreamViewMode === 'ai_conv') { 
            aiConversationStreamRef.current.scrollTop = aiConversationStreamRef.current.scrollHeight;
        }
    }, [aiConversations, mainStreamViewMode, showLoadingScreen, aiConversationStreamRef]);

    // Scroll to specific memo
    useEffect(() => {
        if (!showLoadingScreen && scrollToMemoId && mainStreamViewMode === 'memo') { 
            const performScroll = () => {
                const memoElement = document.querySelector(`[data-memo-id="${scrollToMemoId}"]`);
                if (memoElement && dashboardStreamRef.current) {
                    const targetScrollTop = Math.max(0, memoElement.offsetTop - SEARCH_BAR_HEIGHT_OFFSET);
                    dashboardStreamRef.current.scrollTo({
                        top: targetScrollTop,
                        behavior: 'smooth',
                    });
                    setScrollToMemoId(null); 
                }
            };

            performScroll();
            const timer = setTimeout(performScroll, 100); 
            return () => clearTimeout(timer); 
        }
    }, [memos, scrollToMemoId, mainStreamViewMode, showLoadingScreen, setScrollToMemoId, dashboardStreamRef]);

    // No return value needed as this hook only manages side effects
};
