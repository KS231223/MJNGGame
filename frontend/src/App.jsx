import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Homepage";
import Table from "./pages/Tablepage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/table/:tableId" element={<Table />} />
      </Routes>
    </Router>
  );
}
