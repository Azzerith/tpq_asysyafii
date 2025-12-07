import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // State untuk modal - SEDERHANAKAN seperti di DataDonasi
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [santriData, setSantriData] = useState({});

  // State untuk alert
  const [alertMessage, setAlertMessage] = useState({
    title: '',
    message: '',
    type: 'success'
  });

  // State untuk form
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    no_telp: '',
    role: 'wali',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Function hasPermission - BUAT SIMPLE
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    if (currentUser.role === 'super_admin' || currentUser.role === 'admin') {
      return true;
    }
    
    const permissions = {
      admin: ['manage_users', 'edit_user', 'create_user', 'delete_user'],
      user: []
    };

    return permissions[currentUser.role]?.includes(permission) || false;
  };

  // Show alert modal - SIMPLE
  const showAlert = (title, message, type = 'success') => {
    setAlertMessage({ title, message, type });
    setShowAlertModal(true);
  };

  // Fetch users dari API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const endpoint = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' 
        ? '/api/admin/users' 
        : '/api/users';
      
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
      
      const transformedUsers = data.map(user => ({
        id: user.id_user,
        nama: user.nama_lengkap,
        email: user.email || '-',
        role: user.role,
        status: user.status_aktif ? 'Aktif' : 'Nonaktif',
        tanggalDaftar: user.dibuat_pada,
        lastLogin: user.last_login || '-',
        statusAktif: user.status_aktif,
        no_telp: user.no_telp || '-'
      }));
      
      setUsers(transformedUsers);
      fetchSantriForUsers(transformedUsers);

    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Gagal memuat data pengguna: ${err.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data santri untuk setiap user (wali)
const fetchSantriForUsers = async (users) => {
  try {
    const waliUsers = users.filter(user => user.role === 'wali');
    const santriMap = {};
    
    console.log('Fetching santri for wali users:', waliUsers.map(u => ({ id: u.id, name: u.nama })));
    
    // Cek role current user
    if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'admin')) {
      console.log('User tidak memiliki akses untuk melihat santri wali lain');
      return;
    }
    
    // Untuk setiap wali, fetch data santrinya menggunakan endpoint baru
    for (const user of waliUsers) {
      try {
        // Gunakan endpoint baru untuk super admin
        const endpoint = `/api/super-admin/santri/by-wali/${user.id}`;
        console.log(`Fetching santri for user ${user.id} from endpoint: ${endpoint}`);
        
        const response = await fetch(`${API_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`Response status for user ${user.id}:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Response data for user ${user.id}:`, data);
          
          // Handle response format
          let santriList = [];
          
          if (Array.isArray(data.data)) {
            santriList = data.data;
          } else if (Array.isArray(data)) {
            santriList = data;
          } else if (data.data && typeof data.data === 'object') {
            // Jika single object, wrap in array
            santriList = [data.data];
          } else if (data.santri) {
            santriList = data.santri;
          }
          
          console.log(`Parsed santri list for user ${user.id}:`, santriList.length, 'items');
          
          santriMap[user.id] = santriList.map(santri => ({
            id: santri.id_santri || santri.id || santri.IDSantri,
            nama: santri.nama_lengkap || santri.nama || santri.NamaLengkap,
            status: santri.status || santri.Status || 'aktif',
            jenisKelamin: santri.jenis_kelamin || santri.jenisKelamin || santri.JenisKelamin,
            tanggalMasuk: santri.tanggal_masuk || santri.tanggalMasuk || santri.TanggalMasuk,
            tempatLahir: santri.tempat_lahir || santri.tempatLahir || santri.TempatLahir,
            alamat: santri.alamat || santri.Alamat
          }));
        } else {
          const errorText = await response.text();
          console.warn(`Failed to fetch santri for user ${user.id}:`, response.status, errorText);
          santriMap[user.id] = [];
        }
      } catch (err) {
        console.error(`Error fetching santri for user ${user.id}:`, err);
        santriMap[user.id] = [];
      }
    }
    
    console.log('Final santri data:', santriMap);
    setSantriData(santriMap);
  } catch (err) {
    console.error('Error in fetchSantriForUsers:', err);
  }
};

  // Check if current user has permission to access this page
  useEffect(() => {
    if (!currentUser) return;

    if (!hasPermission('manage_users')) {
      setError('Anda tidak memiliki izin untuk mengakses halaman ini');
      return;
    }

    fetchUsers();
  }, [currentUser]); // HAPUS dependency yang tidak perlu

  // Modal handlers - BUAT SIMPLE seperti di DataDonasi
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openStatusModal = (user) => {
    setSelectedUser(user);
    setShowStatusModal(true);
  };

  const openCreateModal = () => {
    setFormData({
      nama_lengkap: '',
      email: '',
      no_telp: '',
      role: 'wali',
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      nama_lengkap: user.nama,
      email: user.email,
      no_telp: user.no_telp,
      role: user.role,
      password: '',
      confirmPassword: ''
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const closeModals = () => {
    setShowDeleteModal(false);
    setShowStatusModal(false);
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setShowAlertModal(false);
    setSelectedUser(null);
    setFormErrors({});
    setActionLoading(false);
  };

  // Handler untuk form input changes - INI YANG PERLU DIPERBAIKI
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // GUNAKAN FUNCTION UPDATE untuk menghindari stale state
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

  // Handler untuk menghapus user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      
      if (currentUser?.role !== 'super_admin') {
        throw new Error('Anda tidak memiliki izin untuk menghapus user');
      }

      const response = await fetch(`${API_URL}/api/super-admin/users/${selectedUser.id}`, {
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

      setUsers(users.filter(user => user.id !== selectedUser.id));
      setSantriData(prev => {
        const newData = { ...prev };
        delete newData[selectedUser.id];
        return newData;
      });
      closeModals();
      showAlert('Berhasil', `User ${selectedUser.nama} berhasil dihapus`, 'success');
      
    } catch (error) {
      console.error('Error deleting user:', error);
      showAlert('Gagal', `Gagal menghapus user: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Validasi form

  const validateForm = (isEdit = false) => {
    const errors = {};

    if (!formData.nama_lengkap.trim()) {
      errors.nama_lengkap = 'Nama lengkap wajib diisi';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Format email tidak valid';
    }

    if (!formData.no_telp.trim()) {
      errors.no_telp = 'Nomor telepon wajib diisi';
    }

    if (!isEdit) {
      if (!formData.password) {
        errors.password = 'Password wajib diisi';
      } else if (formData.password.length < 6) {
        errors.password = 'Password minimal 6 karakter';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Konfirmasi password tidak cocok';
      }
    }

    return errors;
  };

  // Handler untuk create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    const errors = validateForm(false);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);

      // Gunakan endpoint yang sesuai
      const endpoint = currentUser?.role === 'super_admin' 
        ? '/api/super-admin/users' 
        : '/api/admin/users';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nama_lengkap: formData.nama_lengkap,
          email: formData.email,
          no_telp: formData.no_telp,
          role: formData.role,
          password: formData.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const newUser = await response.json();
      
      // Add new user to the list
      const transformedUser = {
        id: newUser.user?.id_user || newUser.id_user,
        nama: newUser.user?.nama_lengkap || newUser.nama_lengkap,
        email: newUser.user?.email || newUser.email || '-',
        role: newUser.user?.role || newUser.role,
        status: (newUser.user?.status_aktif || newUser.status_aktif) ? 'Aktif' : 'Nonaktif',
        tanggalDaftar: newUser.user?.dibuat_pada || newUser.dibuat_pada,
        lastLogin: newUser.user?.last_login || newUser.last_login || '-',
        statusAktif: newUser.user?.status_aktif || newUser.status_aktif,
        no_telp: newUser.user?.no_telp || newUser.no_telp || '-'
      };

      setUsers(prev => [transformedUser, ...prev]);
      closeModals();
      showAlert('Berhasil', `User ${formData.nama_lengkap} berhasil dibuat`, 'success');
      
    } catch (error) {
      console.error('Error creating user:', error);
      showAlert('Gagal', `Gagal membuat user: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      
      const newStatus = !selectedUser.statusAktif;
      
      // Gunakan endpoint yang sesuai berdasarkan role current user
      let endpoint;
      if (currentUser?.role === 'super_admin') {
        endpoint = `/api/super-admin/users/${selectedUser.id}`;
      } else {
        endpoint = `/api/admin/users/${selectedUser.id}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status_aktif: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { 
              ...user, 
              status: newStatus ? 'Aktif' : 'Nonaktif',
              statusAktif: newStatus
            }
          : user
      ));
      
      closeModals();
      showAlert('Berhasil', `Status user ${selectedUser.nama} berhasil diubah`, 'success');
      
    } catch (error) {
      console.error('Error updating user status:', error);
      showAlert('Gagal', `Gagal mengubah status user: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handler untuk edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    const errors = validateForm(true);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);

      const updateData = {
        nama_lengkap: formData.nama_lengkap,
        email: formData.email,
        no_telp: formData.no_telp,
        role: formData.role
      };

      // Only include password if provided
      if (formData.password) {
        if (formData.password.length < 6) {
          setFormErrors(prev => ({...prev, password: 'Password minimal 6 karakter'}));
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setFormErrors(prev => ({...prev, confirmPassword: 'Konfirmasi password tidak cocok'}));
          return;
        }
        updateData.password = formData.password;
      }

      // Gunakan endpoint yang sesuai berdasarkan role current user
      let endpoint;
      if (currentUser?.role === 'super_admin') {
        endpoint = `/api/super-admin/users/${selectedUser.id}`;
      } else {
        endpoint = `/api/admin/users/${selectedUser.id}`;
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

      const updatedUser = await response.json();

      // Update user in the list
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { 
              ...user, 
              nama: updatedUser.user?.nama_lengkap || updatedUser.nama_lengkap || formData.nama_lengkap,
              email: updatedUser.user?.email || updatedUser.email || formData.email,
              no_telp: updatedUser.user?.no_telp || updatedUser.no_telp || formData.no_telp,
              role: updatedUser.user?.role || updatedUser.role || formData.role
            }
          : user
      ));
      
      closeModals();
      showAlert('Berhasil', `User ${formData.nama_lengkap} berhasil diupdate`, 'success');
      
    } catch (error) {
      console.error('Error updating user:', error);
      showAlert('Gagal', `Gagal mengupdate user: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Cek jika user saat ini
  const isCurrentUser = (userId) => {
    return currentUser && currentUser.id_user === userId;
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.no_telp.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group users by role
  const usersByRole = {
    wali: filteredUsers.filter(user => user.role === 'wali'),
    admin: filteredUsers.filter(user => user.role === 'admin'),
    super_admin: filteredUsers.filter(user => user.role === 'super_admin')
  };

  // Modal Components
  const DeleteModal = () => (
    <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Hapus User</h3>
            <p className="text-sm text-gray-600">Konfirmasi penghapusan user</p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">
            Apakah Anda yakin ingin menghapus user <strong>{selectedUser?.nama}</strong>?
          </p>
          <p className="text-red-600 text-xs mt-1">
            Tindakan ini tidak dapat dibatalkan. Semua data user akan dihapus permanen.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={closeModals}
            disabled={actionLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleDeleteUser}
            disabled={actionLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {actionLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menghapus...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const StatusModal = () => (
    <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center mb-4">
          <div className={`w-12 h-12 ${
            selectedUser?.statusAktif ? 'bg-red-100' : 'bg-green-100'
          } rounded-full flex items-center justify-center mr-4`}>
            <svg className={`w-6 h-6 ${
              selectedUser?.statusAktif ? 'text-red-600' : 'text-green-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedUser?.statusAktif ? 'Nonaktifkan User' : 'Aktifkan User'}
            </h3>
            <p className="text-sm text-gray-600">Konfirmasi perubahan status</p>
          </div>
        </div>
        
        <div className={`${
          selectedUser?.statusAktif ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        } border rounded-lg p-4 mb-4`}>
          <p className={`${
            selectedUser?.statusAktif ? 'text-red-800' : 'text-green-800'
          } text-sm`}>
            Apakah Anda yakin ingin {selectedUser?.statusAktif ? 'menonaktifkan' : 'mengaktifkan'} user{' '}
            <strong>{selectedUser?.nama}</strong>?
          </p>
          <p className={`${
            selectedUser?.statusAktif ? 'text-red-600' : 'text-green-600'
          } text-xs mt-1`}>
            {selectedUser?.statusAktif 
              ? 'User tidak akan bisa login sampai diaktifkan kembali.' 
              : 'User akan bisa login ke sistem kembali.'
            }
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={closeModals}
            disabled={actionLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`px-4 py-2 ${
              selectedUser?.statusAktif ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white rounded-lg disabled:opacity-50 flex items-center gap-2`}
          >
            {actionLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Memproses...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {selectedUser?.statusAktif ? 'Nonaktifkan' : 'Aktifkan'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const CreateModal = () => (
    <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Tambah User Baru</h3>
              <p className="text-sm text-gray-600">Isi data user baru</p>
            </div>
          </div>
          <button
            onClick={closeModals}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreateUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
              <input
                type="text"
                name="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.nama_lengkap ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan nama lengkap"
              />
              {formErrors.nama_lengkap && (
                <p className="text-red-500 text-xs mt-1">{formErrors.nama_lengkap}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan email"
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon *</label>
              <input
                type="tel"
                name="no_telp"
                value={formData.no_telp}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.no_telp ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan nomor telepon"
              />
              {formErrors.no_telp && (
                <p className="text-red-500 text-xs mt-1">{formErrors.no_telp}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="wali">Wali Santri</option>
                <option value="admin">Admin</option>
                {currentUser?.role === 'super_admin' && (
                  <option value="super_admin">Super Admin</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan password"
              />
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Konfirmasi password"
              />
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={closeModals}
              disabled={actionLoading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Membuat...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Buat User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const EditModal = () => (
    <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Edit User</h3>
              <p className="text-sm text-gray-600">Ubah data user {selectedUser?.nama}</p>
            </div>
          </div>
          <button
            onClick={closeModals}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleEditUser}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
              <input
                type="text"
                name="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.nama_lengkap ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan nama lengkap"
              />
              {formErrors.nama_lengkap && (
                <p className="text-red-500 text-xs mt-1">{formErrors.nama_lengkap}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan email"
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon *</label>
              <input
                type="tel"
                name="no_telp"
                value={formData.no_telp}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.no_telp ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Masukkan nomor telepon"
              />
              {formErrors.no_telp && (
                <p className="text-red-500 text-xs mt-1">{formErrors.no_telp}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="wali">Wali Santri</option>
                <option value="admin">Admin</option>
                {currentUser?.role === 'super_admin' && (
                  <option value="super_admin">Super Admin</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password Baru (Opsional)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Kosongkan jika tidak ingin mengubah"
              />
              {formErrors.password && (
                <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password Baru</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Konfirmasi password baru"
              />
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={closeModals}
              disabled={actionLoading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {actionLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const ViewModal = () => (
    <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <span className="text-blue-600 font-medium text-lg">
                {selectedUser?.nama.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Detail User</h3>
              <p className="text-sm text-gray-600">Informasi lengkap user</p>
            </div>
          </div>
          <button
            onClick={closeModals}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">Nama Lengkap</span>
            <span className="text-sm text-gray-900">{selectedUser?.nama}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">Email</span>
            <span className="text-sm text-gray-900">{selectedUser?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">Nomor Telepon</span>
            <span className="text-sm text-gray-900">{selectedUser?.no_telp}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">Role</span>
            <span className="text-sm text-gray-900 capitalize">{selectedUser?.role}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">Status</span>
            <span className={`text-sm font-medium ${
              selectedUser?.status === 'Aktif' ? 'text-green-600' : 'text-red-600'
            }`}>
              {selectedUser?.status}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-500">Tanggal Daftar</span>
            <span className="text-sm text-gray-900">{formatDate(selectedUser?.tanggalDaftar)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-gray-500">Terakhir Login</span>
            <span className="text-sm text-gray-900">
              {selectedUser?.lastLogin === '-' ? '-' : formatDate(selectedUser?.lastLogin)}
            </span>
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
  );

  const AlertModal = () => (
    <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
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
  );

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

  if (error && !hasPermission('manage_users')) {
    return (
      <AuthDashboardLayout>
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
    <AuthDashboardLayout title={'Manajemen User'}>
      <div className="p-6">

        

        {/* Filter dan Search Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-3">
              <input
                type="text"
                placeholder="Cari berdasarkan nama, email, atau telepon..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border md:col-span-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
            <button 
            onClick={openCreateModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            disabled={!hasPermission('create_user')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah User
          </button>
          </div>
        </div>

        {/* Tabel Terpisah */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Tabel Wali - Lebih Luas */}
          <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-900">
        Data Wali Santri
      </h2>
      <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
        {usersByRole.wali.length} User
      </span>
    </div>
  </div>
  
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            User
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Data Santri
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Status User
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Tanggal Daftar
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Aksi
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
                    {usersByRole.wali.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <p className="mt-2">Tidak ada data wali</p>
                        </td>
                      </tr>
                    ) : (
                      usersByRole.wali.map((user) => (
                        <UserTableRow 
                          key={user.id} 
                          user={user} 
                          onEdit={openEditModal}
                          onView={openViewModal}
                          onDelete={openDeleteModal}
                          onToggleStatus={openStatusModal}
                          isCurrentUser={isCurrentUser(user.id)}
                          hasPermission={hasPermission}
                          currentUser={currentUser}
                          santriData={santriData}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tabel Admin & Super Admin - Sisi Kanan */}
          <div className="space-y-6">
            {/* Tabel Super Admin */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-purple-900">
                    Super Admin
                  </h2>
                  <span className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                    {usersByRole.super_admin.length} User
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersByRole.super_admin.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="px-6 py-8 text-center text-gray-500">
                          <p className="text-sm">Tidak ada super admin</p>
                        </td>
                      </tr>
                    ) : (
                      usersByRole.super_admin.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-purple-600 text-xs font-medium">
                                  {user.nama.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.nama}
                                  {isCurrentUser(user.id) && (
                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">Anda</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => openEditModal(user)}
                                className="text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50"
                                title="Edit User"
                                disabled={!hasPermission('edit_user')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
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

            {/* Tabel Admin */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-blue-900">
                    Admin
                  </h2>
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    {usersByRole.admin.length} User
                  </span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {usersByRole.admin.length === 0 ? (
                      <tr>
                        <td colSpan="2" className="px-6 py-8 text-center text-gray-500">
                          <p className="text-sm">Tidak ada admin</p>
                        </td>
                      </tr>
                    ) : (
                      usersByRole.admin.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-xs font-medium">
                                  {user.nama.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.nama}
                                  {isCurrentUser(user.id) && (
                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">Anda</span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => openEditModal(user)}
                                className="text-blue-600 hover:text-blue-900 transition-colors disabled:opacity-50"
                                title="Edit User"
                                disabled={!hasPermission('edit_user')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => openStatusModal(user)}
                                className="text-green-600 hover:text-green-900 transition-colors disabled:opacity-50"
                                title="Ubah Status"
                                disabled={isCurrentUser(user.id)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
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

        {showCreateModal && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Tambah User Baru</h3>
              <form onSubmit={handleCreateUser}>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Telepon *
                    </label>
                    <input
                      type="tel"
                      name="no_telp"
                      value={formData.no_telp}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan nomor telepon"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="wali">Wali Santri</option>
                      <option value="admin">Admin</option>
                      {currentUser?.role === 'super_admin' && (
                        <option value="super_admin">Super Admin</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Konfirmasi Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Konfirmasi password"
                      required
                    />
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
                    {loading ? 'Membuat...' : 'Buat User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT MODAL - SEPERTI DI DATADONASI */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Edit User</h3>
              <form onSubmit={handleEditUser}>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor Telepon *
                    </label>
                    <input
                      type="tel"
                      name="no_telp"
                      value={formData.no_telp}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Masukkan nomor telepon"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="wali">Wali Santri</option>
                      <option value="admin">Admin</option>
                      {currentUser?.role === 'super_admin' && (
                        <option value="super_admin">Super Admin</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password Baru (Opsional)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Kosongkan jika tidak ingin mengubah"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Konfirmasi password baru"
                    />
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
                    {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE MODAL - SEPERTI DI DATADONASI */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Hapus User</h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin menghapus user <strong>"{selectedUser.nama}"</strong>?
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
                  onClick={handleDeleteUser}
                  disabled={loading}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STATUS MODAL - SEPERTI DI DATADONASI */}
        {showStatusModal && selectedUser && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {selectedUser.statusAktif ? 'Nonaktifkan User' : 'Aktifkan User'}
              </h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin {selectedUser.statusAktif ? 'menonaktifkan' : 'mengaktifkan'} user{' '}
                <strong>"{selectedUser.nama}"</strong>?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleToggleStatus}
                  disabled={loading}
                  className={`px-4 py-2 ${
                    selectedUser.statusAktif ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  } text-white rounded-lg disabled:opacity-50`}
                >
                  {loading ? 'Memproses...' : (selectedUser.statusAktif ? 'Nonaktifkan' : 'Aktifkan')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODAL - SEPERTI DI DATADONASI */}
        {showViewModal && selectedUser && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Detail User</h3>
                <button
                  onClick={() => setShowViewModal(false)}
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
                  <span className="text-sm text-gray-900">{selectedUser.nama}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Email</span>
                  <span className="text-sm text-gray-900">{selectedUser.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Nomor Telepon</span>
                  <span className="text-sm text-gray-900">{selectedUser.no_telp}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Role</span>
                  <span className="text-sm text-gray-900 capitalize">{selectedUser.role}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  <span className={`text-sm font-medium ${
                    selectedUser.status === 'Aktif' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Tanggal Daftar</span>
                  <span className="text-sm text-gray-900">{formatDate(selectedUser.tanggalDaftar)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-500">Terakhir Login</span>
                  <span className="text-sm text-gray-900">
                    {selectedUser.lastLogin === '-' ? '-' : formatDate(selectedUser.lastLogin)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>
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
// Fungsi untuk mendapatkan label status santri
const getStatusLabel = (status) => {
  const statusLabels = {
    'aktif': 'Aktif',
    'lulus': 'Lulus',
    'pindah': 'Pindah',
    'berhenti': 'Berhenti'
  };
  return statusLabels[status] || status;
};

// Fungsi untuk mendapatkan warna status santri
const getStatusColor = (status) => {
  const statusColors = {
    'aktif': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    'lulus': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
    'pindah': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    'berhenti': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
  };
  return statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
};
// Komponen UserTableRow yang diperbarui dengan data santri
const UserTableRow = React.memo(({ user, onEdit, onView, onDelete, onToggleStatus, isCurrentUser, hasPermission, currentUser,santriData }) => {
  const userSantri = santriData[user.id] || user.santriList || [];
  const statusColor = getStatusColor;
  
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium">
              {user.nama.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="ml-4">
            <button 
              onClick={() => onView(user)}
              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left"
            >
              {user.nama}
              {isCurrentUser && (
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Anda</span>
              )}
            </button>
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="text-xs text-gray-400">ID: {user.id} • Telp: {user.no_telp}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {/* Kolom Data Santri */}
        {user.role === 'wali' ? (
          <div className="space-y-2">
            {userSantri.length === 0 ? (
              <div className="text-sm text-gray-500 italic">Tidak ada santri</div>
            ) : (
              userSantri.map((santri, index) => (
                <div key={santri.id || index} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{santri.nama}</div>
                    <div className="text-xs text-gray-500">
                      {santri.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • 
                      Masuk: {formatDate(santri.tanggalMasuk)}
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    getStatusColor(santri.status).bg
                  } ${getStatusColor(santri.status).text} ${getStatusColor(santri.status).border}`}>
                    {getStatusLabel(santri.status)}
                  </span>
                </div>
              ))
            )}
            {userSantri.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Total: {userSantri.length} santri
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">Bukan wali santri</div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => !isCurrentUser && onToggleStatus(user)}
          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
            user.status === 'Aktif' 
              ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200'
          } ${
            isCurrentUser ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
          disabled={isCurrentUser}
          title={isCurrentUser ? "Tidak dapat mengubah status sendiri" : "Klik untuk mengubah status"}
        >
          {user.status}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {formatDate(user.tanggalDaftar)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onEdit(user)}
            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit User"
            disabled={!hasPermission('edit_user')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button 
            onClick={() => !isCurrentUser && onDelete(user)}
            className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={isCurrentUser ? "Tidak dapat menghapus akun sendiri" : "Hapus User"}
            disabled={isCurrentUser || !hasPermission('delete_user') || currentUser?.role !== 'super_admin'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus
          </button>
        </div>
      </td>
    </tr>
  );
});

export default UserManagement;