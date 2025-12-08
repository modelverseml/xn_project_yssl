import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import NotificationButton from "./NotificationButton";
import { DOMAIN_API } from '../config';

export default function DetailPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    axios.get(`${DOMAIN_API}/detail/${id}/`)
      .then(res => setDoc(res.data))
      .catch(console.error);
  }, [id]);

  if (!doc) return <div>Loading...</div>;

  return (
    <div className="card shadow p-4">
      <h2 className="text-primary mb-3">{doc.source}</h2>
      <div className="mb-2">
        URL: <a href={doc.url} target="_blank" rel="noreferrer">{doc.url}</a>
      </div>
      <div className="mb-2">
        {doc.tags.map(tag => <span key={tag} className="badge bg-info me-1">{tag}</span>)}
      </div>
      <div className="mb-3 text-muted">Severity: {doc.severity} | Probability: {doc.probability}</div>
      <NotificationButton docId={doc.id} />
      <h4 className="mt-4 mb-2">Text Content</h4>
      <pre className="bg-light p-3 rounded overflow-auto" style={{ maxHeight: 400 }}>
        {doc.text}
      </pre>
    </div>
  );
}
