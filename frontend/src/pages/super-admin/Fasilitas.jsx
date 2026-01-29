import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const FasilitasManagement = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [fasilitas, setFasilitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showIconDropdown, setShowIconDropdown] = useState(false);

  // State untuk modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAktifModal, setShowAktifModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showNonaktifModal, setShowNonaktifModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  const [selectedFasilitas, setSelectedFasilitas] = useState(null);
  const [previewFasilitas, setPreviewFasilitas] = useState(null);
  
  // State untuk form
  const [formData, setFormData] = useState({
    icon: '',
    judul: '',
    deskripsi: '',
    urutan_tampil: 0,
    status: 'aktif'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Daftar icon yang tersedia
  const availableIcons = [
    { 
      name: 'users', 
      label: 'Users',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    { 
      name: 'book-open', 
      label: 'Book Open',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    { 
      name: 'shield-check', 
      label: 'Shield Check',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    { 
      name: 'graduation-cap', 
      label: 'Graduation Cap',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      )
    },
    { 
      name: 'star', 
      label: 'Star',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    { 
      name: 'award', 
      label: 'Award',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'clock', 
      label: 'Clock',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'check-circle', 
      label: 'Check Circle',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      name: 'academic-cap', 
      label: 'Academic Cap',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      )
    },
    { 
      name: 'bookmark', 
      label: 'Bookmark',
      svg: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      )
    }
  ];

  // Function hasPermission lokal
  const hasPermission = () => {
    if (!currentUser) return false;
    return currentUser.role === 'super_admin';
  };

  // Fetch fasilitas dari API
  const fetchFasilitas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = '/api/super-admin/fasilitas/all';
      
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
      const transformedFasilitas = data.data.map(item => ({
        id: item.id_fasilitas,
        icon: item.icon,
        judul: item.judul,
        slug: item.slug,
        deskripsi: item.deskripsi,
        urutan_tampil: item.urutan_tampil,
        status: item.status,
        diupdate_oleh: item.diupdate_oleh?.nama_lengkap || 'Admin',
        dibuat_pada: item.dibuat_pada,
        diperbarui_pada: item.diperbarui_pada
      }));
      
      setFasilitas(transformedFasilitas);

    } catch (err) {
      console.error('Error fetching fasilitas:', err);
      setError(`Gagal memuat data fasilitas: ${err.message}`);
      setFasilitas([]);
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

    fetchFasilitas();
  }, [currentUser, navigate]);

  // Show alert modal
  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      icon: '',
      judul: '',
      deskripsi: '',
      urutan_tampil: 0,
      status: 'aktif'
    });
    setShowIconDropdown(false);
  };

  // Modal handlers
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (fasilitas) => {
    setSelectedFasilitas(fasilitas);
    setFormData({
      icon: fasilitas.icon,
      judul: fasilitas.judul,
      deskripsi: fasilitas.deskripsi,
      urutan_tampil: fasilitas.urutan_tampil,
      status: fasilitas.status
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (fasilitas) => {
    setSelectedFasilitas(fasilitas);
    setShowDeleteModal(true);
  };

  const openAktifModal = (fasilitas) => {
    setSelectedFasilitas(fasilitas);
    setShowAktifModal(true);
  };

  const openNonaktifModal = (fasilitas) => {
    setSelectedFasilitas(fasilitas);
    setShowNonaktifModal(true);
  };

  // Handler untuk memilih icon
  const handleSelectIcon = (iconName) => {
    setFormData({ ...formData, icon: iconName });
    setShowIconDropdown(false);
  };

  const handleCreateFasilitas = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('icon', formData.icon);
      formDataToSend.append('judul', formData.judul);
      formDataToSend.append('deskripsi', formData.deskripsi);
      formDataToSend.append('urutan_tampil', formData.urutan_tampil.toString());
      formDataToSend.append('status', formData.status);
  
      const response = await fetch(`${API_URL}/api/super-admin/fasilitas`, {
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
  
      await fetchFasilitas();
      setShowCreateModal(false);
      resetForm();
      showAlert('Berhasil', 'Fasilitas berhasil dibuat', 'success');
    } catch (error) {
      console.error('Error creating fasilitas:', error);
      showAlert('Gagal', error.message || 'Gagal membuat fasilitas', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateFasilitas = async (e) => {
    e.preventDefault();
    if (!selectedFasilitas) return;
  
    try {
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('icon', formData.icon);
      formDataToSend.append('judul', formData.judul);
      formDataToSend.append('deskripsi', formData.deskripsi);
      formDataToSend.append('urutan_tampil', formData.urutan_tampil.toString());
      formDataToSend.append('status', formData.status);
  
      const response = await fetch(`${API_URL}/api/super-admin/fasilitas/${selectedFasilitas.id}`, {
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
  
      await fetchFasilitas();
      setShowEditModal(false);
      resetForm();
      setSelectedFasilitas(null);
      showAlert('Berhasil', 'Fasilitas berhasil diupdate', 'success');
    } catch (error) {
      console.error('Error updating fasilitas:', error);
      showAlert('Gagal', error.message || 'Gagal mengupdate fasilitas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk menghapus fasilitas
  const handleDeleteFasilitas = async () => {
    if (!selectedFasilitas) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/fasilitas/${selectedFasilitas.id}`, {
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

      setFasilitas(fasilitas.filter(item => item.id !== selectedFasilitas.id));
      setShowDeleteModal(false);
      setSelectedFasilitas(null);
      showAlert('Berhasil', 'Fasilitas berhasil dihapus', 'success');
    } catch (error) {
      console.error('Error deleting fasilitas:', error);
      showAlert('Gagal', error.message || 'Gagal menghapus fasilitas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk mengaktifkan fasilitas
  const handleAktifkanFasilitas = async () => {
    if (!selectedFasilitas) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/fasilitas/${selectedFasilitas.id}/aktif`, {
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

      // Update status fasilitas di state
      setFasilitas(fasilitas.map(item => 
        item.id === selectedFasilitas.id 
          ? { ...item, status: 'aktif' }
          : item
      ));
      
      setShowAktifModal(false);
      setSelectedFasilitas(null);
      showAlert('Berhasil', 'Fasilitas berhasil diaktifkan', 'success');
    } catch (error) {
      console.error('Error activating fasilitas:', error);
      showAlert('Gagal', error.message || 'Gagal mengaktifkan fasilitas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk menonaktifkan fasilitas
  const handleNonaktifkanFasilitas = async () => {
    if (!selectedFasilitas) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/fasilitas/${selectedFasilitas.id}/nonaktif`, {
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

      // Update status fasilitas di state
      setFasilitas(fasilitas.map(item => 
        item.id === selectedFasilitas.id 
          ? { ...item, status: 'nonaktif' }
          : item
      ));
      
      setShowNonaktifModal(false);
      setSelectedFasilitas(null);
      showAlert('Berhasil', 'Fasilitas berhasil dinonaktifkan', 'success');
    } catch (error) {
      console.error('Error deactivating fasilitas:', error);
      showAlert('Gagal', error.message || 'Gagal menonaktifkan fasilitas', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk preview fasilitas
  const handlePreviewFasilitas = (fasilitas) => {
    setPreviewFasilitas(fasilitas);
    setShowPreviewModal(true);
  };

  // Filter fasilitas
  const filteredFasilitas = fasilitas.filter(item => {
    const matchesSearch = item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Statistik
  const getStats = () => {
    const totalFasilitas = fasilitas.length;
    const aktifFasilitas = fasilitas.filter(item => item.status === 'aktif').length;
    const nonaktifFasilitas = fasilitas.filter(item => item.status === 'nonaktif').length;
    
    return { totalFasilitas, aktifFasilitas, nonaktifFasilitas };
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

  // Icons untuk fasilitas
  const getIconPreview = (iconName) => {
    const iconMap = {
      'users': '👥',
      'book-open': '📚',
      'shield-check': '🛡️',
      'graduation-cap': '🎓',
      'star': '⭐',
      'award': '🏆',
      'clock': '⏰',
      'check-circle': '✅',
      'academic-cap': '🎓',
      'bookmark': '📑'
    };
    return iconMap[iconName] || '📄';
  };

  // Get SVG icon by name
  const getIconSvg = (iconName) => {
    const icon = availableIcons.find(icon => icon.name === iconName);
    return icon ? icon.svg : availableIcons[0].svg;
  };

  // Icons untuk UI
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
    ),
    chevronDown: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  };

  // Komponen untuk dropdown icon
  const IconDropdown = () => (
    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      <div className="p-2">
        <div className="grid grid-cols-2 gap-2">
          {availableIcons.map((icon) => (
            <button
              key={icon.name}
              type="button"
              onClick={() => handleSelectIcon(icon.name)}
              className={`flex items-center space-x-2 p-2 rounded-md hover:bg-green-50 transition-colors ${
                formData.icon === icon.name ? 'bg-green-100 border border-green-300' : 'border border-transparent'
              }`}
            >
              <span className="text-green-600">{icon.svg}</span>
              <span className="text-sm text-gray-700">{icon.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading && fasilitas.length === 0) {
    return (
      <AuthDashboardLayout>
        <div className="p-0">
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

  if (error && fasilitas.length === 0) {
    return (
      <AuthDashboardLayout>
        <div className="p-0">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Terjadi Kesalahan</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button 
              onClick={fetchFasilitas}
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
    <AuthDashboardLayout title="Fasilitas">
      <div className="p-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Fasilitas</h1>
            <p className="text-gray-600 mt-1">Kelola fasilitas TPQ</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            {icons.plus}
            Tambah Fasilitas
          </button>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800">Total Fasilitas</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalFasilitas}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800">Aktif</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.aktifFasilitas}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500">
            <h3 className="text-lg font-semibold text-gray-800">Nonaktif</h3>
            <p className="text-3xl font-bold text-gray-600">{stats.nonaktifFasilitas}</p>
          </div>
        </div>

        {/* Filter dan Search Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Cari berdasarkan judul atau deskripsi..."
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

        {/* Tabel Fasilitas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Icon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Judul
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deskripsi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urutan
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
                {filteredFasilitas.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="mt-2">Tidak ada data fasilitas</p>
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
                  filteredFasilitas.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-2xl">
                          {getIconPreview(item.icon)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {item.icon}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs">
                          {item.judul}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs line-clamp-2">
                          {item.deskripsi}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {item.urutan_tampil}
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
                            title="Edit Fasilitas"
                          >
                            {icons.edit}
                            Edit
                          </button>
                          <button 
                              onClick={() => handlePreviewFasilitas(item)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1 transition-colors"
                              title="Preview Fasilitas"
                            >
                              {icons.preview}
                              Preview
                            </button>
                          {item.status === 'nonaktif' ? (
                            <button 
                              onClick={() => openAktifModal(item)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1 transition-colors"
                              title="Aktifkan Fasilitas"
                            >
                              {icons.activate}
                              Aktifkan
                            </button>
                          ) : (
                            <button 
                              onClick={() => openNonaktifModal(item)}
                              className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1 transition-colors"
                              title="Nonaktifkan Fasilitas"
                            >
                              {icons.deactivate}
                              Nonaktifkan
                            </button>
                          )}
                          <button 
                            onClick={() => openDeleteModal(item)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors"
                            title="Hapus Fasilitas"
                          >
                            {icons.delete}
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
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
              <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Fasilitas Baru</h3>
              <form onSubmit={handleCreateFasilitas}>
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowIconDropdown(!showIconDropdown)}
                        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                      >
                        <div className="flex items-center space-x-2">
                          {formData.icon ? (
                            <>
                              <span className="text-green-600">
                                {getIconSvg(formData.icon)}
                              </span>
                              <span className="text-gray-700">
                                {availableIcons.find(icon => icon.name === formData.icon)?.label || formData.icon}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500">Pilih icon...</span>
                          )}
                        </div>
                        {icons.chevronDown}
                      </button>
                      {showIconDropdown && <IconDropdown />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Pilih icon yang sesuai untuk fasilitas
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Judul
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.judul}
                      onChange={(e) => setFormData({...formData, judul: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan judul fasilitas"
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
                      placeholder="Masukkan deskripsi fasilitas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      value={formData.urutan_tampil}
                      onChange={(e) => setFormData({...formData, urutan_tampil: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Angka lebih kecil akan ditampilkan lebih dulu
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

        {/* PREVIEW MODAL FASILITAS */}
{showPreviewModal && previewFasilitas && (
  <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-75 flex items-center justify-center p-4 z-[100] overflow-y-auto">
    <div className="bg-white rounded-xl w-full max-w-4xl my-8 animate-fadeIn">
      {/* Modal Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-800">Preview Fasilitas</h3>
        <button
          onClick={() => {
            setShowPreviewModal(false);
            setPreviewFasilitas(null);
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
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">
                  {getIconPreview(previewFasilitas.icon)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {previewFasilitas.judul}
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    previewFasilitas.status === 'aktif' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formatStatus(previewFasilitas.status)}
                  </span>
                  <div className="flex items-center space-x-2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Urutan: {previewFasilitas.urutan_tampil}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Icon Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Icon Fasilitas</h3>
                <div className="flex items-center space-x-4">
                  <div className="text-4xl">
                    {getIconPreview(previewFasilitas.icon)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      <strong>Nama:</strong> {previewFasilitas.icon}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Preview SVG:</strong>
                    </p>
                    <div className="mt-2 text-green-600">
                      {getIconSvg(previewFasilitas.icon)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Deskripsi Fasilitas</h3>
                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-lg">
                  {previewFasilitas.deskripsi?.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Detail Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Informasi Publikasi</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        previewFasilitas.status === 'aktif' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {formatStatus(previewFasilitas.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Urutan Tampil</span>
                      <span className="text-sm font-medium text-gray-800">
                        #{previewFasilitas.urutan_tampil}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Informasi Sistem</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Terakhir Diupdate</span>
                      <span className="text-sm text-gray-800">
                        {formatDate(previewFasilitas.diperbarui_pada)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Oleh</span>
                      <span className="text-sm font-medium text-gray-800">
                        {previewFasilitas.diupdate_oleh}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Dibuat Pada</span>
                      <span className="text-sm text-gray-800">
                        {formatDate(previewFasilitas.dibuat_pada)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Modal Footer */}
      <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Catatan:</span> Ini adalah preview tampilan fasilitas.
          {previewFasilitas.status === 'aktif' ? (
            <span className="ml-1 text-green-600">Fasilitas aktif dan dapat dilihat publik.</span>
          ) : (
            <span className="ml-1 text-red-600">Fasilitas nonaktif dan tidak ditampilkan ke publik.</span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowPreviewModal(false);
              setPreviewFasilitas(null);
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Tutup
          </button>
          {previewFasilitas.status === 'nonaktif' ? (
            <button
              onClick={() => {
                setShowPreviewModal(false);
                openAktifModal(previewFasilitas);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Aktifkan Fasilitas
            </button>
          ) : (
            <button
              onClick={() => {
                setShowPreviewModal(false);
                openNonaktifModal(previewFasilitas);
              }}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Nonaktifkan
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}

        {/* EDIT MODAL */}
        {showEditModal && selectedFasilitas && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Fasilitas</h3>
              <form onSubmit={handleUpdateFasilitas}>
                <div className="space-y-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowIconDropdown(!showIconDropdown)}
                        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                      >
                        <div className="flex items-center space-x-2">
                          {formData.icon ? (
                            <>
                              <span className="text-green-600">
                                {getIconSvg(formData.icon)}
                              </span>
                              <span className="text-gray-700">
                                {availableIcons.find(icon => icon.name === formData.icon)?.label || formData.icon}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500">Pilih icon...</span>
                          )}
                        </div>
                        {icons.chevronDown}
                      </button>
                      {showIconDropdown && <IconDropdown />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Judul
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.judul}
                      onChange={(e) => setFormData({...formData, judul: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan judul fasilitas"
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
                      placeholder="Masukkan deskripsi fasilitas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Urutan Tampil
                    </label>
                    <input
                      type="number"
                      value={formData.urutan_tampil}
                      onChange={(e) => setFormData({...formData, urutan_tampil: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="0"
                      min="0"
                    />
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
        {showDeleteModal && selectedFasilitas && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Fasilitas</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus fasilitas <strong>"{selectedFasilitas.judul}"</strong>?
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
                  onClick={handleDeleteFasilitas}
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
        {showAktifModal && selectedFasilitas && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Aktifkan Fasilitas</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin mengaktifkan fasilitas <strong>"{selectedFasilitas.judul}"</strong>?
                Fasilitas akan ditampilkan ke publik.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAktifModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleAktifkanFasilitas}
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
        {showNonaktifModal && selectedFasilitas && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Nonaktifkan Fasilitas</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menonaktifkan fasilitas <strong>"{selectedFasilitas.judul}"</strong>?
                Fasilitas tidak akan ditampilkan ke publik.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNonaktifModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleNonaktifkanFasilitas}
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

export default FasilitasManagement;