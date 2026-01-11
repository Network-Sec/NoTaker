import React, { useState, useMemo, DragEvent } from 'react';
import type { Task, EisenhowerQuadrant } from '../types';

const QUADRANT_MAP: Record<EisenhowerQuadrant, string> = {
    'important-urgent': 'Important & Urgent',
    'important-not-urgent': 'Important & Not Urgent',
    'unimportant-urgent': 'Unimportant & Urgent',
    'unimportant-not-urgent': 'Unimportant & Not Urgent'
}; 

const Quadrant = ({ quadrant, tasks, onAddTask, onUpdateTask, onDeleteTask, onDrop, onToggleTaskCompleted, selectedDate }: { // Added selectedDate
    quadrant: EisenhowerQuadrant,
    tasks: Task[],
    onAddTask: (content: string, quadrant: EisenhowerQuadrant) => void,
    onUpdateTask: (task: Task) => void, // Changed signature
    onDeleteTask: (task: Task) => void, // Changed signature
    onDrop: (e: DragEvent<HTMLDivElement>, quadrant: EisenhowerQuadrant) => void,
    onToggleTaskCompleted: (id: string) => void,
    selectedDate: Date, // Added selectedDate
}) => {
    const [newTaskContent, setNewTaskContent] = useState('');
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [editedTaskContent, setEditedTaskContent] = useState('');

    const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newTaskContent.trim()) {
            onAddTask(newTaskContent.trim(), quadrant);
            setNewTaskContent('');
        }
    };

    const handleEditTask = (task: Task) => {
        setEditingTaskId(task.id);
        setEditedTaskContent(task.content);
    };

    const handleSaveEditedTask = (task: Task) => { // Takes task instead of id
        if (editedTaskContent.trim()) {
            onUpdateTask({ ...task, content: editedTaskContent.trim() }); // Pass full task object
            setEditingTaskId(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingTaskId(null);
        setEditedTaskContent('');
    };

    return (
        <div 
            className="matrix-quadrant" 
            data-quadrant={quadrant}
        >
            <h4 className="quadrant-title">{QUADRANT_MAP[quadrant]}</h4>
            <ul className="quadrant-task-list">
                {tasks.map(task => (
                    <li key={task.id} className={`eisenhower-task-item ${task.completed ? 'completed-task' : ''}`}>
                        <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => onToggleTaskCompleted(task.id)}
                            className="task-checkbox"
                        />
                        {editingTaskId === task.id ? (
                            <input
                                type="text"
                                value={editedTaskContent}
                                onChange={(e) => setEditedTaskContent(e.target.value)}
                                onBlur={() => handleSaveEditedTask(task)} // Pass full task
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.currentTarget.blur(); // Trigger onBlur
                                    } else if (e.key === 'Escape') {
                                        handleCancelEdit();
                                    }
                                }}
                                autoFocus
                                className="edit-task-input"
                            />
                        ) : (
                            <span onDoubleClick={() => handleEditTask(task)}>{task.content}</span>
                        )}
                        <button className="delete-task-btn" onClick={() => onDeleteTask(task)}>&#x2715;</button> {/* Pass full task */}
                    </li>
                ))}
            </ul>
            <div className="quadrant-add-task">
                <input 
                    type="text"
                    placeholder="+ Add task"
                    value={newTaskContent}
                    onChange={(e) => setNewTaskContent(e.target.value)}
                    onKeyDown={handleAddTask}
                />
            </div>
        </div>
    );
}

interface EisenhowerMatrixProps {
    tasks: Task[];
    onAddTask: (content: string, quadrant: EisenhowerQuadrant) => void;
    onUpdateTask: (task: Task) => void; // Changed signature
    onMoveTask: (task: Task) => void; // Changed signature
    onDeleteTask: (task: Task) => void; // Changed signature
    onToggleTaskCompleted: (id: string) => void;
    selectedDate: Date; // Added selectedDate
}

export const EisenhowerMatrix = ({ tasks, onAddTask, onUpdateTask, onMoveTask, onDeleteTask, onToggleTaskCompleted, selectedDate }: EisenhowerMatrixProps) => { // Accept selectedDate
    const quadrants = useMemo<Record<EisenhowerQuadrant, Task[]>>(() => {
        return {
            'important-urgent': tasks.filter(t => t.quadrant === 'important-urgent'),
            'important-not-urgent': tasks.filter(t => t.quadrant === 'important-not-urgent'),
            'unimportant-urgent': tasks.filter(t => t.quadrant === 'unimportant-urgent'),
            'unimportant-not-urgent': tasks.filter(t => t.quadrant === 'unimportant-not-urgent')
        };
    }, [tasks]);
    
    return (
        <div className="eisenhower-matrix-container">
            <h3>Eisenhower Matrix</h3>
            <div className="eisenhower-matrix">
                {(Object.keys(quadrants) as EisenhowerQuadrant[]).map(quadrant => (
                    <Quadrant
                        key={quadrant}
                        quadrant={quadrant}
                        tasks={quadrants[quadrant]}
                        onAddTask={onAddTask}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        onDrop={() => {}} // Drag/Drop not implemented yet
                        onToggleTaskCompleted={onToggleTaskCompleted}
                        selectedDate={selectedDate} // Pass selectedDate
                    />
                ))}
            </div>
        </div>
    );
};