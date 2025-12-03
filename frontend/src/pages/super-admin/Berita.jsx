import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BeritaManagement = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [berita, setBerita] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kategoriFilter, setKategoriFilter] = useState('all');

  // State untuk modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  const [selectedBerita, setSelectedBerita] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
const [imageError, setImageError] = useState(false);
const [previewBerita, setPreviewBerita] = useState(null);
  
  // State untuk form
  const [formData, setFormData] = useState({
    judul: '',
    kategori: 'umum',
    konten: '',
    status: 'draft'
  });
  const [gambarCover, setGambarCover] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0); // Progress bar
  const [isUploading, setIsUploading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  
  // Cloudinary Configuration
  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET || 'berita_upload';
  const CLOUDINARY_API_KEY = import.meta.env.VITE_API_KEY;
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const hasPermission = () => {
    if (!currentUser) return false;
    return currentUser.role === 'super_admin';
  };

 // Fungsi untuk upload langsung ke Cloudinary dan mengembalikan URL
const uploadToCloudinary = async (file) => {
  setIsUploading(true);
  setUploadProgress(0);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('folder', 'berita');
    formData.append('timestamp', (Date.now() / 1000).toString());
    
    // Optional: Tambahkan tags
    formData.append('tags', 'berita,tpq,website');
    
    const response = await axios.post(CLOUDINARY_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      }
    });

    if (response.data.secure_url) {
      console.log('Upload berhasil:', response.data);
      // Kembalikan URL string dan public_id saja
      return {
        url: response.data.secure_url,
        publicId: response.data.public_id,
        format: response.data.format,
        width: response.data.width,
        height: response.data.height,
        bytes: response.data.bytes
      };
    } else {
      throw new Error('Gagal mendapatkan URL gambar');
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Upload gambar gagal: ${error.response?.data?.error?.message || error.message}`);
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};

  // Fetch berita dari API
  const fetchBerita = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = '/api/super-admin/berita/all';
      
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
      const transformedBerita = data.data.map(item => ({
        id: item.id_berita,
        judul: item.judul,
        slug: item.slug,
        penulis: item.penulis?.nama_lengkap || 'Admin',
        tanggal: item.tanggal_publikasi ? new Date(item.tanggal_publikasi).toISOString().split('T')[0] : '-',
        status: item.status,
        kategori: item.kategori,
        konten: item.konten,
        gambar_cover: item.gambar_cover, // Sekarang ini adalah URL Cloudinary
        dibuat_pada: item.dibuat_pada,
        diperbarui_pada: item.diperbarui_pada,
      }));
      
      setBerita(transformedBerita);

    } catch (err) {
      console.error('Error fetching berita:', err);
      setError(`Gagal memuat data berita: ${err.message}`);
      setBerita([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!hasPermission()) {
      navigate('/unauthorized');
      return;
    }

    fetchBerita();
  }, [currentUser, navigate]);

  // Show alert modal
  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      judul: '',
      kategori: 'umum',
      konten: '',
      status: 'draft'
    });
    setGambarCover(null);
    setImagePreview(null);
    setUploadProgress(0);
  };

  // Modal handlers
  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (berita) => {
    setSelectedBerita(berita);
    setFormData({
      judul: berita.judul,
      kategori: berita.kategori,
      konten: berita.konten,
      status: berita.status
    });
    setGambarCover(null);
    // Jika gambar_cover adalah URL Cloudinary, gunakan langsung
    setImagePreview(berita.gambar_cover || null);
    setShowEditModal(true);
  };

  const openDeleteModal = (berita) => {
    setSelectedBerita(berita);
    setShowDeleteModal(true);
  };

  const openPublishModal = (berita) => {
    setSelectedBerita(berita);
    setShowPublishModal(true);
  };

  const openImageModal = (berita) => {
    setSelectedBerita(berita);
    setImageLoading(true);
    setImageError(false);
    setShowImageModal(true);
  };

  const handleCreateBerita = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      let imageUrl = null;
      
      // Upload gambar ke Cloudinary jika ada
      if (gambarCover) {
        const cloudinaryResult = await uploadToCloudinary(gambarCover);
        imageUrl = cloudinaryResult.url; // URL string dari Cloudinary
      }
  
      // Kirim data sebagai JSON (bukan FormData)
      const dataToSend = {
        judul: formData.judul,
        kategori: formData.kategori,
        konten: formData.konten,
        status: formData.status,
        gambar_cover: imageUrl // String URL atau null
      };
  
      console.log('Data yang dikirim:', dataToSend); // Debug log
  
      const response = await fetch(`${API_URL}/api/super-admin/berita`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json' // Pastikan ini JSON
        },
        body: JSON.stringify(dataToSend)
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
  
      await fetchBerita();
      setShowCreateModal(false);
      resetForm();
      showAlert('Berhasil', 'Berita berhasil dibuat', 'success');
    } catch (error) {
      console.error('Error creating berita:', error);
      showAlert('Gagal', error.message || 'Gagal membuat berita', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBerita = async (e) => {
    e.preventDefault();
    if (!selectedBerita) return;
  
    try {
      setLoading(true);
      
      let imageUrl = selectedBerita.gambar_cover;
      
      // Upload gambar baru ke Cloudinary jika ada
      if (gambarCover) {
        const cloudinaryResult = await uploadToCloudinary(gambarCover);
        imageUrl = cloudinaryResult.url; // URL string dari Cloudinary
      }
  
      // Kirim data sebagai JSON (bukan FormData)
      const dataToSend = {
        judul: formData.judul,
        kategori: formData.kategori,
        konten: formData.konten,
        status: formData.status,
        gambar_cover: imageUrl // String URL
      };
  
      console.log('Data yang dikirim:', dataToSend); // Debug log
  
      const response = await fetch(`${API_URL}/api/super-admin/berita/${selectedBerita.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json' // Pastikan ini JSON
        },
        body: JSON.stringify(dataToSend)
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }
  
      await fetchBerita();
      setShowEditModal(false);
      resetForm();
      setSelectedBerita(null);
      showAlert('Berhasil', 'Berita berhasil diupdate', 'success');
    } catch (error) {
      console.error('Error updating berita:', error);
      showAlert('Gagal', error.message || 'Gagal mengupdate berita', 'error');
    } finally {
      setLoading(false);
    }
  };
  // Handler untuk menghapus berita
  const handleDeleteBerita = async () => {
    if (!selectedBerita) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/berita/${selectedBerita.id}`, {
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

      setBerita(berita.filter(item => item.id !== selectedBerita.id));
      setShowDeleteModal(false);
      setSelectedBerita(null);
      showAlert('Berhasil', 'Berita berhasil dihapus', 'success');
    } catch (error) {
      console.error('Error deleting berita:', error);
      showAlert('Gagal', error.message || 'Gagal menghapus berita', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk publish berita
  const handlePublishBerita = async () => {
    if (!selectedBerita) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/berita/${selectedBerita.id}/publish`, {
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

      setBerita(berita.map(item => 
        item.id === selectedBerita.id 
          ? { 
              ...item, 
              status: 'published',
              tanggal: new Date().toISOString().split('T')[0]
            }
          : item
      ));
      
      setShowPublishModal(false);
      setSelectedBerita(null);
      showAlert('Berhasil', 'Berita berhasil dipublish', 'success');
    } catch (error) {
      console.error('Error publishing berita:', error);
      showAlert('Gagal', error.message || 'Gagal mempublish berita', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewBerita = (berita) => {
    setPreviewBerita(berita);
    setShowPreviewModal(true);
  };

  // Handler untuk gambar
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi tipe file
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showAlert('Error', 'Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP.', 'error');
        return;
      }
  
      // Validasi ukuran file (max 10MB untuk Cloudinary)
      if (file.size > 10 * 1024 * 1024) {
        showAlert('Error', 'Ukuran file terlalu besar. Maksimal 10MB.', 'error');
        return;
      }
  
      setGambarCover(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Optimize Cloudinary URL untuk tampilan
  const getOptimizedImageUrl = (url, width = 800) => {
    if (!url || !url.includes('cloudinary.com')) return url;
    
    // Masukkan parameter transformation ke URL Cloudinary
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${width},c_limit,q_auto,f_auto/${parts[1]}`;
    }
    return url;
  };

  // Filter berita
  const filteredBerita = berita.filter(item => {
    const matchesSearch = item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.konten.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesKategori = kategoriFilter === 'all' || item.kategori === kategoriFilter;
    
    return matchesSearch && matchesStatus && matchesKategori;
  });

  // Statistik
  const getStats = () => {
    const totalBerita = berita.length;
    const publishedBerita = berita.filter(item => item.status === 'published').length;
    const draftBerita = berita.filter(item => item.status === 'draft').length;
    const arsipBerita = berita.filter(item => item.status === 'arsip').length;
    
    return { totalBerita, publishedBerita, draftBerita, arsipBerita };
  };

  const stats = getStats();

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    
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
      'published': 'Published',
      'draft': 'Draft',
      'arsip': 'Arsip'
    };
    return statusMap[status] || status;
  };

  // Format kategori
  const formatKategori = (kategori) => {
    const kategoriMap = {
      'umum': 'Umum',
      'pengumuman': 'Pengumuman',
      'acara': 'Acara'
    };
    return kategoriMap[kategori] || kategori;
  };

  // Icons - SEPERTI DI DATADONASI
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
    publish: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    image: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    )
  };

  if (loading && berita.length === 0) {
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

  if (error && berita.length === 0) {
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
              onClick={fetchBerita}
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
    <AuthDashboardLayout title="Berita">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Berita</h1>
            <p className="text-gray-600 mt-1">Kelola berita dan artikel TPQ</p>
          </div>
          <button 
            onClick={openCreateModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            {icons.plus}
            Tambah Berita
          </button>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800">Total Berita</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalBerita}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800">Published</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.publishedBerita}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-800">Draft</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.draftBerita}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500">
            <h3 className="text-lg font-semibold text-gray-800">Arsip</h3>
            <p className="text-3xl font-bold text-gray-600">{stats.arsipBerita}</p>
          </div>
        </div>

        {/* Filter dan Search Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Cari berdasarkan judul atau konten..."
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
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="arsip">Arsip</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              <option value="umum">Umum</option>
              <option value="pengumuman">Pengumuman</option>
              <option value="acara">Acara</option>
            </select>
          </div>
        </div>

        {/* Tabel Berita */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Judul Berita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Penulis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
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
                {filteredBerita.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v3m0-3a2 2 0 012-2h2a2 2 0 012 2m-6 5v6m4-3H9" />
                      </svg>
                      <p className="mt-2">Tidak ada data berita</p>
                      {searchTerm || statusFilter !== 'all' || kategoriFilter !== 'all' ? (
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setKategoriFilter('all');
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Reset filter
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  filteredBerita.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                            {item.judul}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {item.gambar_cover && (
                              <button 
                                onClick={() => openImageModal(item)}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                {icons.image}
                                Lihat Gambar
                              </button>
                            )}
                          </div>
                        </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.penulis}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                          {formatKategori(item.kategori)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(item.tanggal)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEditModal(item)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors"
                            title="Edit Berita"
                          >
                            {icons.edit}
                            Edit
                          </button>
                          <button 
                            onClick={() => handlePreviewBerita(item)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1 transition-colors"
                            title="Preview Berita"
                          >
                            {icons.preview}
                            Preview
                          </button>
                          {item.status === 'draft' && (
                            <button 
                              onClick={() => openPublishModal(item)}
                              className="text-purple-600 hover:text-purple-900 flex items-center gap-1 transition-colors"
                              title="Publish Berita"
                            >
                              {icons.publish}
                              Publish
                            </button>
                          )}
                          <button 
                            onClick={() => openDeleteModal(item)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors"
                            title="Hapus Berita"
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
              <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Berita Baru</h3>
              <form onSubmit={handleCreateBerita}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Judul Berita
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.judul}
                        onChange={(e) => setFormData({...formData, judul: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Masukkan judul berita"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori
                      </label>
                      <select
                        value={formData.kategori}
                        onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="umum">Umum</option>
                        <option value="pengumuman">Pengumuman</option>
                        <option value="acara">Acara</option>
                      </select>
                    </div>
                  </div>

                  <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gambar Cover
            </label>
            <div className="flex items-center gap-4">
              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500 mt-2">Upload Gambar</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  Gambar akan diupload langsung ke Cloudinary. Format: JPG, PNG, GIF, WebP. Maks: 10MB.
                </p>
                {/* Progress Bar */}
                {isUploading && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Konten Berita
                    </label>
                    <textarea
                      required
                      value={formData.konten}
                      onChange={(e) => setFormData({...formData, konten: e.target.value})}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Tulis konten berita di sini..."
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
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="arsip">Arsip</option>
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
            disabled={loading || isUploading}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading || isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                {isUploading ? 'Mengupload...' : 'Menyimpan...'}
              </>
            ) : 'Simpan'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* PREVIEW MODAL */}
{showPreviewModal && previewBerita && (
  <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-75 flex items-center justify-center p-4 z-[100] overflow-y-auto">
    <div className="bg-white rounded-xl w-full max-w-4xl my-8 animate-fadeIn">
      {/* Modal Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-800">Preview Berita</h3>
        <button
          onClick={() => {
            setShowPreviewModal(false);
            setPreviewBerita(null);
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
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                previewBerita.kategori === 'umum' ? 'bg-blue-100 text-blue-800' :
                previewBerita.kategori === 'pengumuman' ? 'bg-green-100 text-green-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {formatKategori(previewBerita.kategori)}
              </span>
              <div className="flex items-center space-x-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(previewBerita.tanggal)}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Oleh: {previewBerita.penulis || 'Admin TPQ'}</span>
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 leading-tight">
              {previewBerita.judul}
            </h1>
          </div>

          {/* Featured Image */}
          {previewBerita.gambar_cover && (
            <div className="relative">
              <img 
                src={getOptimizedImageUrl(previewBerita.gambar_cover, 1200)}
                alt={previewBerita.judul}
                className="w-full h-96 object-cover"
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  console.error('Gagal memuat gambar:', previewBerita.gambar_cover);
                  e.target.src = 'https://via.placeholder.com/800x400?text=Gambar+Tidak+Tersedia';
                  setImageLoading(false);
                }}
                loading="lazy"
              />
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              {previewBerita.konten?.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Article Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Status: 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      previewBerita.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : previewBerita.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {formatStatus(previewBerita.status)}
                    </span>
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Dibuat: {formatDate(previewBerita.dibuat_pada)}</span>
                  </span>
                  {previewBerita.diperbarui_pada && previewBerita.diperbarui_pada !== '-' && (
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Update: {formatDate(previewBerita.diperbarui_pada)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

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
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowPreviewModal(false);
              setPreviewBerita(null);
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Tutup
          </button>
          {previewBerita.status === 'draft' && (
            <button
              onClick={() => {
                setShowPreviewModal(false);
                openPublishModal(previewBerita);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Publish Berita
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}

        {/* EDIT MODAL - SEPERTI DI DATADONASI */}
        {showEditModal && selectedBerita && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Berita</h3>
              <form onSubmit={handleUpdateBerita}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Judul Berita
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.judul}
                        onChange={(e) => setFormData({...formData, judul: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Masukkan judul berita"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori
                      </label>
                      <select
                        value={formData.kategori}
                        onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="umum">Umum</option>
                        <option value="pengumuman">Pengumuman</option>
                        <option value="acara">Acara</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gambar Cover
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-gray-500 mt-2">Upload Gambar</p>
                          </div>
                        )}
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          {selectedBerita.gambar_cover ? 'Gambar saat ini akan diganti dengan yang baru.' : 'Upload gambar cover untuk berita.'}
                        </p>
                        {selectedBerita.gambar_cover && !imagePreview?.startsWith('blob:') && (
                          <button
                            type="button"
                            onClick={() => openImageModal(selectedBerita)}
                            className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                          >
                            {icons.preview}
                            Lihat Gambar Saat Ini
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Konten Berita
                    </label>
                    <textarea
                      required
                      value={formData.konten}
                      onChange={(e) => setFormData({...formData, konten: e.target.value})}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Tulis konten berita di sini..."
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
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="arsip">Arsip</option>
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

        {/* DELETE MODAL - SEPERTI DI DATADONASI */}
        {showDeleteModal && selectedBerita && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Berita</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus berita <strong>"{selectedBerita.judul}"</strong>?
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
                  onClick={handleDeleteBerita}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PUBLISH MODAL - SEPERTI DI DATADONASI */}
        {showPublishModal && selectedBerita && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Publish Berita</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin mempublish berita <strong>"{selectedBerita.judul}"</strong>?
                Berita akan ditampilkan ke publik.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handlePublishBerita}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IMAGE MODAL */}
{showImageModal && selectedBerita && (
  <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">Gambar Cover Berita</h3>
        <button
          onClick={() => setShowImageModal(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {selectedBerita.gambar_cover ? (
        <div className="relative">
          {/* Loading Overlay */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
              <div className="flex flex-col items-center">
                {/* Spinner Animation */}
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
                <p className="text-gray-600 text-sm">Memuat gambar...</p>
              </div>
            </div>
          )}
          
          {/* Error Overlay */}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-50 rounded-lg z-10">
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600 text-center mb-4">Gagal memuat gambar</p>
                <button
                  onClick={() => {
                    setImageLoading(true);
                    setImageError(false);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          )}
          
          {/* Gambar */}
          <img 
            src={getOptimizedImageUrl(selectedBerita.gambar_cover, 1200)}
            alt={selectedBerita.judul}
            className={`w-full h-auto max-h-96 object-contain rounded-lg mb-4 transition-opacity duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => {
              setImageLoading(false);
              setImageError(false);
            }}
            onError={(e) => {
              console.error('Gagal memuat gambar dari Cloudinary:', selectedBerita.gambar_cover);
              setImageLoading(false);
              setImageError(true);
              e.target.src = 'https://via.placeholder.com/800x400?text=Gambar+Tidak+Tersedia';
            }}
          />
          
          {/* Info Gambar */}
          {!imageLoading && !imageError && (
            <div className="space-y-2 text-sm text-gray-600 animate-fadeIn">
              <p><strong>Source:</strong> Cloudinary</p>
              <p><strong>URL:</strong> 
                <a 
                  href={selectedBerita.gambar_cover} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 ml-1 break-all"
                >
                  {selectedBerita.gambar_cover.length > 100 
                    ? `${selectedBerita.gambar_cover.substring(0, 100)}...` 
                    : selectedBerita.gambar_cover}
                </a>
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedBerita.gambar_cover);
                  showAlert('Berhasil', 'URL gambar telah disalin ke clipboard', 'success');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Salin URL
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 animate-fadeIn">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">Tidak ada gambar cover untuk berita ini</p>
        </div>
      )}
    </div>
  </div>
)}

        {/* ALERT MODAL - SEPERTI DI DATADONASI */}
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

export default BeritaManagement;