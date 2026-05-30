import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import AddStudent from "./pages/AddStudent";
import Attendance from "./pages/Attendance";
import Marks from "./pages/Marks";
import Fees from "./pages/Fees";
import Timetable from "./pages/Timetable";
import Notifications from "./pages/Notifications";

// New modules
import Classes from "./pages/Classes";
import Teachers from "./pages/Teachers";
import AddTeacher from "./pages/AddTeacher";
import Reports from "./pages/Reports";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Classes */}
        <Route path="/classes" element={<Classes />} />
        
        {/* Teachers */}
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/add-teacher" element={<AddTeacher />} />
        
        {/* Students */}
        <Route path="/students" element={<Students />} />
        <Route path="/add-student" element={<AddStudent />} />
        
        {/* Academic modules */}
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/marks" element={<Marks />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;