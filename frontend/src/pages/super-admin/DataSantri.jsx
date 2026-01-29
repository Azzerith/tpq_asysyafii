import React, { useState, useEffect, useRef } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const DataSantri = () => {
  const { user: currentUser } = useAuth();
  
  const [santri, setSantri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jenisKelaminFilter, setJenisKelaminFilter] = useState('all');

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // State untuk modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [waliSearchTerm, setWaliSearchTerm] = useState('');
const [filteredWaliOptions, setFilteredWaliOptions] = useState([]);
const [showWaliDropdown, setShowWaliDropdown] = useState(false);

  // State untuk alert
  const [alertMessage, setAlertMessage] = useState({
    title: '',
    message: '',
    type: 'success'
  });

  // State untuk form
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    jenis_kelamin: 'L',
    tempat_lahir: '',
    tanggal_lahir: '',
    alamat: '',
    foto: '',
    status: 'aktif',
    tanggal_masuk: new Date().toISOString().split('T')[0],
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
      admin: ['manage_santri', 'edit_santri', 'create_santri', 'delete_santri'],
      wali: ['view_santri', 'edit_own_santri']
    };

    return permissions[currentUser.role]?.includes(permission) || false;
  };

  // Show alert modal
  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  // Fetch santri dari API
  const fetchSantri = async () => {
    try {
      setLoading(true);
      setError('');
      
      let endpoint;
      if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin') {
        endpoint = '/api/super-admin/santri';
      } else {
        endpoint = '/api/santri/my';
      }
      
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
      
      const transformedSantri = Array.isArray(data) ? data : data.data || [];
      
      setSantri(transformedSantri.map(santri => ({
        id: santri.id_santri,
        nama: santri.nama_lengkap,
        jenisKelamin: santri.jenis_kelamin,
        tempatLahir: santri.tempat_lahir || '-',
        tanggalLahir: santri.tanggal_lahir,
        alamat: santri.alamat || '-',
        foto: santri.foto,
        status: santri.status,
        tanggalMasuk: santri.tanggal_masuk,
        tanggalKeluar: santri.tanggal_keluar,
        idWali: santri.id_wali,
        wali: santri.wali ? {
          nama: santri.wali.nama_lengkap,
          email: santri.wali.email,
          noTelp: santri.wali.no_telp
        } : null,
        dibuatPada: santri.dibuat_pada,
        diperbaruiPada: santri.diperbarui_pada
      })));

      setTotalItems(transformedSantri.length);

    } catch (err) {
      console.error('Error fetching santri:', err);
      setError(`Gagal memuat data santri: ${err.message}`);
      setSantri([]);
    } finally {
      setLoading(false);
    }
  };
  const DropdownWali = ({ 
    value, 
    onChange, 
    error, 
    name, 
    disabled = false,
    showDropdown,
    setShowDropdown,
    waliSearchTerm,
    setWaliSearchTerm,
    filteredWaliOptions,
    selectedSantri 
  }) => {
    const dropdownRef = useRef(null);
  
    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [setShowDropdown]);
  
    // Temukan wali yang terpilih
    const selectedWali = filteredWaliOptions.find(wali => wali.id_user === value);
  
    return (
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Wali Santri *
        </label>
        
        <div className="relative">
          {/* Input yang terlihat */}
          <div
            onClick={() => !disabled && setShowDropdown(!showDropdown)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer flex items-center justify-between ${
              error ? 'border-red-500' : 'border-gray-300'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
          >
            <div className="flex items-center gap-3">
              {selectedWali ? (
                <>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {selectedWali.nama_lengkap.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedWali.nama_lengkap}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedWali.email}
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-gray-500">Pilih Wali Santri</span>
              )}
            </div>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
  
          {/* Hidden input untuk form */}
          <input
            type="hidden"
            name={name}
            value={value || ''}
            onChange={onChange}
          />
  
          {/* Dropdown */}
          {showDropdown && !disabled && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
              {/* Search input */}
              <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    value={waliSearchTerm}
                    onChange={(e) => setWaliSearchTerm(e.target.value)}
                    placeholder="Cari wali berdasarkan nama atau email..."
                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    autoFocus
                  />
                  <svg 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
  
              {/* Wali list */}
              <div className="py-1">
                {filteredWaliOptions.length === 0 ? (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    {waliSearchTerm ? 'Tidak ditemukan wali yang sesuai' : 'Tidak ada data wali'}
                  </div>
                ) : (
                  filteredWaliOptions.map(wali => (
                    <button
                      key={wali.id_user}
                      type="button"
                      onClick={() => {
                        onChange({
                          target: {
                            name,
                            value: wali.id_user
                          }
                        });
                        setShowDropdown(false);
                        setWaliSearchTerm('');
                      }}
                      className={`w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                        value === wali.id_user ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-medium text-sm">
                          {wali.nama_lengkap.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {wali.nama_lengkap}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {wali.email}
                          {wali.no_telp && ` • ${wali.no_telp}`}
                        </div>
                      </div>
                      {value === wali.id_user && (
                        <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>
  
              {/* Tambah wali baru link (opsional) */}
              <div className="border-t border-gray-200 p-2">
                <Link
                  to="/dashboard/data-wali/tambah"
                  className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tambah Wali Baru
                </Link>
              </div>
            </div>
          )}
        </div>
  
        {error && (
          <p className="text-red-500 text-xs mt-1">{error}</p>
        )}
  
        {/* Tampilkan wali saat ini jika ada (untuk edit mode) */}
        {selectedSantri?.wali && value && !selectedWali && (
          <div className="mt-2 text-sm text-gray-500">
            Wali saat ini: <span className="font-medium">{selectedSantri.wali.nama} ({selectedSantri.wali.email})</span>
          </div>
        )}
      </div>
    );
  };

  const handleWaliSelect = (e) => {
    const { name, value } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
    
    // Clear error when user selects a wali
    if (formErrors[name]) {
      setFormErrors(prevErrors => ({
        ...prevErrors,
        [name]: ''
      }));
    }
    
    // Close dropdown setelah memilih
    setShowWaliDropdown(false);
    setWaliSearchTerm('');
  };

  // Fetch wali options untuk dropdown
  const fetchWaliOptions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/wali`, {
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

  useEffect(() => {
    if (waliSearchTerm.trim() === '') {
      setFilteredWaliOptions(waliOptions);
    } else {
      const filtered = waliOptions.filter(wali => 
        wali.nama_lengkap.toLowerCase().includes(waliSearchTerm.toLowerCase()) ||
        wali.email.toLowerCase().includes(waliSearchTerm.toLowerCase())
      );
      setFilteredWaliOptions(filtered);
    }
  }, [waliSearchTerm, waliOptions]);

  // Check if current user has permission to access this page
  useEffect(() => {
    if (!currentUser) return;

    if (!hasPermission('view_santri')) {
      setError('Anda tidak memiliki izin untuk mengakses halaman ini');
      return;
    }

    fetchSantri();
    
    // Hanya fetch wali options jika user adalah admin/super_admin
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
      fetchWaliOptions();
    }
  }, [currentUser]);

  // Filter santri
  const filteredSantri = santri.filter(item => {
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.wali?.nama && item.wali.nama.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesJenisKelamin = jenisKelaminFilter === 'all' || item.jenisKelamin === jenisKelaminFilter;
    
    return matchesSearch && matchesStatus && matchesJenisKelamin;
  });

  // Hitung total halaman
  const totalPages = Math.ceil(filteredSantri.length / itemsPerPage);
  
  // Dapatkan santri untuk halaman saat ini
  const paginatedSantri = filteredSantri.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Fungsi untuk mengubah halaman
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Fungsi untuk mengubah items per page
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset ke halaman pertama
  };

  // Komponen Pagination
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const maxVisiblePages = 5;
    
    const renderPageNumbers = () => {
      const pages = [];
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => onPageChange(i)}
            className={`px-3 py-1 rounded-lg transition-colors ${
              currentPage === i
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {i}
          </button>
        );
      }
      
      return pages;
    };
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Halaman {currentPage} dari {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(e.target.value)}
          >
            <option value="5">5 per halaman</option>
            <option value="10">10 per halaman</option>
            <option value="20">20 per halaman</option>
            <option value="50">50 per halaman</option>
          </select>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Sebelumnya
          </button>
          
          <div className="flex space-x-1">
            {renderPageNumbers()}
          </div>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            Selanjutnya
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  // Modal handlers
  const openDeleteModal = (santri) => {
    setSelectedSantri(santri);
    setShowDeleteModal(true);
  };

  const openStatusModal = (santri) => {
    setSelectedSantri(santri);
    setShowStatusModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      nama_lengkap: '',
      jenis_kelamin: 'L',
      tempat_lahir: '',
      tanggal_lahir: '',
      alamat: '',
      foto: '',
      status: 'aktif',
      tanggal_masuk: new Date().toISOString().split('T')[0],
      id_wali: currentUser?.role === 'wali' ? currentUser.id_user : ''
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (santri) => {
    setSelectedSantri(santri);
    setFormData({
      nama_lengkap: santri.nama,
      jenis_kelamin: santri.jenisKelamin,
      tempat_lahir: santri.tempatLahir,
      tanggal_lahir: santri.tanggalLahir ? new Date(santri.tanggalLahir).toISOString().split('T')[0] : '',
      alamat: santri.alamat,
      foto: santri.foto || '',
      status: santri.status,
      tanggal_masuk: santri.tanggalMasuk ? new Date(santri.tanggalMasuk).toISOString().split('T')[0] : '',
      id_wali: santri.idWali,
      tanggal_keluar: santri.tanggalKeluar ? new Date(santri.tanggalKeluar).toISOString().split('T')[0] : ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openViewModal = (santri) => {
    setSelectedSantri(santri);
    setShowViewModal(true);
  };

  const closeModals = () => {
    setShowDeleteModal(false);
    setShowStatusModal(false);
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowAlertModal(false);
    setSelectedSantri(null);
    setFormErrors({});
    setActionLoading(false);
    setShowWaliDropdown(false);
  setWaliSearchTerm(''); 
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

    if (!formData.nama_lengkap.trim()) {
      errors.nama_lengkap = 'Nama lengkap wajib diisi';
    }

    if (!formData.jenis_kelamin) {
      errors.jenis_kelamin = 'Jenis kelamin wajib dipilih';
    }

    if (!formData.tanggal_masuk) {
      errors.tanggal_masuk = 'Tanggal masuk wajib diisi';
    }

    if (currentUser?.role !== 'wali' && !formData.id_wali) {
      errors.id_wali = 'Wali santri wajib dipilih';
    }

    return errors;
  };

  // Handler untuk create santri
  const handleCreateSantri = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);

      const endpoint = currentUser?.role === 'wali' 
        ? '/api/santri' 
        : '/api/super-admin/santri';

      const requestData = {
        nama_lengkap: formData.nama_lengkap,
        jenis_kelamin: formData.jenis_kelamin,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir,
        alamat: formData.alamat,
        foto: formData.foto,
        status: formData.status,
        tanggal_masuk: formData.tanggal_masuk
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

      const newSantri = await response.json();
      
      // Add new santri to the list
      const transformedSantri = {
        id: newSantri.data?.id_santri || newSantri.id_santri,
        nama: newSantri.data?.nama_lengkap || newSantri.nama_lengkap,
        jenisKelamin: newSantri.data?.jenis_kelamin || newSantri.jenis_kelamin,
        tempatLahir: newSantri.data?.tempat_lahir || newSantri.tempat_lahir || '-',
        tanggalLahir: newSantri.data?.tanggal_lahir || newSantri.tanggal_lahir,
        alamat: newSantri.data?.alamat || newSantri.alamat || '-',
        foto: newSantri.data?.foto || newSantri.foto,
        status: newSantri.data?.status || newSantri.status,
        tanggalMasuk: newSantri.data?.tanggal_masuk || newSantri.tanggal_masuk,
        idWali: newSantri.data?.id_wali || newSantri.id_wali,
        wali: newSantri.data?.wali || newSantri.wali
      };

      setSantri(prev => [transformedSantri, ...prev]);
      closeModals();
      showAlert('Berhasil', `Santri ${formData.nama_lengkap} berhasil dibuat`, 'success');
      
    } catch (error) {
      console.error('Error creating santri:', error);
      showAlert('Gagal', `Gagal membuat santri: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk edit santri
  const handleEditSantri = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);

      const updateData = {
        nama_lengkap: formData.nama_lengkap,
        jenis_kelamin: formData.jenis_kelamin,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir,
        alamat: formData.alamat,
        foto: formData.foto,
        status: formData.status,
        tanggal_masuk: formData.tanggal_masuk,
        tanggal_keluar: formData.tanggal_keluar || null
      };

      if ((currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && formData.id_wali) {
        updateData.id_wali = formData.id_wali;
      }

      // Gunakan endpoint yang sesuai
      let endpoint;
      if (currentUser?.role === 'super_admin') {
        endpoint = `/api/super-admin/santri/${selectedSantri.id}`;
      } else {
        endpoint = `/api/santri/${selectedSantri.id}`;
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

      const updatedSantri = await response.json();

      // Ambil wali data untuk ditampilkan jika ada perubahan wali
      let newWaliData = null;
      if ((currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && 
          formData.id_wali && 
          formData.id_wali !== selectedSantri.idWali) {
        // Cari wali dari waliOptions
        const selectedWali = waliOptions.find(w => w.id_user === formData.id_wali);
        if (selectedWali) {
          newWaliData = {
            nama: selectedWali.nama_lengkap,
            email: selectedWali.email,
            noTelp: selectedWali.no_telp
          };
        }
      }

      // Update santri in the list
      setSantri(santri.map(item => {
        if (item.id === selectedSantri.id) {
          const updatedItem = {
            ...item,
            nama: formData.nama_lengkap,
            jenisKelamin: formData.jenis_kelamin,
            tempatLahir: formData.tempat_lahir,
            tanggalLahir: formData.tanggal_lahir,
            alamat: formData.alamat,
            foto: formData.foto,
            status: formData.status,
            tanggalMasuk: formData.tanggal_masuk,
            tanggalKeluar: formData.tanggal_keluar || null
          };
  
          // PERBAIKAN: Update wali jika ada perubahan
          if ((currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && 
              formData.id_wali) {
            updatedItem.idWali = formData.id_wali;
            updatedItem.wali = newWaliData || item.wali;
          }
  
          return updatedItem;
        }
        return item;
      }));
      
      closeModals();
      showAlert('Berhasil', `Santri ${formData.nama_lengkap} berhasil diupdate`, 'success');
      
    } catch (error) {
      console.error('Error updating santri:', error);
      showAlert('Gagal', `Gagal mengupdate santri: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk menghapus santri
  const handleDeleteSantri = async () => {
    if (!selectedSantri) return;

    try {
      setActionLoading(true);
      
      if (currentUser?.role !== 'super_admin') {
        throw new Error('Anda tidak memiliki izin untuk menghapus santri');
      }

      const response = await fetch(`${API_URL}/api/super-admin/santri/${selectedSantri.id}`, {
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

      setSantri(santri.filter(item => item.id !== selectedSantri.id));
      closeModals();
      showAlert('Berhasil', `Santri ${selectedSantri.nama} berhasil dihapus`, 'success');
      
    } catch (error) {
      console.error('Error deleting santri:', error);
      showAlert('Gagal', `Gagal menghapus santri: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk mengubah status santri
  const handleToggleStatus = async () => {
    if (!selectedSantri) return;

    try {
      setActionLoading(true);
      
      // Tentukan status baru berdasarkan status saat ini
      let newStatus;
      switch (selectedSantri.status) {
        case 'aktif':
          newStatus = 'lulus'; // Default ke lulus ketika mengubah dari aktif
          break;
        case 'lulus':
        case 'pindah':
        case 'berhenti':
          newStatus = 'aktif';
          break;
        default:
          newStatus = 'aktif';
      }
      
      const response = await fetch(`${API_URL}/api/super-admin/santri/${selectedSantri.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          tanggal_keluar: newStatus !== 'aktif' ? new Date().toISOString().split('T')[0] : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      setSantri(santri.map(item => 
        item.id === selectedSantri.id 
          ? { 
              ...item, 
              status: newStatus,
              tanggalKeluar: newStatus !== 'aktif' ? new Date().toISOString().split('T')[0] : null
            }
          : item
      ));
      
      closeModals();
      showAlert('Berhasil', `Status santri ${selectedSantri.nama} berhasil diubah menjadi ${getStatusLabel(newStatus)}`, 'success');
      
    } catch (error) {
      console.error('Error updating santri status:', error);
      showAlert('Gagal', `Gagal mengubah status santri: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Fungsi untuk mendapatkan label status
  const getStatusLabel = (status) => {
    const statusLabels = {
      'aktif': 'Aktif',
      'lulus': 'Lulus',
      'pindah': 'Pindah',
      'berhenti': 'Berhenti'
    };
    return statusLabels[status] || status;
  };

  // Fungsi untuk mendapatkan warna status
  const getStatusColor = (status) => {
    const statusColors = {
      'aktif': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
      'lulus': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      'pindah': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      'berhenti': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
    };
    return statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
  };

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

  // Group santri by status untuk statistik
  const santriByStatus = {
    aktif: santri.filter(item => item.status === 'aktif'),
    lulus: santri.filter(item => item.status === 'lulus'),
    pindah: santri.filter(item => item.status === 'pindah'),
    berhenti: santri.filter(item => item.status === 'berhenti')
  };

  // Reset halaman saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, jenisKelaminFilter]);

  if (loading) {
    return (
      <AuthDashboardLayout title="Data Santri">
        <div className="p-0">
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

  if (error && !hasPermission('view_santri')) {
    return (
      <AuthDashboardLayout title="Data Santri">
        <div className="p-0">
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
    <AuthDashboardLayout title="Data Santri">
      <div className="p-0">  

        {/* Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Santri Aktif</p>
                <p className="text-2xl font-bold text-gray-800">{santriByStatus.aktif.length}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Santri Lulus</p>
                <p className="text-2xl font-bold text-gray-800">{santriByStatus.lulus.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Laki-laki</p>
                <p className="text-2xl font-bold text-gray-800">
                  {santri.filter(item => item.jenisKelamin === 'L').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-medium">♂</span>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Perempuan</p>
                <p className="text-2xl font-bold text-gray-800">
                  {santri.filter(item => item.jenisKelamin === 'P').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-medium">♀</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter dan Search Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Cari berdasarkan nama santri atau wali..."
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
              <option value="lulus">Lulus</option>
              <option value="pindah">Pindah</option>
              <option value="berhenti">Berhenti</option>
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={jenisKelaminFilter}
              onChange={(e) => setJenisKelaminFilter(e.target.value)}
            >
              <option value="all">Semua Jenis Kelamin</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
            <button 
              onClick={openCreateModal}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              disabled={!hasPermission('create_santri')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tambah Santri
            </button>
          </div>
        </div>

        {/* Tabel Santri */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Daftar Santri
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Menampilkan {Math.min(itemsPerPage, paginatedSantri.length)} dari {filteredSantri.length} santri
                </p>
              </div>
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {filteredSantri.length} Santri
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Santri
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wali
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jenis Kelamin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Masuk
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSantri.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <p className="mt-2">Tidak ada data santri</p>
                    </td>
                  </tr>
                ) : (
                  paginatedSantri.map((santri) => (
                    <SantriTableRow 
                      key={santri.id} 
                      santri={santri} 
                      onEdit={openEditModal}
                      onView={openViewModal}
                      onDelete={openDeleteModal}
                      onToggleStatus={openStatusModal}
                      hasPermission={hasPermission}
                      currentUser={currentUser}
                      formatDate={formatDate}
                      getStatusLabel={getStatusLabel}
                      getStatusColor={getStatusColor}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredSantri.length > itemsPerPage && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
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
              <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah Santri Baru</h3>
              <form onSubmit={handleCreateSantri}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      name="nama_lengkap"
                      value={formData.nama_lengkap}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.nama_lengkap ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan nama lengkap santri"
                      required
                    />
                    {formErrors.nama_lengkap && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.nama_lengkap}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Kelamin *
                    </label>
                    <select
                      name="jenis_kelamin"
                      value={formData.jenis_kelamin}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.jenis_kelamin ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                    {formErrors.jenis_kelamin && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.jenis_kelamin}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      name="tempat_lahir"
                      value={formData.tempat_lahir}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan tempat lahir"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      name="tanggal_lahir"
                      value={formData.tanggal_lahir}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat
                    </label>
                    <textarea
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan alamat lengkap"
                    />
                  </div>

                  {currentUser?.role !== 'wali' && (
                    <div className="md:col-span-2">
                      <DropdownWali
                        name="id_wali"
                        value={formData.id_wali}
                        onChange={handleWaliSelect}
                        error={formErrors.id_wali}
                        showDropdown={showWaliDropdown}
                        setShowDropdown={setShowWaliDropdown}
                        waliSearchTerm={waliSearchTerm}
                        setWaliSearchTerm={setWaliSearchTerm}
                        filteredWaliOptions={filteredWaliOptions}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="aktif">Aktif</option>
                      <option value="lulus">Lulus</option>
                      <option value="pindah">Pindah</option>
                      <option value="berhenti">Berhenti</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Masuk *
                    </label>
                    <input
                      type="date"
                      name="tanggal_masuk"
                      value={formData.tanggal_masuk}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.tanggal_masuk ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.tanggal_masuk && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.tanggal_masuk}</p>
                    )}
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
                    {actionLoading ? 'Membuat...' : 'Buat Santri'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {showEditModal && selectedSantri && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Santri</h3>
              <form onSubmit={handleEditSantri}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      name="nama_lengkap"
                      value={formData.nama_lengkap}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.nama_lengkap ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Masukkan nama lengkap santri"
                      required
                    />
                    {formErrors.nama_lengkap && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.nama_lengkap}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Kelamin *
                    </label>
                    <select
                      name="jenis_kelamin"
                      value={formData.jenis_kelamin}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.jenis_kelamin ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                    {formErrors.jenis_kelamin && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.jenis_kelamin}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      name="tempat_lahir"
                      value={formData.tempat_lahir}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan tempat lahir"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      name="tanggal_lahir"
                      value={formData.tanggal_lahir}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat
                    </label>
                    <textarea
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan alamat lengkap"
                    />
                  </div>
                  {currentUser?.role !== 'wali' && (
                    <div className="md:col-span-2">
                      <DropdownWali
                        name="id_wali"
                        value={formData.id_wali}
                        onChange={handleWaliSelect}
                        error={formErrors.id_wali}
                        showDropdown={showWaliDropdown}
                        setShowDropdown={setShowWaliDropdown}
                        waliSearchTerm={waliSearchTerm}
                        setWaliSearchTerm={setWaliSearchTerm}
                        filteredWaliOptions={filteredWaliOptions}
                        selectedSantri={selectedSantri}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="aktif">Aktif</option>
                      <option value="lulus">Lulus</option>
                      <option value="pindah">Pindah</option>
                      <option value="berhenti">Berhenti</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal Masuk *
                    </label>
                    <input
                      type="date"
                      name="tanggal_masuk"
                      value={formData.tanggal_masuk}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        formErrors.tanggal_masuk ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {formErrors.tanggal_masuk && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.tanggal_masuk}</p>
                    )}
                  </div>

                  {formData.status !== 'aktif' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Keluar
                      </label>
                      <input
                        type="date"
                        name="tanggal_keluar"
                        value={formData.tanggal_keluar}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  )}
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
        {showDeleteModal && selectedSantri && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus Santri</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus santri <strong>"{selectedSantri.nama}"</strong>?
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
                  onClick={handleDeleteSantri}
                  disabled={actionLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATUS MODAL */}
        {showStatusModal && selectedSantri && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Ubah Status Santri
              </h3>
              <p className="text-gray-600 mb-4">
                Ubah status santri <strong>"{selectedSantri.nama}"</strong> dari{' '}
                <span className={`font-medium ${getStatusColor(selectedSantri.status).text}`}>
                  {getStatusLabel(selectedSantri.status)}
                </span> menjadi:
              </p>
              
              <div className="space-y-2 mb-6">
                {['aktif', 'lulus', 'pindah', 'berhenti']
                  .filter(status => status !== selectedSantri.status)
                  .map(status => (
                    <button
                      key={status}
                      onClick={async () => {
                        try {
                          setActionLoading(true);
                          
                          const response = await fetch(`${API_URL}/api/super-admin/santri/${selectedSantri.id}/status`, {
                            method: 'PUT',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('token')}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              status: status,
                              tanggal_keluar: status !== 'aktif' ? new Date().toISOString().split('T')[0] : null
                            })
                          });

                          if (!response.ok) {
                            const errorData = await response.json().catch(() => null);
                            throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
                          }

                          setSantri(santri.map(item => 
                            item.id === selectedSantri.id 
                              ? { 
                                  ...item, 
                                  status: status,
                                  tanggalKeluar: status !== 'aktif' ? new Date().toISOString().split('T')[0] : null
                                }
                              : item
                          ));
                          
                          closeModals();
                          showAlert('Berhasil', `Status santri ${selectedSantri.nama} berhasil diubah menjadi ${getStatusLabel(status)}`, 'success');
                          
                        } catch (error) {
                          console.error('Error updating santri status:', error);
                          showAlert('Gagal', `Gagal mengubah status santri: ${error.message}`, 'error');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                        getStatusColor(status).bg
                      } ${getStatusColor(status).border} ${getStatusColor(status).text} hover:opacity-80 disabled:opacity-50`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {showViewModal && selectedSantri && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Detail Santri</h3>
                <button
                  onClick={closeModals}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Nama Lengkap</span>
                  <span className="text-sm text-gray-900">{selectedSantri.nama}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Jenis Kelamin</span>
                  <span className="text-sm text-gray-900">
                    {selectedSantri.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Tempat Lahir</span>
                  <span className="text-sm text-gray-900">{selectedSantri.tempatLahir}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Tanggal Lahir</span>
                  <span className="text-sm text-gray-900">{formatDate(selectedSantri.tanggalLahir)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Alamat</span>
                  <span className="text-sm text-gray-900">{selectedSantri.alamat}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`text-sm font-medium ${getStatusColor(selectedSantri.status).text}`}>
                    {getStatusLabel(selectedSantri.status)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Tanggal Masuk</span>
                  <span className="text-sm text-gray-900">{formatDate(selectedSantri.tanggalMasuk)}</span>
                </div>
                {selectedSantri.tanggalKeluar && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">Tanggal Keluar</span>
                    <span className="text-sm text-gray-900">{formatDate(selectedSantri.tanggalKeluar)}</span>
                  </div>
                )}
                {selectedSantri.wali && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-500">Nama Wali</span>
                      <span className="text-sm text-gray-900">{selectedSantri.wali.nama}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm font-medium text-gray-500">Email Wali</span>
                      <span className="text-sm text-gray-900">{selectedSantri.wali.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-gray-500">Telepon Wali</span>
                      <span className="text-sm text-gray-900">{selectedSantri.wali.noTelp}</span>
                    </div>
                  </>
                )}
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

// Komponen terpisah untuk table row santri
const SantriTableRow = React.memo(({ santri, onEdit, onView, onDelete, onToggleStatus, hasPermission, currentUser, formatDate, getStatusLabel, getStatusColor }) => {
  const statusColor = getStatusColor(santri.status);
  
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {santri.nama.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="ml-4">
            <button 
              onClick={() => onView(santri)}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
            >
              {santri.nama}
            </button>
            <div className="text-xs text-gray-400">ID: {santri.id}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {santri.wali ? (
          <div>
            <div className="text-sm text-gray-900">{santri.wali.nama}</div>
            <div className="text-xs text-gray-500">{santri.wali.email}</div>
          </div>
        ) : (
          <span className="text-sm text-gray-500">-</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {santri.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => hasPermission('edit_santri') && onToggleStatus(santri)}
          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
            statusColor.bg
          } ${statusColor.text} ${statusColor.border} ${
            hasPermission('edit_santri') ? 'hover:opacity-80 cursor-pointer' : 'cursor-not-allowed opacity-50'
          }`}
          disabled={!hasPermission('edit_santri')}
          title={!hasPermission('edit_santri') ? "Tidak memiliki izin" : "Klik untuk mengubah status"}
        >
          {getStatusLabel(santri.status)}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(santri.tanggalMasuk)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onEdit(santri)}
            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit Santri"
            disabled={!hasPermission('edit_santri')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          {hasPermission('delete_santri') && currentUser?.role === 'super_admin' && (
            <button 
              onClick={() => onDelete(santri)}
              className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors"
              title="Hapus Santri"
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

export default DataSantri;