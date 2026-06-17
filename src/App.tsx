import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ConcertDetail from '@/pages/ConcertDetail';
import CreatePost from '@/pages/CreatePost';
import PostDetail from '@/pages/PostDetail';
import Messages from '@/pages/Messages';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile';
import RateUser from '@/pages/RateUser';
import IdentityVerification from '@/pages/IdentityVerification';
import TicketVerification from '@/pages/TicketVerification';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <div className="min-h-screen bg-neon-dark">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/concert/:id" element={<ConcertDetail />} />
          <Route path="/concert/:concertId/post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/messages/:partnerId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/rate/:userId" element={<ProtectedRoute><RateUser /></ProtectedRoute>} />
          <Route path="/verification/identity" element={<ProtectedRoute><IdentityVerification /></ProtectedRoute>} />
          <Route path="/verification/ticket" element={<ProtectedRoute><TicketVerification /></ProtectedRoute>} />
          <Route path="/verification/ticket/:concertId" element={<ProtectedRoute><TicketVerification /></ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}
