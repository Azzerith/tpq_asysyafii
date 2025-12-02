import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const ProgramUnggulanManagement = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // State untuk modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAktifModal, setShowAktifModal] = useState(false);
  const [showNonaktifModal, setShowNonaktifModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [previewProgram, setPreviewProgram] = useState(null);
  
  // State untuk form
  const [formData, setFormData] = useState({
    nama_program: '',
    deskripsi: '',
    fitur: '',
    status: 'aktif'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Function hasPermission lokal
  const hasPermission = () => {
    if (!currentUser) return false;
    return currentUser.role === 'super_admin';
  };

  // Fetch program unggulan dari API
  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = '/api/super-admin/program-unggulan/all';
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      
      // Transform data dari API ke format yang diinginkan
      const transformedPrograms = data.data.map(item => ({
        id: item.id_program,
        nama_program: item.nama_program,
        slug: item.slug,
        deskripsi: item.deskripsi,
        fitur: item.fitur,
        status: item.status,
        diupdate_oleh: item.diupdate_oleh?.nama_lengkap || 'Admin',
        dibuat_pada: item.dibuat_pada,
        diperbarui_pada: item.diperbarui_pada
      }));
      
      setPrograms(transformedPrograms);

    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(`Gagal memuat data program unggulan: ${err.message}`);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user has permission to access this page
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!hasPermission()) {
      navigate('/unauthorized');
      return;
    }

    fetchPrograms();
  }, [currentUser, navigate]);

  // Show alert modal
  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      nama_program: '',
      deskripsi: '',
      fitur: '',
      status: 'aktif'
    });
  };

  // Modal handlers
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (program) => {
    setSelectedProgram(program);
  
    let fiturText = '';
    if (program.fitur) {
      try {
        const fiturArray = typeof program.fitur === 'string' 
          ? JSON.parse(program.fitur) 
          : program.fitur;
        
        if (Array.isArray(fiturArray)) {
          fiturText = fiturArray.join('\n');
        }
      } catch (error) {
        console.error('Error parsing fitur:', error);
        fiturText = program.fitur;
      }
    }
  
    setFormData({
      nama_program: program.nama_program,
      deskripsi: program.deskripsi,
      fitur: fiturText,
      status: program.status
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (program) => {
    setSelectedProgram(program);
    setShowDeleteModal(true);
  };

  const openAktifModal = (program) => {
    setSelectedProgram(program);
    setShowAktifModal(true);
  };

  const openNonaktifModal = (program) => {
    setSelectedProgram(program);
    setShowNonaktifModal(true);
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const fiturArray = formData.fitur.split('\n').filter(item => item.trim() !== '');
      const fiturJSON = JSON.stringify(fiturArray);
  
      const formDataToSend = new FormData();
      formDataToSend.append('nama_program', formData.nama_program);
      formDataToSend.append('deskripsi', formData.deskripsi);
      formDataToSend.append('fitur', fiturJSON);
      formDataToSend.append('status', formData.status);
  
      const response = await fetch(`${API_URL}/api/super-admin/program-unggulan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
  
      await fetchPrograms();
      setShowCreateModal(false);
      resetForm();
      showAlert('Berhasil', 'Program unggulan berhasil dibuat', 'success');
    } catch (error) {
      console.error('Error creating program:', error);
      showAlert('Gagal', error.message || 'Gagal membuat program unggulan', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateProgram = async (e) => {
    e.preventDefault();
    if (!selectedProgram) return;
  
    try {
      setLoading(true);
  
      // Format fitur menjadi JSON string
      const fiturArray = formData.fitur.split('\n').filter(item => item.trim() !== '');
      const fiturJSON = JSON.stringify(fiturArray);
  
      // Gunakan FormData seperti di controller backend
      const formDataToSend = new FormData();
      formDataToSend.append('nama_program', formData.nama_program);
      formDataToSend.append('deskripsi', formData.deskripsi);
      formDataToSend.append('fitur', fiturJSON);
      formDataToSend.append('status', formData.status);
  
      const response = await fetch(`${API_URL}/api/super-admin/program-unggulan/${selectedProgram.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataToSend
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
  
      await fetchPrograms();
      setShowEditModal(false);
      resetForm();
      setSelectedProgram(null);
      showAlert('Berhasil', 'Program unggulan berhasil diupdate', 'success');
    } catch (error) {
      console.error('Error updating program:', error);
      showAlert('Gagal', error.message || 'Gagal mengupdate program unggulan', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk menghapus program
  const handleDeleteProgram = async () => {
    if (!selectedProgram) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/program-unggulan/${selectedProgram.id}`, {
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

      setPrograms(programs.filter(item => item.id !== selectedProgram.id));
      setShowDeleteModal(false);
      setSelectedProgram(null);
      showAlert('Berhasil', 'Program unggulan berhasil dihapus', 'success');
    } catch (error) {
      console.error('Error deleting program:', error);
      showAlert('Gagal', error.message || 'Gagal menghapus program unggulan', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk mengaktifkan program
  const handleAktifkanProgram = async () => {
    if (!selectedProgram) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/program-unggulan/${selectedProgram.id}/aktif`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      // Update status program di state
      setPrograms(programs.map(item => 
        item.id === selectedProgram.id 
          ? { ...item, status: 'aktif' }
          : item
      ));
      
      setShowAktifModal(false);
      setSelectedProgram(null);
      showAlert('Berhasil', 'Program unggulan berhasil diaktifkan', 'success');
    } catch (error) {
      console.error('Error activating program:', error);
      showAlert('Gagal', error.message || 'Gagal mengaktifkan program unggulan', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk menonaktifkan program
  const handleNonaktifkanProgram = async () => {
    if (!selectedProgram) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/program-unggulan/${selectedProgram.id}/nonaktif`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      // Update status program di state
      setPrograms(programs.map(item => 
        item.id === selectedProgram.id 
          ? { ...item, status: 'nonaktif' }
          : item
      ));
      
      setShowNonaktifModal(false);
      setSelectedProgram(null);
      showAlert('Berhasil', 'Program unggulan berhasil dinonaktifkan', 'success');
    } catch (error) {
      console.error('Error deactivating program:', error);
      showAlert('Gagal', error.message || 'Gagal menonaktifkan program unggulan', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk preview program
  const handlePreviewProgram = (program) => {
    setPreviewProgram(program);
    setShowPreviewModal(true);
  };

  // Filter program
  const filteredPrograms = programs.filter(item => {
    const matchesSearch = item.nama_program.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Statistik
  const getStats = () => {
    const totalPrograms = programs.length;
    const aktifPrograms = programs.filter(item => item.status === 'aktif').length;
    const nonaktifPrograms = programs.filter(item => item.status === 'nonaktif').length;
    
    return { totalPrograms, aktifPrograms, nonaktifPrograms };
  };

  const stats = getStats();

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format status
  const formatStatus = (status) => {
    const statusMap = {
      'aktif': 'Aktif',
      'nonaktif': 'Nonaktif'
    };
    return statusMap[status] || status;
  };

  // Parse fitur untuk display
  const parseFitur = (fitur) => {
    if (!fitur) return [];
    
    try {
      if (typeof fitur === 'string') {
        const parsed = JSON.parse(fitur);
        return Array.isArray(parsed) ? parsed : [];
      }
      return Array.isArray(fitur) ? fitur : [];
    } catch (error) {
      return [];
    }
  };

  // Icons
  const icons = {
    plus: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    edit: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    delete: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    preview: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    activate: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    deactivate: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  };

  if (loading && programs.length === 0) {
    return (
      <AuthDashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
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

  if (error && programs.length === 0) {
    return (
      <AuthDashboardLayout>
        <div className="p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={fetchPrograms}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </AuthDashboardLayout>
    );
  }

  return (
    <AuthDashboardLayout title="Program Unggulan">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Program Unggulan</h1>
            <p className="text-gray-600 mt-1">Kelola program unggulan TPQ</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            {icons.plus}
            Tambah Program
          </button>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800">Total Program</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalPrograms}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800">Aktif</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.aktifPrograms}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500">
            <h3 className="text-lg font-semibold text-gray-800">Nonaktif</h3>
            <p className="text-3xl font-bold text-gray-600">{stats.nonaktifPrograms}</p>
          </div>
        </div>

        {/* Filter dan Search Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Cari berdasarkan nama program atau deskripsi..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Tabel Program */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Program
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fitur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diupdate Oleh
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPrograms.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2">Tidak ada data program unggulan</p>
                      {searchTerm || statusFilter !== 'all' ? (
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Reset filter
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  filteredPrograms.map((item) => {
                    const fiturList = parseFitur(item.fitur);
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs">
                            {item.nama_program}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Slug: {item.slug}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs line-clamp-2">
                            {item.deskripsi}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs">
                            {fiturList.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1">
                                {fiturList.slice(0, 2).map((fitur, idx) => (
                                  <li key={idx} className="text-xs">{fitur}</li>
                                ))}
                                {fiturList.length > 2 && (
                                  <li className="text-xs text-blue-600">+{fiturList.length - 2} fitur lainnya</li>
                                )}
                              </ul>
                            ) : (
                              <span className="text-xs text-gray-400">Tidak ada fitur</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{item.diupdate_oleh}</div>
                          <div className="text-xs text-gray-400">{formatDate(item.diperbarui_pada)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'aktif' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {formatStatus(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => openEditModal(item)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors"
                              title="Edit Program"
                            >
                              {icons.edit}
                              Edit
                            </button>
                            <button 
                                onClick={() => handlePreviewProgram(item)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1 transition-colors"
                                title="Preview Program"
                              >
                                {icons.preview}
                                Preview
                              </button>
                            {item.status === 'nonaktif' ? (
                              <button 
                                onClick={() => openAktifModal(item)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1 transition-colors"
                                title="Aktifkan Program"
                              >
                                {icons.activate}
                                Aktifkan
                              </button>
                            ) : (
                              <button 
                                onClick={() => openNonaktifModal(item)}
                                className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1 transition-colors"
                                title="Nonaktifkan Program"
                              >
                                {icons.deactivate}
                                Nonaktifkan
                              </button>
                            )}
                            <button 
                              onClick={() => openDeleteModal(item)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors"
                              title="Hapus Program"
                            >
                              {icons.delete}
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
              <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Program Unggulan Baru</h3>
              <form onSubmit={handleCreateProgram}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Program
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama_program}
                      onChange={(e) => setFormData({...formData, nama_program: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan nama program"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      required
                      value={formData.deskripsi}
                      onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan deskripsi program"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fitur Program (satu fitur per baris)
                    </label>
                    <textarea
                      value={formData.fitur}
                      onChange={(e) => setFormData({...formData, fitur: e.target.value})}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan fitur program, satu fitur per baris&#10;Contoh:&#10;Target 1-5 Juz&#10;Metode Mutqin&#10;Usia 5-15 Tahun"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tulis setiap fitur pada baris terpisah. Fitur akan disimpan sebagai daftar.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* PREVIEW MODAL PROGRAM */}
{showPreviewModal && previewProgram && (
  <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-75 flex items-center justify-center p-4 z-[100] overflow-y-auto">
    <div className="bg-white rounded-xl w-full max-w-4xl my-8 animate-fadeIn">
      {/* Modal Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-800">Preview Program Unggulan</h3>
        <button
          onClick={() => {
            setShowPreviewModal(false);
            setPreviewProgram(null);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Modal Content */}
      <div className="max-h-[80vh] overflow-y-auto p-0">
        <article className="bg-white rounded-xl overflow-hidden">
          
          {/* Header */}
          <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  previewProgram.status === 'aktif' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {formatStatus(previewProgram.status)}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {previewProgram.nama_program}
            </h1>
            <div className="text-gray-600">
              <div className="flex items-center space-x-2 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Update: {formatDate(previewProgram.diperbarui_pada)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm">Oleh: {previewProgram.diupdate_oleh}</span>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="p-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Deskripsi Program</h2>
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-lg">
              {previewProgram.deskripsi?.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Fitur Program */}
          {(() => {
            const fiturList = parseFitur(previewProgram.fitur);
            if (fiturList.length > 0) {
              return (
                <div className="p-8 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Fitur Program</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fiturList.map((fitur, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{fitur}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Detail Info */}
          <div className="p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Informasi Detail</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Informasi Publikasi</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status Program</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      previewProgram.status === 'aktif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formatStatus(previewProgram.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Jumlah Fitur</span>
                    <span className="text-sm font-medium text-blue-600">
                      {parseFitur(previewProgram.fitur).length} fitur
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">URL Slug</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                      {previewProgram.slug}
                    </code>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Informasi Sistem</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Dibuat Pada</span>
                    <span className="text-sm text-gray-800">
                      {formatDate(previewProgram.dibuat_pada)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Terakhir Update</span>
                    <span className="text-sm text-gray-800">
                      {formatDate(previewProgram.diperbarui_pada)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Diupdate Oleh</span>
                    <span className="text-sm font-medium text-gray-800">
                      {previewProgram.diupdate_oleh}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Modal Footer  */}
      <div className="border-t border-gray-200 bg-gray-50">
        {/* Modal Footer */}
        <div className="flex justify-between items-center p-6">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Catatan:</span> Ini adalah preview tampilan program.
            {previewProgram.status === 'aktif' ? (
              <span className="ml-1 text-green-600">Program aktif dan dapat dilihat publik.</span>
            ) : (
              <span className="ml-1 text-red-600">Program nonaktif dan tidak ditampilkan ke publik.</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowPreviewModal(false);
                setPreviewProgram(null);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Tutup Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

        {/* EDIT MODAL */}
        {showEditModal && selectedProgram && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Program Unggulan</h3>
              <form onSubmit={handleUpdateProgram}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Program
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama_program}
                      onChange={(e) => setFormData({...formData, nama_program: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan nama program"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deskripsi
                    </label>
                    <textarea
                      required
                      value={formData.deskripsi}
                      onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan deskripsi program"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fitur Program (satu fitur per baris)
                    </label>
                    <textarea
                      value={formData.fitur}
                      onChange={(e) => setFormData({...formData, fitur: e.target.value})}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan fitur program, satu fitur per baris"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tulis setiap fitur pada baris terpisah.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Nonaktif</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {showDeleteModal && selectedProgram && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Program Unggulan</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus program <strong>"{selectedProgram.nama_program}"</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteProgram}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AKTIF MODAL */}
        {showAktifModal && selectedProgram && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Aktifkan Program</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin mengaktifkan program <strong>"{selectedProgram.nama_program}"</strong>?
                Program akan ditampilkan ke publik.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAktifModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAktifkanProgram}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Aktifkan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NONAKTIF MODAL */}
        {showNonaktifModal && selectedProgram && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Nonaktifkan Program</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menonaktifkan program <strong>"{selectedProgram.nama_program}"</strong>?
                Program tidak akan ditampilkan ke publik.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNonaktifModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleNonaktifkanProgram}
                  disabled={loading}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Nonaktifkan'}
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

export default ProgramUnggulanManagement;