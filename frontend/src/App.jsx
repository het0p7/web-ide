import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import IDEPage from "./pages/IDEPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import Loading from "./Loading";
import { AppData } from "./context/AppContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  const { isAuth, loading } = AppData();

  const hasLoggedOutFromStorage = localStorage.getItem("hasLoggedOut") === "true";
  if (loading && !hasLoggedOutFromStorage) return <Loading />;

  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* Protected Editor Routes */}
        <Route
          path="/dashboard"
          element={isAuth ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/create-project"
          element={isAuth ? <CreateProjectPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/ide/:projectId"
          element={isAuth ? <IDEPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={isAuth ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={isAuth ? <SettingsPage /> : <Navigate to="/login" />}
        />

        <Route path="*" element={<Navigate to={isAuth ? "/dashboard" : "/"} />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

export default App;
