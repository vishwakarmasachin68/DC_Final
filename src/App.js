import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import ChallanForm from "./components/ChallanForm";
import DataView from "./components/DataView";
import ProjectForm from "./components/ProjectForm";
import "bootstrap/dist/css/bootstrap.min.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  const [savedChallans, setSavedChallans] = useState([]);

  return (
    <div className="App">
      <Navbar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<DataView challans={savedChallans} />} />
          <Route
            path="/GenerateChallan"
            element={
              <ChallanForm
                onSave={(newChallan) =>
                  setSavedChallans([...savedChallans, newChallan])
                }
              />
            }
          />
          <Route path="/Projects" element={<ProjectForm />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
export default App;
