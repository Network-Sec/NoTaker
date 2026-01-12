import { useCallback } from 'react';
import type { Task, EisenhowerQuadrant } from '../types';
import * as db from '../services/db';

export const useTaskActions = (
    tasks: Task[],
    selectedDate: Date,
    refreshTasks: (date: Date) => Promise<void>
) => {

    const addTask = useCallback(async (c: string, q: EisenhowerQuadrant) => { 
        const dateString = selectedDate.toISOString().split('T')[0];
        const newTasks = [...tasks, {id:`t-${Date.now()}`, content:c, quadrant:q, completed: false, date: dateString }]; 
        await db.saveTasks(dateString, newTasks);
        refreshTasks(selectedDate);
    }, [selectedDate, tasks, refreshTasks]);

    const toggleTaskCompleted = useCallback(async (id: string) => { 
        const dateString = selectedDate.toISOString().split('T')[0];
        const newTasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        await db.saveTasks(dateString, newTasks);
        refreshTasks(selectedDate);
    }, [selectedDate, tasks, refreshTasks]);

    const updateTask = useCallback(async (updatedTask: Task) => { 
        const dateString = selectedDate.toISOString().split('T')[0];
        const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        await db.saveTasks(dateString, newTasks);
        refreshTasks(selectedDate);
    }, [selectedDate, tasks, refreshTasks]);

    const moveTask = useCallback(async (updatedTask: Task) => { 
        const dateString = selectedDate.toISOString().split('T')[0];
        const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
        await db.saveTasks(dateString, newTasks);
        refreshTasks(selectedDate);
    }, [selectedDate, tasks, refreshTasks]);

    const deleteTask = useCallback(async (id: string) => { 
        const dateString = selectedDate.toISOString().split('T')[0];
        const newTasks = tasks.map(t => 
            t.id === id ? { ...t, deletedOn: dateString } : t
        );
        await db.saveTasks(dateString, newTasks);
        refreshTasks(selectedDate);
    }, [selectedDate, tasks, refreshTasks]);

    return {
        addTask,
        toggleTaskCompleted,
        updateTask,
        moveTask,
        deleteTask
    };
};
