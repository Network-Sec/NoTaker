import { useState } from 'react';
import type { MainView, Memo, Event } from '../types';

export const useNavigationState = () => {
    const [mainView, setMainView] = useState<MainView>('dashboard');
    const [mainStreamViewMode, setMainStreamViewMode] = useState<'memo' | 'ai_conv'>('memo');
    
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
    const [newMemoTimestamp, setNewMemoTimestamp] = useState<string>(new Date().toISOString());
    const [continueTimestamp, setContinueTimestamp] = useState(false);
    const [scrollToMemoId, setScrollToMemoId] = useState<number | null>(null);
    
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [selectedDateForModal, setSelectedDateForModal] = useState(new Date());
    const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

    return {
        mainView, setMainView,
        mainStreamViewMode, setMainStreamViewMode,
        selectedDate, setSelectedDate,
        currentMonth, setCurrentMonth,
        activeTag, setActiveTag,
        editingMemo, setEditingMemo,
        newMemoTimestamp, setNewMemoTimestamp,
        continueTimestamp, setContinueTimestamp,
        scrollToMemoId, setScrollToMemoId,
        isEventModalOpen, setIsEventModalOpen,
        selectedDateForModal, setSelectedDateForModal,
        editingEvent, setEditingEvent
    };
};
