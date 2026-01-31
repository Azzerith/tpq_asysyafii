// pages/wali/Komentar.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const Komentar = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testimoniData, setTestimoniData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    komentar: '',
    rating: 5
  });
  const [actionLoading, setActionLoading] = useState(false);
  
  // State untuk modal notifikasi
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({
    type: 'success',
    title: '',
    message: '',
    onConfirm: null
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fungsi untuk menampilkan modal notifikasi
  const showNotification = (type, title, message, onConfirm = null) => {
    setNotificationData({
      type,
      title,
      message,
      onConfirm
    });
    setShowNotificationModal(true);
  };

  // Fungsi untuk menutup modal notifikasi
  const closeNotification = () => {
    setShowNotificationModal(false);
    if (notificationData.onConfirm) {
      notificationData.onConfirm();
    }
  };

  // Fetch data testimoni
  const fetchTestimoniData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_URL}/api/testimoni/my`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setTestimoniData(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      setTestimoniData(data.data);

    } catch (err) {
      console.error('Error fetching testimoni data:', err);
      setError(err.message);
      setTestimoniData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimoniData();
  }, [API_URL]);

  // Handle Tambah Testimoni
  const handleTambahTestimoni = () => {
    setFormData({
      komentar: '',
      rating: 5
    });
    setShowAddModal(true);
  };

  // Di handleAddTestimoni - ubah ke FormData
const handleAddTestimoni = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
  
      // Validasi
      if (!formData.komentar.trim()) {
        showNotification('error', 'Gagal!', 'Komentar harus diisi!');
        return;
      }
  
      if (formData.rating < 1 || formData.rating > 5) {
        showNotification('error', 'Gagal!', 'Rating harus antara 1 sampai 5!');
        return;
      }
  
      // Gunakan FormData instead of JSON
      const formDataToSend = new FormData();
      formDataToSend.append('komentar', formData.komentar.trim());
      formDataToSend.append('rating', formData.rating.toString());
  
      const response = await fetch(`${API_URL}/api/testimoni`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          // Jangan set Content-Type untuk FormData, browser akan set otomatis
        },
        body: formDataToSend
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      setTestimoniData(data.data);
      setShowAddModal(false);
      showNotification('success', 'Berhasil!', 'Testimoni berhasil ditambahkan!');
  
    } catch (err) {
      console.error('Error adding testimoni:', err);
      showNotification('error', 'Gagal!', `Gagal menambahkan testimoni: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Testimoni
  const handleEditTestimoni = () => {
    setFormData({
      komentar: testimoniData?.komentar || '',
      rating: testimoniData?.rating || 5
    });
    setShowEditModal(true);
  };

  // Di handleUpdateTestimoni - ubah ke FormData
const handleUpdateTestimoni = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
  
      // Validasi
      if (!formData.komentar.trim()) {
        showNotification('error', 'Gagal!', 'Komentar harus diisi!');
        return;
      }
  
      if (formData.rating < 1 || formData.rating > 5) {
        showNotification('error', 'Gagal!', 'Rating harus antara 1 sampai 5!');
        return;
      }
  
      // Gunakan FormData
      const formDataToSend = new FormData();
      formDataToSend.append('komentar', formData.komentar.trim());
      formDataToSend.append('rating', formData.rating.toString());
  
      const response = await fetch(`${API_URL}/api/testimoni/${testimoniData.id_testimoni}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formDataToSend
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      setTestimoniData(data.data);
      setShowEditModal(false);
      showNotification('success', 'Berhasil!', 'Testimoni berhasil diperbarui!');
  
    } catch (err) {
      console.error('Error updating testimoni:', err);
      showNotification('error', 'Gagal!', `Gagal memperbarui testimoni: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Hapus Testimoni
  const handleDeleteTestimoni = async () => {
    try {
      setActionLoading(true);

      const response = await fetch(`${API_URL}/api/testimoni/${testimoniData.id_testimoni}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      setTestimoniData(null);
      showNotification('success', 'Berhasil!', 'Testimoni berhasil dihapus!');

    } catch (err) {
      console.error('Error deleting testimoni:', err);
      showNotification('error', 'Gagal!', `Gagal menghapus testimoni: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Konfirmasi hapus
  const confirmDelete = () => {
    showNotification(
      'error',
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus testimoni ini?',
      handleDeleteTestimoni
    );
  };

  // Format tanggal
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Render rating stars
  const renderStars = (rating) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  // Get status color
  const getStatusColor = (status) => {
    const colorMap = {
      'show': 'bg-green-100 text-green-800',
      'hide': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Format status
  const formatStatus = (status) => {
    const statusMap = {
      'show': 'Ditampilkan',
      'hide': 'Disembunyikan'
    };
    return statusMap[status] || status;
  };

  // Skeleton Loader
  const SkeletonLoader = () => (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-green-200 rounded w-64"></div>
        <div className="h-4 bg-green-200 rounded w-96"></div>
      </div>
      {/* Content Skeleton */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
        <div className="h-64 bg-green-200 rounded"></div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <SkeletonLoader />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-900 mb-2">Komentar & Testimoni</h1>
        <p className="text-green-600">Bagikan pengalaman dan masukan Anda tentang TPQ Asy-Syafii</p>
      </div>

      {/* Testimoni Card */}
      {testimoniData ? (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-green-900">Testimoni Anda</h3>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(testimoniData.status)}`}>
                    {formatStatus(testimoniData.status)}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEditTestimoni}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={confirmDelete}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center space-x-3 mb-4">
                {renderStars(testimoniData.rating)}
                <span className="text-lg font-semibold text-green-900">{testimoniData.rating}.0</span>
              </div>

              {/* Komentar */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-green-900 leading-relaxed whitespace-pre-wrap">
                  {testimoniData.komentar}
                </p>
              </div>

              {/* Metadata */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-green-600">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Dibuat: {formatDate(testimoniData.dibuat_pada)}</span>
                </div>
                {testimoniData.diperbarui_pada && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Diperbarui: {formatDate(testimoniData.diperbarui_pada)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Tampilan ketika tidak ada testimoni
        <div className="bg-white rounded-xl p-6 shadow-sm border border-green-200">
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">Belum Ada Testimoni</h3>
            <p className="text-green-600 mb-6 max-w-md mx-auto">
              {error || 'Bagikan pengalaman dan masukan Anda tentang TPQ Asy-Syafii untuk membantu kami menjadi lebih baik.'}
            </p>
            
            {/* Placeholder Card */}
            <div className="bg-green-50 rounded-lg border border-green-200 mb-6 max-w-2xl mx-auto p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className="w-5 h-5 text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded p-4 border border-green-200">
                <p className="text-green-500 italic text-center">
                  Testimoni Anda akan muncul di sini setelah dibuat
                </p>
              </div>
            </div>

            <button 
              onClick={handleTambahTestimoni}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-sm flex items-center space-x-2 mx-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Tulis Testimoni</span>
            </button>
          </div>
        </div>
      )}

      {/* Informasi Tambahan */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-semibold text-blue-900">Tips Menulis Testimoni</h4>
          </div>
          <ul className="text-blue-700 text-sm space-y-2">
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Ceritakan pengalaman langsung dengan TPQ Asy-Syafii</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Berikan saran yang membangun</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Gunakan bahasa yang sopan dan jelas</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Modal Tambah Testimoni */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Tulis Testimoni</h3>
              <form onSubmit={handleAddTestimoni} className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-3">Rating</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        className="focus:outline-none transform hover:scale-110 transition-transform duration-200"
                      >
                        <svg
                          className={`w-10 h-10 ${star <= formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    Pilih {formData.rating} bintang - {formData.rating === 5 ? 'Sangat Baik' : 
                     formData.rating === 4 ? 'Baik' : 
                     formData.rating === 3 ? 'Cukup' : 
                     formData.rating === 2 ? 'Kurang' : 'Sangat Kurang'}
                  </div>
                </div>

                {/* Komentar */}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Komentar *</label>
                  <textarea
                    value={formData.komentar}
                    onChange={(e) => setFormData({...formData, komentar: e.target.value})}
                    className="w-full px-3 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="6"
                    required
                    placeholder="Bagikan pengalaman dan masukan Anda tentang TPQ Asy-Syafii..."
                  />
                  <div className="mt-1 text-sm text-green-600">
                    {formData.komentar.length}/1000 karakter
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 font-medium"
                  >
                    {actionLoading ? 'Mengirim...' : 'Kirim Testimoni'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Testimoni */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Edit Testimoni</h3>
              <form onSubmit={handleUpdateTestimoni} className="space-y-6">
                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-3">Rating</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormData({...formData, rating: star})}
                        className="focus:outline-none transform hover:scale-110 transition-transform duration-200"
                      >
                        <svg
                          className={`w-10 h-10 ${star <= formData.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    Pilih {formData.rating} bintang - {formData.rating === 5 ? 'Sangat Baik' : 
                     formData.rating === 4 ? 'Baik' : 
                     formData.rating === 3 ? 'Cukup' : 
                     formData.rating === 2 ? 'Kurang' : 'Sangat Kurang'}
                  </div>
                </div>

                {/* Komentar */}
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-1">Komentar *</label>
                  <textarea
                    value={formData.komentar}
                    onChange={(e) => setFormData({...formData, komentar: e.target.value})}
                    className="w-full px-3 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="6"
                    required
                  />
                  <div className="mt-1 text-sm text-green-600">
                    {formData.komentar.length}/1000 karakter
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 font-medium"
                  >
                    {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notifikasi */}
      {showNotificationModal && (
        <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                notificationData.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {notificationData.type === 'success' ? (
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                )}
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${
                notificationData.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {notificationData.title}
              </h3>
              <p className="text-gray-600 mb-4">{notificationData.message}</p>
              <div className="flex space-x-3">
                {notificationData.onConfirm ? (
                  <>
                    <button
                      onClick={closeNotification}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                    >
                      Ya, Hapus
                    </button>
                    <button
                      onClick={() => setShowNotificationModal(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium"
                    >
                      Batal
                    </button>
                  </>
                ) : (
                  <button
                    onClick={closeNotification}
                    className={`w-full py-2 rounded-lg font-medium ${
                      notificationData.type === 'success' 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-red-600 text-white hover:bg-red-700'
                    } transition-colors duration-200`}
                  >
                    Tutup
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Komentar;