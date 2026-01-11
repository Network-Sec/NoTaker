import React from 'react';
import type { LinkPreviewData } from '../types';
import '../styles/link_preview.css';

interface LinkPreviewProps {
    data: LinkPreviewData;
}

export const LinkPreview = ({ data }: LinkPreviewProps) => {
    if (!data) return null;

    const title = data.title || data.url;
    const description = data.description;
    const siteName = data.siteName || new URL(data.url).hostname;
    
    // The backend guarantees these are local paths (e.g., /uploads/...) or null
    const imageUrl = data.imageUrl;
    const faviconUrl = data.faviconUrl;

    return (
        <a href={data.url} target="_blank" rel="noopener noreferrer" className="link-preview-container">
            {imageUrl ? (
                <div className="link-preview-image-wrapper">
                    <img src={imageUrl} alt="" className="link-preview-image" loading="lazy" />
                </div>
            ) : null}
            
            <div className="link-preview-content">
                <div className="link-preview-header">
                    {faviconUrl && (
                        <img src={faviconUrl} alt="" className="link-preview-favicon" loading="lazy" />
                    )}
                    <span className="link-preview-site-name">{siteName}</span>
                </div>
                <h4 className="link-preview-title">{title}</h4>
                {description && <p className="link-preview-description">{description}</p>}
            </div>
        </a>
    );
};