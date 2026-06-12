import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Auditor from "@/pages/Auditor";
import Schema from "@/pages/Schema";
import Locations from "@/pages/Locations";
import Meta from "@/pages/Meta";
import Keywords from "@/pages/Keywords";
import Tasks from "@/pages/Tasks";
import Compare from "@/pages/Compare";
import { Toaster } from "sonner";
import "@/App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="auditor" element={<Auditor />} />
            <Route path="schema" element={<Schema />} />
            <Route path="locations" element={<Locations />} />
            <Route path="meta" element={<Meta />} />
            <Route path="keywords" element={<Keywords />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="compare" element={<Compare />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#18181b",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fafafa",
          },
        }}
      />
    </div>
  );
}

export default App;
