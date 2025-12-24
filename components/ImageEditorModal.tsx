import React, { useState, useRef } from 'react';
import type { Memo } from '../types';
import { uploadImage } from '../services/db';

interface ImageEditorModalProps {
    memo: Memo;
    onSave: (memoId: number, newContent: string) => void;
    onClose: () => void;
}
 
export const ImageEditorModal = ({ memo, onSave, onClose }: ImageEditorModalProps) => {
    const imageRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPoint({ x, y });
        setCrop({ x, y, width: 0, height: 0 });
        setIsCropping(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isCropping || !startPoint || !imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const newCrop = {
            x: Math.min(startPoint.x, currentX),
            y: Math.min(startPoint.y, currentY),
            width: Math.abs(currentX - startPoint.x),
            height: Math.abs(currentY - startPoint.y)
        };
        setCrop(newCrop);
    };

    const handleMouseUp = () => {
        setIsCropping(false);
        setStartPoint(null);
    };
    
    const handleSave = async () => {
        if (!crop || !imageRef.current || crop.width === 0 || crop.height === 0) {
            onClose();
            return;
        }

        const canvas = document.createElement('canvas');
        const img = imageRef.current;
        
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;
        
        const scaledCropX = crop.x * scaleX;
        const scaledCropY = crop.y * scaleY;
        const scaledCropWidth = crop.width * scaleX;
        const scaledCropHeight = crop.height * scaleY;

        canvas.width = scaledCropWidth;
        canvas.height = scaledCropHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
            ctx.drawImage(
                img,
                scaledCropX,
                scaledCropY,
                scaledCropWidth,
                scaledCropHeight,
                0,
                0,
                scaledCropWidth,
                scaledCropHeight
            );
            
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    console.error('Failed to create blob from canvas');
                    onClose();
                    return;
                }
                
                try {
                    const originalFilename = memo.content.substring(memo.content.lastIndexOf('/') + 1);
                    const file = new File([blob], `cropped_${originalFilename}`, { type: 'image/jpeg' });
                    const { url } = await uploadImage(file);
                    onSave(memo.id, url);
                    onClose();
                } catch (error) {
                    console.error('Failed to upload cropped image:', error);
                    // Optionally show an error message to the user
                    onClose();
                }

            }, 'image/jpeg', 0.9);
        }
    };
    
    return (
        <div className="image-editor-modal-overlay" onClick={onClose}>
            <div className="image-editor-modal-content" onClick={e => e.stopPropagation()}>
                <div className="image-editor-header">
                    <h2>Edit Image</h2>
                    <button onClick={onClose}>&times;</button>
                </div>
                <div className="image-editor-body">
                    <div 
                        className="image-crop-container"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <img ref={imageRef} src={memo.content} alt="Edit" />
                        {crop && (
                            <div 
                                className="crop-selection"
                                style={{
                                    left: `${crop.x}px`,
                                    top: `${crop.y}px`,
                                    width: `${crop.width}px`,
                                    height: `${crop.height}px`
                                }}
                            />
                        )}
                    </div>
                </div>
                <div className="image-editor-footer">
                    <button className="secondary-button" onClick={onClose}>Cancel</button>
                    <button className="primary-button" onClick={handleSave} disabled={!crop || crop.width === 0}>Save Cropped Image</button>
                </div>
            </div>
        </div>
    );
};