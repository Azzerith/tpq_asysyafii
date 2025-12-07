import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Registrasi';
import Homepage from './pages/Homepage';
import SuperAdminDashboard from './pages/super-admin/SuperAdminDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import WaliDashboard from './pages/wali/WaliDashboard';
import DonasiPage from './pages/Donasi';
import BeritaList from './components/allBeritaPage';
import BeritaDetail from './components/BeritaDetail';

import WaliLayout from './components/layout/WaliLayout';
import KeuanganTPQ from './pages/wali/KeuanganTPQ';
import Keluarga from './pages/wali/Keluarga';
import Komentar from './pages/wali/Komentar';
import SemuaTagihanWali from './pages/wali/DetailTagihan';
import Profil from './pages/wali/Profil';

import UserManagement from './pages/super-admin/UserManagement';
import DataMaster from './pages/super-admin/DataMaster';
import BeritaManagement from './pages/super-admin/Berita';
import InformasiTPQ from './pages/super-admin/InformasiTPQ';
import ProgramUnggulanManagement from './pages/super-admin/ProgramUnggulan';
import SystemManagement from './pages/super-admin/System';
import DataSantri from './pages/super-admin/DataSantri';
import DataKeluargaWali from './pages/super-admin/DataKeluargaWali';
import FasilitasManagement from './pages/super-admin/Fasilitas';
import TestimoniManagement from './pages/super-admin/Testimoni';

import DataDonasi from './pages/admin/DataDonasi';
import DataKeuangan from './pages/admin/DataKeuangan';
import DataSyahriah from './pages/admin/DataSyahriah';
import ProgramPage from './components/allProgramPage';
import ProgramDetail from './components/ProgramDetail';

const AppContent = () => {
  const { user } = useAuth();

  const getDashboardByRole = () => {
    if (!user) return '/login';
    
    switch (user.role) {
      case 'super_admin':
        return '/super-admin';
      case 'admin':
        return '/admin';
      case 'wali':
        return '/wali';
      default:
        return '/login';
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/donasi" element={<DonasiPage />} />
      <Route path="/berita" element={<BeritaList />} />
      <Route path="/program" element={<ProgramPage />} />
      <Route path="/berita/:slug" element={<BeritaDetail />} />
      <Route path="/program/:slug" element={<ProgramDetail />} />
      
      {/* Super Admin Routes */}
      <Route 
        path="/super-admin/*" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/super-admin/users" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <UserManagement />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/super-admin/data-master" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <DataMaster />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/super-admin/berita" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <BeritaManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/super-admin/fasilitas" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <FasilitasManagement />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/super-admin/testimoni" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <TestimoniManagement />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/super-admin/informasi-tpq" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <InformasiTPQ />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/super-admin/program-unggulan" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <ProgramUnggulanManagement />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/super-admin/system" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SystemManagement />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/super-admin/santri" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <DataSantri />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/super-admin/keluarga-wali" 
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <DataKeluargaWali />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/donasi" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <DataDonasi />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/keuangan" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <DataKeuangan />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin/syahriah" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <DataSyahriah />
          </ProtectedRoute>
        } 
      />
      
      {/* Wali Routes dengan Layout */}
      <Route 
        path="/wali/*" 
        element={
          <ProtectedRoute allowedRoles={['wali', 'admin', 'super_admin']}>
            <WaliLayout />
          </ProtectedRoute>
        } 
      >
        <Route index element={<WaliDashboard />} />
        <Route path="keuangan" element={<KeuanganTPQ />} />
        <Route path="keluarga" element={<Keluarga />} />
        <Route path="profil" element={<Profil />} />
        <Route path="detail" element={<SemuaTagihanWali />} />
        <Route path="komentar" element={<Komentar />} />
      </Route>
      
      {/* Default redirect based on role */}
      <Route 
        path="/dashboard" 
        element={<Navigate to={getDashboardByRole()} replace />} 
      />
      
      {/* Catch all route - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;