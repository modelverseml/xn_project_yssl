import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import FetchForm from "./components/FetchForm";
import ListPage from "./components/ListPage";
import DetailPage from "./components/DetailPage";
import VisualizationPage from "./components/VisualizationPage";
import axios from "axios";
import { DOMAIN_API } from "./config";

export default function App() {
  const [documents, setDocuments] = useState([]);

  // Fetch all RemoteDocuments for ListPage and DetailPage
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get(`${DOMAIN_API}/list/`); // Use Django list endpoint
        setDocuments(res.data);
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };
    fetchDocuments();
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Header */}
      <header className="bg-primary text-white shadow-sm py-3 mb-4">
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-center">
          <h1 className="h4 mb-2 mb-md-0">Regulations NLP Dashboard</h1>
          <nav>
            <ul className="nav nav-pills">
              <li className="nav-item">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    "nav-link " + (isActive ? "active bg-white text-primary" : "text-white")
                  }
                >
                  Fetch URL
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/list"
                  className={({ isActive }) =>
                    "nav-link " + (isActive ? "active bg-white text-primary" : "text-white")
                  }
                >
                  List
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  to="/visualizations"
                  className={({ isActive }) =>
                    "nav-link " + (isActive ? "active bg-white text-primary" : "text-white")
                  }
                >
                  Visualizations
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow-1">
        <Routes>
          <Route path="/" element={<FetchForm />} />
          <Route path="/list" element={<ListPage data={documents} />} />
          <Route path="/detail/:id" element={<DetailPage data={documents} />} />
          <Route path="/visualizations" element={<VisualizationPage />} />
        </Routes>
      </main>

    </div>
  );
}
