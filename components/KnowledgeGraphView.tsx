import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import '../styles/knowledge_graph.css';
import { getServerUrl } from '../utils';

const API_URL = getServerUrl();

const KnowledgeGraphView = () => {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchGraphData = async () => {
            try {
                const response = await fetch(`${API_URL}/api/graph-data`);
                if (!response.ok) {
                    throw new Error('Failed to fetch graph data');
                }
                const data = await response.json();
                setGraphData(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchGraphData();
    }, []);

    return (
        <div ref={containerRef} className="knowledge-graph-container">
            {containerRef.current && (
                <ForceGraph2D
                    graphData={graphData}
                    nodeLabel="id"
                    nodeVal="value"
                    linkLabel={link => `${link.source.id} - ${link.target.id}`}
                    width={containerRef.current.offsetWidth}
                    height={containerRef.current.offsetHeight}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                        const label = node.id;
                        const fontSize = 12 / globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        const textWidth = ctx.measureText(label).width;
                        const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding

                        // Node background
                        ctx.fillStyle = 'rgba(44, 44, 44, 0.9)'; // Use a darker background, var(--surface-color)
                        ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);

                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = 'white'; // White text
                        ctx.fillText(label, node.x, node.y);
                    }}
                    linkCanvasObject={(link, ctx, globalScale) => {
                        // Link rendering
                        const start = link.source;
                        const end = link.target;

                        // Ignore if link is not yet positioned
                        if (!start || !end || typeof start.x !== 'number' || typeof start.y !== 'number' || typeof end.x !== 'number' || typeof end.y !== 'number') return;

                        ctx.beginPath();
                        ctx.moveTo(start.x, start.y);
                        ctx.lineTo(end.x, end.y);
                        ctx.strokeStyle = 'rgba(136, 136, 136, 0.6)'; // Use a muted text color, var(--text-muted-color)
                        ctx.lineWidth = 1 / globalScale;
                        ctx.stroke();
                    }}
                />
            )}
        </div>
    );
};

export default KnowledgeGraphView;
