import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import FamilyTree from "@/pages/FamilyTree";
import Activities from "@/pages/Activities";
import Chronicle from "@/pages/Chronicle";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/family-tree" element={<FamilyTree />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/chronicle" element={<Chronicle />} />
        </Route>
      </Routes>
    </Router>
  );
}
