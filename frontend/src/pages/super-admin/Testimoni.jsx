import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const TestimoniManagement = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  // State untuk modal
  const [showShowModal, setShowShowModal] = useState(false);
  const [showHideModal, setShowHideModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '', type: '' });
  const [selectedTestimoni, setSelectedTestimoni] = useState(null);
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Function hasPermission lokal
  const hasPermission = () => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || currentUser.role === 'super_admin';
  };

  // Fetch testimonials dari API
  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = '/api/super-admin/testimoni';
      
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
      setTestimonials(data.data || []);

    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError(`Gagal memuat data testimoni: ${err.message}`);
      setTestimonials([]);
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

    fetchTestimonials();
  }, [currentUser, navigate]);

  // Show alert modal
  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  // Modal handlers
  const openShowModal = (testimoni) => {
    setSelectedTestimoni(testimoni);
    setShowShowModal(true);
  };

  const openHideModal = (testimoni) => {
    setSelectedTestimoni(testimoni);
    setShowHideModal(true);
  };

  const openDeleteModal = (testimoni) => {
    setSelectedTestimoni(testimoni);
    setShowDeleteModal(true);
  };

  // Handler untuk menampilkan testimoni
  const handleShowTestimoni = async () => {
    if (!selectedTestimoni) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/testimoni/${selectedTestimoni.id_testimoni}/show`, {
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

      // Update status testimoni di state
      setTestimonials(testimonials.map(item => 
        item.id_testimoni === selectedTestimoni.id_testimoni 
          ? { ...item, status: 'show' }
          : item
      ));
      
      setShowShowModal(false);
      setSelectedTestimoni(null);
      showAlert('Berhasil', 'Testimoni berhasil ditampilkan ke publik', 'success');
    } catch (error) {
      console.error('Error showing testimoni:', error);
      showAlert('Gagal', error.message || 'Gagal menampilkan testimoni', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk menyembunyikan testimoni
  const handleHideTestimoni = async () => {
    if (!selectedTestimoni) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/testimoni/${selectedTestimoni.id_testimoni}/hide`, {
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

      // Update status testimoni di state
      setTestimonials(testimonials.map(item => 
        item.id_testimoni === selectedTestimoni.id_testimoni 
          ? { ...item, status: 'hide' }
          : item
      ));
      
      setShowHideModal(false);
      setSelectedTestimoni(null);
      showAlert('Berhasil', 'Testimoni berhasil disembunyikan dari publik', 'success');
    } catch (error) {
      console.error('Error hiding testimoni:', error);
      showAlert('Gagal', error.message || 'Gagal menyembunyikan testimoni', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler untuk menghapus testimoni
  const handleDeleteTestimoni = async () => {
    if (!selectedTestimoni) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/api/super-admin/testimoni/${selectedTestimoni.id_testimoni}`, {
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

      setTestimonials(testimonials.filter(item => item.id_testimoni !== selectedTestimoni.id_testimoni));
      setShowDeleteModal(false);
      setSelectedTestimoni(null);
      showAlert('Berhasil', 'Testimoni berhasil dihapus', 'success');
    } catch (error) {
      console.error('Error deleting testimoni:', error);
      showAlert('Gagal', error.message || 'Gagal menghapus testimoni', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Render rating stars
  const renderStars = (rating) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
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

  // Format status
  const formatStatus = (status) => {
    const statusMap = {
      'show': 'Ditampilkan',
      'hide': 'Disembunyikan'
    };
    return statusMap[status] || status;
  };

  // Get status color
  const getStatusColor = (status) => {
    const colorMap = {
      'show': 'bg-green-100 text-green-800',
      'hide': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter testimonials
  const filteredTestimonials = testimonials.filter(item => {
    const matchesSearch = item.komentar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.wali?.nama_lengkap?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || item.rating.toString() === ratingFilter;
    
    return matchesSearch && matchesStatus && matchesRating;
  });

  // Statistik
  const getStats = () => {
    const totalTestimonials = testimonials.length;
    const showTestimonials = testimonials.filter(item => item.status === 'show').length;
    const hideTestimonials = testimonials.filter(item => item.status === 'hide').length;
    const averageRating = testimonials.length > 0 
      ? (testimonials.reduce((sum, item) => sum + item.rating, 0) / testimonials.length).toFixed(1)
      : 0;
    
    return { totalTestimonials, showTestimonials, hideTestimonials, averageRating };
  };

  const stats = getStats();

  // Icons untuk UI
  const icons = {
    show: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    hide: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    ),
    delete: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )
  };

  if (loading && testimonials.length === 0) {
    return (
      <AuthDashboardLayout>
        <div className="p-0">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </AuthDashboardLayout>
    );
  }

  if (error && testimonials.length === 0) {
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
              onClick={fetchTestimonials}
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
    <AuthDashboardLayout>
      <div className="p-0">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Testimoni</h1>
            <p className="text-gray-600 mt-1">Kelola testimoni dari orang tua santri</p>
          </div>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800">Total Testimoni</h3>
            <p className="text-3xl font-bold text-green-600">{stats.totalTestimonials}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-gray-800">Ditampilkan</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.showTestimonials}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-gray-500">
            <h3 className="text-lg font-semibold text-gray-800">Disembunyikan</h3>
            <p className="text-3xl font-bold text-gray-600">{stats.hideTestimonials}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h3 className="text-lg font-semibold text-gray-800">Rating Rata-rata</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.averageRating}</p>
          </div>
        </div>

        {/* Filter dan Search Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Cari berdasarkan komentar atau nama wali..."
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
              <option value="show">Ditampilkan</option>
              <option value="hide">Disembunyikan</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="all">Semua Rating</option>
              <option value="5">5 Bintang</option>
              <option value="4">4 Bintang</option>
              <option value="3">3 Bintang</option>
              <option value="2">2 Bintang</option>
              <option value="1">1 Bintang</option>
            </select>
          </div>
        </div>

        {/* Tabel Testimoni */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wali
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Komentar
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
                {filteredTestimonials.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <p className="mt-2">Tidak ada data testimoni</p>
                      {searchTerm || statusFilter !== 'all' || ratingFilter !== 'all' ? (
                        <button 
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('all');
                            setRatingFilter('all');
                          }}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Reset filter
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ) : (
                  filteredTestimonials.map((item) => (
                    <tr key={item.id_testimoni} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                            {item.wali?.nama_lengkap?.charAt(0) || 'W'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.wali?.nama_lengkap || 'Wali Santri'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.wali?.no_telp || '-'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {renderStars(item.rating)}
                          <span className="text-sm font-medium text-gray-900">
                            {item.rating}.0
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md line-clamp-3">
                          {item.komentar}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(item.dibuat_pada)}</div>
                        {item.diperbarui_pada && (
                          <div className="text-xs text-gray-400">
                            Diupdate: {formatDate(item.diperbarui_pada)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {formatStatus(item.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {item.status === 'hide' ? (
                            <button 
                              onClick={() => openShowModal(item)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1 transition-colors"
                              title="Tampilkan ke Publik"
                            >
                              {icons.show}
                              Tampilkan
                            </button>
                          ) : (
                            <button 
                              onClick={() => openHideModal(item)}
                              className="text-yellow-600 hover:text-yellow-900 flex items-center gap-1 transition-colors"
                              title="Sembunyikan dari Publik"
                            >
                              {icons.hide}
                              Sembunyikan
                            </button>
                          )}
                          {currentUser?.role === 'super_admin' && (
                            <button 
                              onClick={() => openDeleteModal(item)}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors"
                              title="Hapus Testimoni"
                            >
                              {icons.delete}
                              Hapus
                            </button>
                          )}
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

        {/* SHOW MODAL */}
        {showShowModal && selectedTestimoni && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Tampilkan Testimoni</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menampilkan testimoni dari <strong>"{selectedTestimoni.wali?.nama_lengkap}"</strong> ke publik?
                Testimoni akan terlihat di halaman depan website.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  {renderStars(selectedTestimoni.rating)}
                  <span className="text-sm font-medium">{selectedTestimoni.rating}.0</span>
                </div>
                <p className="text-sm text-gray-700 italic">"{selectedTestimoni.komentar}"</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleShowTestimoni}
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Tampilkan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HIDE MODAL */}
        {showHideModal && selectedTestimoni && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Sembunyikan Testimoni</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menyembunyikan testimoni dari <strong>"{selectedTestimoni.wali?.nama_lengkap}"</strong> dari publik?
                Testimoni tidak akan terlihat di halaman depan website.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  {renderStars(selectedTestimoni.rating)}
                  <span className="text-sm font-medium">{selectedTestimoni.rating}.0</span>
                </div>
                <p className="text-sm text-gray-700 italic">"{selectedTestimoni.komentar}"</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowHideModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleHideTestimoni}
                  disabled={loading}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Sembunyikan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {showDeleteModal && selectedTestimoni && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Testimoni</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus testimoni dari <strong>"{selectedTestimoni.wali?.nama_lengkap}"</strong>?
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  {renderStars(selectedTestimoni.rating)}
                  <span className="text-sm font-medium">{selectedTestimoni.rating}.0</span>
                </div>
                <p className="text-sm text-gray-700 italic">"{selectedTestimoni.komentar}"</p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteTestimoni}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menghapus...' : 'Hapus'}
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

export default TestimoniManagement;