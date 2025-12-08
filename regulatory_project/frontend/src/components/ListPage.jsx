import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { DOMAIN_API } from '../config';

export default function ListPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    axios.get(`${DOMAIN_API}/list/?page=1&page_size=50`)
      .then(res => setItems(res.data.items))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-primary">Documents List</h2>
      <div className="row g-3">
        {items.map(it => (
          <div className="col-md-6" key={it.id}>
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h5 className="card-title">{it.source}</h5>
                <p className="card-text">{it.snippet}...</p>
                <div className="mb-2">
                  {it.tags.map(tag => (
                    <span key={tag} className="badge bg-info me-1">{tag}</span>
                  ))}
                </div>
                <div className="text-muted mb-2">Severity: {it.severity} | Probability: {it.probability}</div>
                <Link to={`/detail/${it.id}`} className="btn btn-outline-primary btn-sm">View Details</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
