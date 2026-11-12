import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ItemDetail from './pages/ItemDetail';

// Renter Pages
import MyRentals from './pages/MyRentals';
import MyDeposits from './pages/MyDeposits';

// Owner Pages
import OwnerDashboard from './pages/OwnerDashboard';
import CreateItem from './pages/CreateItem';

// Admin & Dispute Pages
import AdminDashboard from './pages/AdminDashboard';
import RaiseDispute from './pages/RaiseDispute';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="flex flex-col min-h-screen bg-gray-50/50">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
            <Routes>
              {/* ── Public Routes ── */}
              <Route path="/" element={<Home />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ── Authenticated Renter Routes ── */}
              <Route
                path="/my-rentals"
                element={
                  <ProtectedRoute>
                    <MyRentals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-deposits"
                element={
                  <ProtectedRoute>
                    <MyDeposits />
                  </ProtectedRoute>
                }
              />

              {/* ── Owner Routes ── */}
              <Route
                path="/owner/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/owner/create-item"
                element={
                  <ProtectedRoute allowedRoles={['owner', 'admin']}>
                    <CreateItem />
                  </ProtectedRoute>
                }
              />
              {/* ── Dispute Route (Any authenticated party) ── */}
              <Route
                path="/disputes/raise"
                element={
                  <ProtectedRoute>
                    <RaiseDispute />
                  </ProtectedRoute>
                }
              />

              {/* ── Admin Route (Admin Only) ── */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ── Catch-All 404 Route ── */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;

