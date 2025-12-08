import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { DOMAIN_API } from "../config";
import { Bar, Scatter } from "react-chartjs-2";
import {
Chart as ChartJS,
CategoryScale,
LinearScale,
BarElement,
PointElement,
LineElement,
Title,
Tooltip,
Legend
} from "chart.js";
import WordCloud from "./WordCloud";
import ForceGraph2D from "react-force-graph-2d";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function VisualizationPage() {
const [data, setData] = useState(null);

useEffect(() => {
const fetchVisualizationData = async () => {
try {
const res = await axios.get(`${DOMAIN_API}/visualization-data/`);
setData(res.data);
} catch (err) {
console.error("Error fetching visualization data:", err);
}
};
fetchVisualizationData();
}, []);

const sourceData = useMemo(() => {
if (!data?.source_counts) return { labels: [], datasets: [] };
return {
labels: Object.keys(data.source_counts),
datasets: [{
label: "Number of Documents",
data: Object.values(data.source_counts),
backgroundColor: "rgba(54, 162, 235, 0.6)",
}],
};
}, [data]);

const tagData = useMemo(() => {
if (!data?.tags_by_source) return { labels: [], datasets: [] };


const sources = Object.keys(data.tags_by_source);  
const allTags = new Set();  
sources.forEach(src => Object.keys(data.tags_by_source[src]).forEach(tag => allTags.add(tag)));  
const tagsArray = Array.from(allTags);  

const datasets = tagsArray.map(tag => ({  
  label: tag,  
  data: sources.map(src => data.tags_by_source[src][tag] || 0),  
  backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,  
}));  

return { labels: sources, datasets };  


}, [data]);

const severityData = useMemo(() => {
if (!data?.severity_points) return { datasets: [] };
return {
datasets: [{
label: "Severity vs Probability",
data: data.severity_points.map(p => ({ x: p.probability, y: p.severity })),
backgroundColor: "rgba(255, 99, 132, 0.6)",
}],
};
}, [data]);

const wordCloudData = useMemo(() => {
if (!data?.word_freq) return [];
return data.word_freq.map(([text, value]) => ({ text, value }));
}, [data]);

const networkData = useMemo(() => {
if (!data?.network_nodes || !data?.network_edges) return { nodes: [], links: [] };
return {
nodes: data.network_nodes.map(n => ({ id: n.id, name: n.label })),
links: data.network_edges.map(e => ({ source: e.reg, target: e.tag })),
};
}, [data]);

if (!data) return <p>Loading...</p>;

return ( <div className="container"> <h3 className="text-primary mb-4">Visualizations</h3> <div className="row g-3">
    <div className="col-12 col-md-6">  
      <div className="card p-4 h-100">  
        <h5 className="mb-3">Source Distribution</h5>  
        {sourceData.labels.length ? (  
          <Bar data={sourceData} options={{ responsive: true, plugins: { legend: { display: false } } }} />  
        ) : <p className="text-muted">No data available</p>}  
      </div>  
    </div>  

    <div className="col-12 col-md-6">  
      <div className="card p-4 h-100">  
        <h5 className="mb-3">Tag Distribution</h5>  
        {tagData.labels.length ? (  
          <Bar  
            data={tagData}  
            options={{ responsive: true, plugins: { legend: { position: "bottom" } }, scales: { x: { stacked: true }, y: { stacked: true } } }}  
          />  
        ) : <p className="text-muted">No data available</p>}  
      </div>  
    </div>  

    <div className="col-12 col-md-6">  
      <div className="card p-4 h-100">  
        <h5 className="mb-3">Severity Points</h5>  
        {severityData.datasets.length ? (  
          <Scatter data={severityData} options={{ responsive: true }} />  
        ) : <p className="text-muted">No data available</p>}  
      </div>  
    </div>  

    <div className="col-12 col-md-6">  
      <div className="card p-4 h-100">  
        <h5 className="mb-3">Word Cloud</h5>  
        {wordCloudData.length ? (  
          <WordCloud data={wordCloudData} fontSizeMapper={d => Math.log2(d.value) * 5} width={400} height={300} />  
        ) : <p className="text-muted">No data available</p>}  
      </div>  
    </div>  

    <div className="col-12">  
      <div className="card p-4 h-100">  
        <h5 className="mb-3">Network Graph</h5>  
        {networkData.nodes.length ? (  
          <ForceGraph2D graphData={networkData} nodeLabel="name" width={800} height={400} nodeAutoColorBy="id" />  
        ) : <p className="text-muted">No data available</p>}  
      </div>  
    </div>  

  </div>  
</div>  

);
}
