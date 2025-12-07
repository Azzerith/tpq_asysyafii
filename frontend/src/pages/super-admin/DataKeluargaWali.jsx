import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const DataKeluargaWali = () => {
  const { user: currentUser } = useAuth();
  
  const [keluarga, setKeluarga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [kotaFilter, setKotaFilter] = useState('all');

  // State untuk modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedKeluarga, setSelectedKeluarga] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // State untuk alert
  const [alertMessage, setAlertMessage] = useState({
    title: '',
    message: '',
    type: 'success'
  });

  // State untuk form
  const [formData, setFormData] = useState({
    alamat: '',
    rt_rw: '',
    kelurahan: '',
    kecamatan: '',
    kota: '',
    provinsi: '',
    kode_pos: '',
    id_wali: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [waliOptions, setWaliOptions] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Function hasPermission
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
      return true;
    }
    
    const permissions = {
      admin: ['manage_keluarga', 'edit_keluarga', 'create_keluarga', 'delete_keluarga'],
      wali: ['view_keluarga', 'edit_own_keluarga', 'create_own_keluarga']
    };

    return permissions[currentUser.role]?.includes(permission) || false;
  };

  // Show alert modal
  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  // Fetch keluarga dari API
  const fetchKeluarga = async () => {
    try {
      setLoading(true);
      setError('');
      
      let endpoint;
      let method = 'GET';
      
      if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin') {
        endpoint = '/api/super-admin/keluarga';
      } else if (currentUser?.role === 'wali') {
        endpoint = '/api/keluarga/my';
      } else {
        setError('Anda tidak memiliki izin untuk mengakses data keluarga');
        setKeluarga([]);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      
      // Handle different response formats
      let keluargaData = [];
      if (Array.isArray(data.data)) {
        keluargaData = data.data;
      } else if (Array.isArray(data)) {
        keluargaData = data;
      } else if (data.data && typeof data.data === 'object') {
        // If single object, wrap in array
        keluargaData = [data.data];
      }
      
      const transformedKeluarga = keluargaData.map(k => ({
        id: k.id_keluarga,
        idWali: k.id_wali,
        alamat: k.alamat || '-',
        rtRw: k.rt_rw || '-',
        kelurahan: k.kelurahan || '-',
        kecamatan: k.kecamatan || '-',
        kota: k.kota || '-',
        provinsi: k.provinsi || '-',
        kodePos: k.kode_pos || '-',
        wali: k.wali ? {
          id: k.wali.id_user,
          nama: k.wali.nama_lengkap,
          email: k.wali.email,
          noTelp: k.wali.no_telp
        } : null,
        dibuatPada: k.dibuat_pada,
        diperbaruiPada: k.diperbarui_pada
      }));

      setKeluarga(transformedKeluarga);

    } catch (err) {
      console.error('Error fetching keluarga:', err);
      setError(`Gagal memuat data keluarga: ${err.message}`);
      setKeluarga([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch wali options untuk dropdown
  const fetchWaliOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/super-admin/wali`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWaliOptions(data);
      }
    } catch (err) {
      console.error('Error fetching wali options:', err);
    }
  };

  // Check if current user has permission to access this page
  useEffect(() => {
    if (!currentUser) return;

    if (!hasPermission('view_keluarga')) {
      setError('Anda tidak memiliki izin untuk mengakses halaman ini');
      return;
    }

    fetchKeluarga();
    
    // Hanya fetch wali options jika user adalah admin/super_admin
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
      fetchWaliOptions();
    }
  }, [currentUser]);

  // Modal handlers
  const openDeleteModal = (keluarga) => {
    setSelectedKeluarga(keluarga);
    setShowDeleteModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      alamat: '',
      rt_rw: '',
      kelurahan: '',
      kecamatan: '',
      kota: '',
      provinsi: '',
      kode_pos: '',
      id_wali: currentUser?.role === 'wali' ? currentUser.id_user : ''
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (keluarga) => {
    setSelectedKeluarga(keluarga);
    setFormData({
      alamat: keluarga.alamat,
      rt_rw: keluarga.rtRw,
      kelurahan: keluarga.kelurahan,
      kecamatan: keluarga.kecamatan,
      kota: keluarga.kota,
      provinsi: keluarga.provinsi,
      kode_pos: keluarga.kodePos,
      id_wali: keluarga.idWali
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openViewModal = (keluarga) => {
    setSelectedKeluarga(keluarga);
    setShowViewModal(true);
  };

  const closeModals = () => {
    setShowDeleteModal(false);
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowAlertModal(false);
    setSelectedKeluarga(null);
    setFormErrors({});
    setActionLoading(false);
  };

  // Handler untuk form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
  };

  // Validasi form
  const validateForm = () => {
    const errors = {};

    if (!formData.alamat.trim()) {
      errors.alamat = 'Alamat wajib diisi';
    }

    if (!formData.kota.trim()) {
      errors.kota = 'Kota wajib diisi';
    }

    if (!formData.provinsi.trim()) {
      errors.provinsi = 'Provinsi wajib diisi';
    }

    if (currentUser?.role !== 'wali' && !formData.id_wali) {
      errors.id_wali = 'Wali wajib dipilih';
    }

    return errors;
  };

  // Handler untuk create keluarga
  const handleCreateKeluarga = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);

      const endpoint = currentUser?.role === 'wali' 
        ? '/api/keluarga' 
        : '/api/super-admin/keluarga';

      const requestData = {
        alamat: formData.alamat,
        rt_rw: formData.rt_rw,
        kelurahan: formData.kelurahan,
        kecamatan: formData.kecamatan,
        kota: formData.kota,
        provinsi: formData.provinsi,
        kode_pos: formData.kode_pos
      };

      // Tambahkan id_wali hanya jika user bukan wali
      if (currentUser?.role !== 'wali') {
        requestData.id_wali = formData.id_wali;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const newKeluarga = await response.json();
      
      // Add new keluarga to the list
      const transformedKeluarga = {
        id: newKeluarga.data?.id_keluarga || newKeluarga.id_keluarga,
        idWali: newKeluarga.data?.id_wali || newKeluarga.id_wali,
        alamat: newKeluarga.data?.alamat || newKeluarga.alamat,
        rtRw: newKeluarga.data?.rt_rw || newKeluarga.rt_rw,
        kelurahan: newKeluarga.data?.kelurahan || newKeluarga.kelurahan,
        kecamatan: newKeluarga.data?.kecamatan || newKeluarga.kecamatan,
        kota: newKeluarga.data?.kota || newKeluarga.kota,
        provinsi: newKeluarga.data?.provinsi || newKeluarga.provinsi,
        kodePos: newKeluarga.data?.kode_pos || newKeluarga.kode_pos,
        wali: newKeluarga.data?.wali || newKeluarga.wali
      };

      setKeluarga(prev => [transformedKeluarga, ...prev]);
      closeModals();
      showAlert('Berhasil', 'Data keluarga berhasil dibuat', 'success');
      
    } catch (error) {
      console.error('Error creating keluarga:', error);
      showAlert('Gagal', `Gagal membuat data keluarga: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk edit keluarga
  const handleEditKeluarga = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);

      const updateData = {
        alamat: formData.alamat,
        rt_rw: formData.rt_rw,
        kelurahan: formData.kelurahan,
        kecamatan: formData.kecamatan,
        kota: formData.kota,
        provinsi: formData.provinsi,
        kode_pos: formData.kode_pos
      };

      // Gunakan endpoint yang sesuai
      let endpoint;
      if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin') {
        endpoint = `/api/super-admin/keluarga/${selectedKeluarga.id}`;
      } else {
        endpoint = `/api/keluarga/${selectedKeluarga.id}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const updatedKeluarga = await response.json();

      // Update keluarga in the list
      setKeluarga(keluarga.map(item => 
        item.id === selectedKeluarga.id 
          ? { 
              ...item,
              alamat: updatedKeluarga.data?.alamat || updatedKeluarga.alamat || formData.alamat,
              rtRw: updatedKeluarga.data?.rt_rw || updatedKeluarga.rt_rw || formData.rt_rw,
              kelurahan: updatedKeluarga.data?.kelurahan || updatedKeluarga.kelurahan || formData.kelurahan,
              kecamatan: updatedKeluarga.data?.kecamatan || updatedKeluarga.kecamatan || formData.kecamatan,
              kota: updatedKeluarga.data?.kota || updatedKeluarga.kota || formData.kota,
              provinsi: updatedKeluarga.data?.provinsi || updatedKeluarga.provinsi || formData.provinsi,
              kodePos: updatedKeluarga.data?.kode_pos || updatedKeluarga.kode_pos || formData.kode_pos
            }
          : item
      ));
      
      closeModals();
      showAlert('Berhasil', 'Data keluarga berhasil diupdate', 'success');
      
    } catch (error) {
      console.error('Error updating keluarga:', error);
      showAlert('Gagal', `Gagal mengupdate data keluarga: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk menghapus keluarga
  const handleDeleteKeluarga = async () => {
    if (!selectedKeluarga) return;

    try {
      setActionLoading(true);
      
      if (!hasPermission('delete_keluarga')) {
        throw new Error('Anda tidak memiliki izin untuk menghapus data keluarga');
      }

      const response = await fetch(`${API_URL}/api/super-admin/keluarga/${selectedKeluarga.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      setKeluarga(keluarga.filter(item => item.id !== selectedKeluarga.id));
      closeModals();
      showAlert('Berhasil', 'Data keluarga berhasil dihapus', 'success');
      
    } catch (error) {
      console.error('Error deleting keluarga:', error);
      showAlert('Gagal', `Gagal menghapus data keluarga: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Filter keluarga
  const filteredKeluarga = keluarga.filter(item => {
    const matchesSearch = 
      item.alamat.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.wali?.nama && item.wali.nama.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.kota && item.kota.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.provinsi && item.provinsi.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesKota = kotaFilter === 'all' || item.kota === kotaFilter;
    
    return matchesSearch && matchesKota;
  });

  // Get unique kota options for filter
  const kotaOptions = ['all', ...new Set(keluarga.map(item => item.kota).filter(Boolean))];

  if (loading) {
    return (
      <AuthDashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </AuthDashboardLayout>
    );
  }

  if (error && !hasPermission('view_keluarga')) {
    return (
      <AuthDashboardLayout title="Data Keluarga Wali">
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Akses Ditolak</h3>
            <p className="text-red-600 mb-6">{error}</p>
          </div>
        </div>
      </AuthDashboardLayout>
    );
  }

  return (
    <AuthDashboardLayout title="Data Keluarga Wali">
      <div className="p-6">  
        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Keluarga</p>
                <p className="text-2xl font-bold text-gray-800">{keluarga.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dengan Alamat Lengkap</p>
                <p className="text-2xl font-bold text-gray-800">
                  {keluarga.filter(item => 
                    item.alamat && item.rtRw && item.kelurahan && item.kecamatan && item.kota && item.provinsi && item.kodePos
                  ).length}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Kota Berbeda</p>
                <p className="text-2xl font-bold text-gray-800">
                  {new Set(keluarga.map(item => item.kota).filter(Boolean)).size}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Update Terakhir</p>
                <p className="text-lg font-bold text-gray-800">
                  {keluarga.length > 0 
                    ? formatDate(keluarga[0].diperbaruiPada).split(',')[0]
                    : '-'
                  }
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter dan Search Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-2">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Cari berdasarkan alamat, kota, provinsi, atau nama wali..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={kotaFilter}
              onChange={(e) => setKotaFilter(e.target.value)}
            >
              <option value="all">Semua Kota</option>
              {kotaOptions
                .filter(kota => kota !== 'all' && kota)
                .map(kota => (
                  <option key={kota} value={kota}>{kota}</option>
                ))
              }
            </select>
            <div className="md:col-span-2 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              {hasPermission('create_keluarga') && (
                <button 
                  onClick={openCreateModal}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Data Keluarga
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Keluarga */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Daftar Data Keluarga Wali
              </h2>
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {filteredKeluarga.length} Data
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wali
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alamat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RT/RW
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kelurahan/Kecamatan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kota/Provinsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKeluarga.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <p className="mt-2">Tidak ada data keluarga wali</p>
                    </td>
                  </tr>
                ) : (
                  filteredKeluarga.map((keluarga) => (
                    <KeluargaTableRow 
                      key={keluarga.id} 
                      keluarga={keluarga} 
                      onEdit={openEditModal}
                      onView={openViewModal}
                      onDelete={openDeleteModal}
                      hasPermission={hasPermission}
                      currentUser={currentUser}
                      formatDate={formatDate}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Link ke halaman lain */}
        <div className="mt-6 flex gap-4">
          <Link 
            to="/dashboard" 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Dashboard
          </Link>
        </div>

        {/* CREATE MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Data Keluarga Baru</h3>
              <form onSubmit={handleCreateKeluarga}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {currentUser?.role !== 'wali' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Wali *
                      </label>
                      <select
                        name="id_wali"
                        value={formData.id_wali}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          formErrors.id_wali ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      >
                        <option value="">Pilih Wali</option>
                        {waliOptions.map(wali => (
                          <option key={wali.id_user} value={wali.id_user}>
                            {wali.nama_lengkap} - {wali.email}
                          </option>
                        ))}
                      </select>
                      {formErrors.id_wali && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.id_wali}</p>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat Lengkap *
                    </label>
                    <textarea
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      rows="3"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.alamat ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan alamat lengkap"
                      required
                    />
                    {formErrors.alamat && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.alamat}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RT/RW
                    </label>
                    <input
                      type="text"
                      name="rt_rw"
                      value={formData.rt_rw}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Contoh: 001/002"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kelurahan
                    </label>
                    <input
                      type="text"
                      name="kelurahan"
                      value={formData.kelurahan}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan kelurahan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kecamatan
                    </label>
                    <input
                      type="text"
                      name="kecamatan"
                      value={formData.kecamatan}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan kecamatan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kota *
                    </label>
                    <input
                      type="text"
                      name="kota"
                      value={formData.kota}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.kota ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan kota"
                      required
                    />
                    {formErrors.kota && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.kota}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provinsi *
                    </label>
                    <input
                      type="text"
                      name="provinsi"
                      value={formData.provinsi}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.provinsi ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan provinsi"
                      required
                    />
                    {formErrors.provinsi && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.provinsi}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      name="kode_pos"
                      value={formData.kode_pos}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan kode pos"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Membuat...' : 'Buat Data Keluarga'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {showEditModal && selectedKeluarga && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Data Keluarga</h3>
              <form onSubmit={handleEditKeluarga}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat Lengkap *
                    </label>
                    <textarea
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      rows="3"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.alamat ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan alamat lengkap"
                      required
                    />
                    {formErrors.alamat && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.alamat}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RT/RW
                    </label>
                    <input
                      type="text"
                      name="rt_rw"
                      value={formData.rt_rw}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Contoh: 001/002"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kelurahan
                    </label>
                    <input
                      type="text"
                      name="kelurahan"
                      value={formData.kelurahan}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan kelurahan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kecamatan
                    </label>
                    <input
                      type="text"
                      name="kecamatan"
                      value={formData.kecamatan}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan kecamatan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kota *
                    </label>
                    <input
                      type="text"
                      name="kota"
                      value={formData.kota}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.kota ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan kota"
                      required
                    />
                    {formErrors.kota && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.kota}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provinsi *
                    </label>
                    <input
                      type="text"
                      name="provinsi"
                      value={formData.provinsi}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.provinsi ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan provinsi"
                      required
                    />
                    {formErrors.provinsi && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.provinsi}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      name="kode_pos"
                      value={formData.kode_pos}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan kode pos"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {showDeleteModal && selectedKeluarga && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Data Keluarga</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus data keluarga untuk wali <strong>"{selectedKeluarga.wali?.nama || 'Tidak diketahui'}"</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteKeluarga}
                  disabled={actionLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {showViewModal && selectedKeluarga && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Detail Keluarga</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedKeluarga.wali && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Informasi Wali</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Nama Wali:</span>
                      <span className="text-sm font-medium text-gray-900">{selectedKeluarga.wali.nama}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm text-gray-900">{selectedKeluarga.wali.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Telepon:</span>
                      <span className="text-sm text-gray-900">{selectedKeluarga.wali.noTelp || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Alamat</span>
                  <span className="text-sm text-gray-900 text-right">{selectedKeluarga.alamat}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">RT/RW</span>
                  <span className="text-sm text-gray-900">{selectedKeluarga.rtRw}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Kelurahan</span>
                  <span className="text-sm text-gray-900">{selectedKeluarga.kelurahan}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Kecamatan</span>
                  <span className="text-sm text-gray-900">{selectedKeluarga.kecamatan}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Kota</span>
                  <span className="text-sm text-gray-900">{selectedKeluarga.kota}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Provinsi</span>
                  <span className="text-sm text-gray-900">{selectedKeluarga.provinsi}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Kode Pos</span>
                  <span className="text-sm text-gray-900">{selectedKeluarga.kodePos}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Dibuat Pada</span>
                  <span className="text-sm text-gray-900">{formatDate(selectedKeluarga.dibuatPada)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-500">Diperbarui Pada</span>
                  <span className="text-sm text-gray-900">{formatDate(selectedKeluarga.diperbaruiPada)}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ALERT MODAL */}
        {showAlertModal && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                alertMessage.type === 'success' ? 'bg-green-100' : 
                alertMessage.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {alertMessage.type === 'success' ? (
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : alertMessage.type === 'error' ? (
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h3 className={`text-xl font-bold text-center mb-2 ${
                alertMessage.type === 'success' ? 'text-green-800' : 
                alertMessage.type === 'error' ? 'text-red-800' : 'text-blue-800'
              }`}>
                {alertMessage.title}
              </h3>
              <p className={`text-center mb-6 ${
                alertMessage.type === 'success' ? 'text-green-600' : 
                alertMessage.type === 'error' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {alertMessage.message}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAlertModal(false)}
                  className={`px-6 py-2 rounded-lg text-white ${
                    alertMessage.type === 'success' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : alertMessage.type === 'error'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } transition-colors`}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthDashboardLayout>
  );
};

// Komponen terpisah untuk table row keluarga
const KeluargaTableRow = React.memo(({ keluarga, onEdit, onView, onDelete, hasPermission, currentUser, formatDate }) => {
  
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        {keluarga.wali ? (
          <div>
            <div className="text-sm font-medium text-gray-900">{keluarga.wali.nama}</div>
            <div className="text-xs text-gray-500">{keluarga.wali.email}</div>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Wali tidak tersedia</span>
        )}
      </td>
      <td className="px-6 py-4">
        <button 
          onClick={() => onView(keluarga)}
          className="text-sm text-gray-900 hover:text-blue-600 transition-colors text-left"
        >
          {keluarga.alamat}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {keluarga.rtRw}
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{keluarga.kelurahan}</div>
        <div className="text-xs text-gray-500">{keluarga.kecamatan}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{keluarga.kota}</div>
        <div className="text-xs text-gray-500">{keluarga.provinsi}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onEdit(keluarga)}
            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit Data Keluarga"
            disabled={!hasPermission('edit_keluarga')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          {hasPermission('delete_keluarga') && currentUser?.role === 'super_admin' && (
            <button 
              onClick={() => onDelete(keluarga)}
              className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors"
              title="Hapus Data Keluarga"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

export default DataKeluargaWali;