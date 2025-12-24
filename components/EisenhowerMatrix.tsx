import React, { useState, useMemo, DragEvent } from 'react';
import type { Task, EisenhowerQuadrant } from '../types';

const QUADRANT_MAP: Record<EisenhowerQuadrant, string> = {
    'important-urgent': 'Important & Urgent',
    'important-not-urgent': 'Important & Not Urgent',
    'unimportant-urgent': 'Unimportant & Urgent',
    'unimportant-not-urgent': 'Unimportant & Not Urgent'
}; 

const Quadrant = ({ quadrant, tasks, onAddTask, onUpdateTask, onDeleteTask, onDrop, onToggleTaskCompleted }: {
    quadrant: EisenhowerQuadrant,
    tasks: Task[],
    onAddTask: (content: string, quadrant: EisenhowerQuadrant) => void,
    onUpdateTask: (id: string, content: string) => void,
    onDeleteTask: (id: string) => void,
    onDrop: (e: DragEvent<HTMLDivElement>, quadrant: EisenhowerQuadrant) => void,
    onToggleTaskCompleted: (id: string) => void // New prop
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

    const handleSaveEditedTask = (id: string) => {
        if (editedTaskContent.trim()) {
            onUpdateTask(id, editedTaskContent.trim());
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
                                onBlur={() => handleSaveEditedTask(task.id)}
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
                        <button className="delete-task-btn" onClick={() => onDeleteTask(task.id)}>&#x2715;</button> {/* X mark */}
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
    onUpdateTask: (id: string, content: string) => void;
    onMoveTask: (id: string, newQuadrant: EisenhowerQuadrant) => void;
    onDeleteTask: (id: string) => void;
    onToggleTaskCompleted: (id: string) => void; // New prop
}

export const EisenhowerMatrix = ({ tasks, onAddTask, onUpdateTask, onMoveTask, onDeleteTask, onToggleTaskCompleted }: EisenhowerMatrixProps) => {
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
                        onDrop={() => {}}
                        onToggleTaskCompleted={onToggleTaskCompleted} // Pass new prop
                    />
                ))}
            </div>
        </div>
    );
};