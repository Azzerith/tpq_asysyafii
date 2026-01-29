import React, { useState, useEffect } from 'react';
import AuthDashboardLayout from '../../components/layout/AuthDashboardLayout';
import { useAuth } from '../../context/AuthContext';

const InformasiTPQ = () => {
  const { user } = useAuth();
  const [informasi, setInformasi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [error, setError] = useState('');

  // State untuk sosial media
  const [sosialMedia, setSosialMedia] = useState([]);
  const [loadingSosmed, setLoadingSosmed] = useState(false);
  const [showSosmedModal, setShowSosmedModal] = useState(false);
  const [editingSosmed, setEditingSosmed] = useState(null);
  const [sosmedForm, setSosmedForm] = useState({
    nama_sosmed: '',
    username: '',
    icon_sosmed: '',
    link_sosmed: ''
  });

  // State untuk modal alert
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertData, setAlertData] = useState({
    title: '',
    message: '',
    type: 'success'
  });

  // Konfigurasi Cloudinary
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET || 'tpq_upload';
const CLOUDINARY_API_KEY = import.meta.env.VITE_API_KEY;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const [isUploadingLogo, setIsUploadingLogo] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);

  const popularSocialMedia = [
    {
      name: 'Instagram',
      icon: 'instagram',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>'
    },
    {
      name: 'Facebook',
      icon: 'facebook',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>'
    },
    {
      name: 'YouTube',
      icon: 'youtube',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>'
    },
    {
      name: 'Twitter',
      icon: 'twitter',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>'
    },
    {
      name: 'TikTok',
      icon: 'tiktok',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/></svg>'
    },
    {
      name: 'WhatsApp',
      icon: 'whatsapp',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893-.001-3.189-1.262-6.209-3.553-8.485"/></svg>'
    },
    {
      name: 'Telegram',
      icon: 'telegram',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.140.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/></svg>'
    },
    {
      name: 'LinkedIn',
      icon: 'linkedin',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>'
    },
    {
      name: 'Website',
      icon: 'website',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1 16.947v-1.649h2v1.649c-.966.143-1.803.143-2 0zm4-1.229v1.416c0 .223-.181.404-.403.404-.107 0-.213-.043-.29-.118-.002-.001-1.307-1.323-1.307-1.323v-1.379h2zm-6 0v1.416c0 .223.181.404.403.404.107 0 .213-.043.29-.118.002-.001 1.307-1.323 1.307-1.323v-1.379h-2zm9.406-9.718l-3.997 3.999-3.997-3.999c-.391-.391-.391-1.024 0-1.414.391-.391 1.024-.391 1.414 0l2.583 2.584 2.583-2.584c.391-.391 1.024-.391 1.414 0 .391.39.391 1.023 0 1.414z"/></svg>'
    },
    {
      name: 'Email',
      icon: 'email',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12.713l-11.985-9.713h23.97l-11.985 9.713zm0 2.574l-12-9.725v15.438h24v-15.438l-12 9.725z"/></svg>'
    }
  ];

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  // Fungsi untuk menampilkan modal alert
  const showAlert = (title, message, type = 'success') => {
    setAlertData({
      title,
      message,
      type
    });
    setShowAlertModal(true);
  };

  // Fungsi untuk upload logo ke Cloudinary menggunakan fetch
const uploadLogoToCloudinary = async (file) => {
  setIsUploadingLogo(true);
  setUploadProgress(0);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'tpq');
    formData.append('tags', 'tpq,logo,website');
    
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `Upload gagal: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.secure_url) {
      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes
      };
    } else {
      throw new Error('Gagal mendapatkan URL gambar');
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Upload logo gagal: ${error.message}`);
  } finally {
    setIsUploadingLogo(false);
    setUploadProgress(0);
  }
};

// Fungsi untuk upload dengan progress tracking
const uploadLogoToCloudinaryWithProgress = async (file) => {
  setIsUploadingLogo(true);
  setUploadProgress(0);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'tpq');
    formData.append('tags', 'tpq,logo,website');
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentCompleted = Math.round((event.loaded * 100) / event.total);
        setUploadProgress(percentCompleted);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          if (result.secure_url) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
              bytes: result.bytes
            });
          } else {
            reject(new Error('Gagal mendapatkan URL gambar'));
          }
        } catch (error) {
          reject(new Error('Gagal parsing response'));
        }
      } else {
        reject(new Error(`Upload gagal: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload gagal: network error'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload dibatalkan'));
    });
    
    xhr.open('POST', CLOUDINARY_URL);
    xhr.send(formData);
  });
};

  // Fungsi untuk menutup modal alert
  const closeAlertModal = () => {
    setShowAlertModal(false);
  };

  // Fetch data informasi TPQ
  const fetchInformasiTPQ = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/api/informasi-tpq`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.data) {
        setInformasi(result.data);
        setFormData({
          nama_tpq: result.data.nama_tpq || '',
          tempat: result.data.tempat || '',
          visi: result.data.visi || '',
          misi: result.data.misi || '',
          deskripsi: result.data.deskripsi || '',
          no_telp: result.data.no_telp || '',
          email: result.data.email || '',
          alamat: result.data.alamat || '',
          link_alamat: result.data.link_alamat || '',
          hari_jam_belajar: result.data.hari_jam_belajar || ''
        });
        
        if (result.data.logo) {
          const logoUrl = `${result.data.logo}`;
          setLogoPreview(logoUrl);
        } else {
          setLogoPreview('');
        }
      }

    } catch (err) {
      console.error('Error fetching informasi TPQ:', err);
      setError(`Gagal memuat data informasi TPQ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data sosial media
  const fetchSosialMedia = async () => {
    try {
      setLoadingSosmed(true);
      const response = await fetch(`${API_URL}/api/sosial-media`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSosialMedia(result.data || []);

    } catch (err) {
      console.error('Error fetching sosial media:', err);
      setError(`Gagal memuat data sosial media: ${err.message}`);
    } finally {
      setLoadingSosmed(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle logo file change
const handleLogoChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format file tidak didukung. Gunakan JPEG, PNG, GIF, WebP, atau SVG.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB untuk Cloudinary
      setError('Ukuran file terlalu besar. Maksimal 10MB.');
      return;
    }

    setLogoFile(file);
    setError('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }
};
  // Save informasi TPQ
const handleSave = async () => {
  try {
    setSaving(true);
    setError('');

    let logoUrl = informasi?.logo || null;
    
    // Upload logo ke Cloudinary jika ada file baru
    if (logoFile) {
      const cloudinaryResult = await uploadLogoToCloudinary(logoFile);
      logoUrl = cloudinaryResult.url;
    }

    // Kirim data sebagai JSON (bukan FormData)
    const dataToSend = {
      nama_tpq: formData.nama_tpq,
      tempat: formData.tempat || null,
      visi: formData.visi || null,
      misi: formData.misi || null,
      deskripsi: formData.deskripsi || null,
      no_telp: formData.no_telp || null,
      email: formData.email || null,
      alamat: formData.alamat || null,
      link_alamat: formData.link_alamat || null,
      hari_jam_belajar: formData.hari_jam_belajar || null,
      logo: logoUrl // URL string dari Cloudinary
    };

    const method = informasi ? 'PUT' : 'POST';
    const endpoint = informasi 
      ? `${API_URL}/api/super-admin/informasi-tpq/${informasi.id_tpq}`
      : `${API_URL}/api/super-admin/informasi-tpq`;

    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataToSend)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    setInformasi(result.data);
    setIsEditing(false);
    
    if (logoUrl) {
      setLogoPreview(logoUrl); // Simpan URL Cloudinary langsung
    }
    setLogoFile(null);

    showAlert('Berhasil', 'Informasi TPQ berhasil disimpan!', 'success');

  } catch (err) {
    console.error('Error saving informasi TPQ:', err);
    showAlert('Gagal', err.message || 'Gagal menyimpan informasi TPQ', 'error');
  } finally {
    setSaving(false);
  }
};
  // Delete informasi TPQ
  const handleDelete = async () => {
    if (!informasi) return;

    // Tampilkan modal konfirmasi
    setAlertData({
      title: 'Konfirmasi Hapus',
      message: 'Apakah Anda yakin ingin menghapus informasi TPQ? Tindakan ini tidak dapat dibatalkan.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          setSaving(true);
          
          const response = await fetch(`${API_URL}/api/super-admin/informasi-tpq/${informasi.id_tpq}`, {
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

          setInformasi(null);
          setFormData({});
          setLogoPreview('');
          setIsEditing(false);
          
          showAlert('Berhasil', 'Informasi TPQ berhasil dihapus!', 'success');

        } catch (err) {
          console.error('Error deleting informasi TPQ:', err);
          setError(`Gagal menghapus informasi TPQ: ${err.message}`);
        } finally {
          setSaving(false);
        }
      }
    });
    setShowAlertModal(true);
  };

  const handleImageError = (e) => {
    console.error('Gagal memuat logo:', logoPreview);
    e.target.style.display = 'none';
    const fallbackDiv = e.target.nextSibling;
    if (fallbackDiv) {
      fallbackDiv.style.display = 'flex';
    }
  };

  useEffect(() => {
    fetchInformasiTPQ();
    fetchSosialMedia();
  }, []);

  if (loading) {
    return (
      <AuthDashboardLayout title="Informasi TPQ">
        <div className="p-0">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AuthDashboardLayout>
    );
  }

  // SOSIAL MEDIA FUNCTIONS
  const handleSosmedInputChange = (e) => {
    const { name, value } = e.target;
    setSosmedForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle pemilihan sosial media dari combo box
  const handleSocialMediaSelect = (e) => {
    const selectedName = e.target.value;
    if (selectedName) {
      const selectedSocial = popularSocialMedia.find(sm => sm.name === selectedName);
      if (selectedSocial) {
        setSosmedForm(prev => ({
          ...prev,
          nama_sosmed: selectedSocial.name,
          icon_sosmed: selectedSocial.icon
        }));
      }
    }
  };

  // Fungsi untuk render SVG icon
  const renderSocialMediaIcon = (iconName, className = "w-5 h-5") => {
    const social = popularSocialMedia.find(sm => sm.icon === iconName);
    if (social) {
      return (
        <div 
          className={className}
          dangerouslySetInnerHTML={{ __html: social.svg }}
        />
      );
    }
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    );
  };

  const openSosmedModal = (sosmed = null) => {
    if (sosmed) {
      setEditingSosmed(sosmed);
      setSosmedForm({
        nama_sosmed: sosmed.nama_sosmed,
        username: sosmed.username,
        icon_sosmed: sosmed.icon_sosmed || '',
        link_sosmed: sosmed.link_sosmed || ''
      });
    } else {
      setEditingSosmed(null);
      setSosmedForm({
        nama_sosmed: '',
        username:'',
        icon_sosmed: '',
        link_sosmed: ''
      });
    }
    setShowSosmedModal(true);
  };

  const closeSosmedModal = () => {
    setShowSosmedModal(false);
    setEditingSosmed(null);
    setSosmedForm({
      nama_sosmed: '',
      username: '',
      icon_sosmed: '',
      link_sosmed: ''
    });
  };

  const saveSosialMedia = async () => {
    try {
      setSaving(true);
      setError('');

      const endpoint = editingSosmed 
        ? `${API_URL}/api/super-admin/sosial-media/${editingSosmed.id_sosmed}`
        : `${API_URL}/api/super-admin/sosial-media`;

      const method = editingSosmed ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sosmedForm)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      await fetchSosialMedia();
      closeSosmedModal();
      showAlert('Berhasil', `Sosial media berhasil ${editingSosmed ? 'diupdate' : 'ditambahkan'}!`, 'success');

    } catch (err) {
      console.error('Error saving sosial media:', err);
      setError(`Gagal menyimpan sosial media: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteSosialMedia = async (id) => {
    // Tampilkan modal konfirmasi
    setAlertData({
      title: 'Konfirmasi Hapus',
      message: 'Apakah Anda yakin ingin menghapus sosial media ini?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          setSaving(true);
          
          const response = await fetch(`${API_URL}/api/super-admin/sosial-media/${id}`, {
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

          await fetchSosialMedia();
          showAlert('Berhasil', 'Sosial media berhasil dihapus!', 'success');

        } catch (err) {
          console.error('Error deleting sosial media:', err);
          setError(`Gagal menghapus sosial media: ${err.message}`);
        } finally {
          setSaving(false);
        }
      }
    });
    setShowAlertModal(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (informasi) {
      setFormData({
        nama_tpq: informasi.nama_tpq || '',
        tempat: informasi.tempat || '',
        visi: informasi.visi || '',
        misi: informasi.misi || '',
        deskripsi: informasi.deskripsi || '',
        no_telp: informasi.no_telp || '',
        email: informasi.email || '',
        alamat: informasi.alamat || '',
        link_alamat: informasi.link_alamat || '',
        hari_jam_belajar: informasi.hari_jam_belajar || ''
      });
      
      // Simpan URL Cloudinary langsung
      if (informasi.logo) {
        setLogoPreview(informasi.logo);
      } else {
        setLogoPreview('');
      }
    }
    setLogoFile(null);
    setError('');
  };

  // Optimize Cloudinary URL untuk tampilan
const getOptimizedLogoUrl = (url, width = 400) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  
  // Masukkan parameter transformation ke URL Cloudinary
  const parts = url.split('/upload/');
  if (parts.length === 2) {
    // Untuk logo, gunakan crop dan background putih
    return `${parts[0]}/upload/w_${width},c_fill,ar_1:1,b_white/${parts[1]}`;
  }
  return url;
};

// Update tampilan logo preview:
{(logoPreview || informasi?.logo) && (
  <div className="w-48 h-48 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative mb-4">
    <img 
      src={logoPreview || getOptimizedLogoUrl(informasi?.logo)} 
      alt="Logo TPQ" 
      className="w-full h-full object-cover"
      onError={handleImageError}
    />
    <div className="hidden absolute inset-0 flex-col items-center justify-center text-gray-400 bg-gray-100">
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="text-sm mt-1">Gagal memuat logo</span>
    </div>
  </div>
)}

  

  return (
    <AuthDashboardLayout title="Informasi TPQ">
      <div className="p-0">
        

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {!informasi && !isEditing ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Informasi TPQ</h3>
            <p className="text-gray-600 mb-4">Silakan tambahkan informasi TPQ untuk menampilkannya di website.</p>
            {user?.role === 'super_admin' && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Tambah Informasi TPQ
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Informasi TPQ Section dengan Layout Baru */}
            <div className="bg-white rounded-lg shadow-md p-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Logo Section - Kiri */}
                <div className="lg:col-span-1">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo TPQ</label>
                    <div className="flex flex-col items-center">
                          {(logoPreview || informasi?.logo) && (
                            <div className="w-48 h-48 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center relative mb-4">
                              <img 
                                src={logoPreview || informasi?.logo} 
                                alt="Logo TPQ" 
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                              />
                              <div className="hidden absolute inset-0 flex-col items-center justify-center text-gray-400 bg-gray-100">
                                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm mt-1">Gagal memuat logo</span>
                              </div>
                            </div>
                          )}
                      {isEditing && (
  <div className="w-full">
    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 bg-gray-50 ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {logoPreview ? (
        <div className="text-center">
          {isUploadingLogo ? (
            <div className="w-full px-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Uploading to Cloudinary...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Jangan tutup halaman ini</p>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-gray-600">Ubah Logo TPQ</p>
              <p className="text-xs text-gray-500">Klik untuk mengganti</p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploadingLogo ? (
            <>
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
              <p className="text-xs text-gray-500">{uploadProgress}%</p>
            </>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-500">
                <span className="font-semibold">Klik untuk tambah Logo TPQ</span>
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, GIF, WebP up to 10MB</p>
            </>
          )}
        </div>
      )}
      <input 
        type="file" 
        className="hidden" 
        accept="image/*"
        onChange={handleLogoChange}
        disabled={isUploadingLogo}
      />
    </label>
    <p className="text-xs text-gray-500 mt-2 text-center">
      Format: JPG, PNG, GIF, WebP. Maksimal 10MB.
    </p>
  </div>
)}
                    </div>
                  </div>
                  <div className="flex justify-center items-center mb-6">
                  {user?.role === 'super_admin' && (
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                          >
                            Batal
                          </button>
                          <button
                          onClick={handleSave}
                          disabled={saving || isUploadingLogo}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {saving || isUploadingLogo ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              {isUploadingLogo ? 'Mengupload Logo...' : 'Menyimpan...'}
                            </>
                          ) : (
                            'Simpan Perubahan'
                          )}
                        </button>
                        </>
                      ) : (
                        <>
                          {/* {informasi && (
                            <button
                              onClick={handleDelete}
                              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Hapus
                            </button>
                          )} */}
                          <button
                            onClick={() => setIsEditing(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            {informasi ? 'Edit Informasi' : 'Tambah Informasi'}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                </div>

                {/* Informasi Text - Kanan */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nama TPQ */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nama TPQ *</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="nama_tpq"
                          value={formData.nama_tpq || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Masukkan nama TPQ"
                          required
                        />
                      ) : (
                        <p className="text-gray-900 text-2xl font-bold">{informasi?.nama_tpq}</p>
                      )}
                    </div>

                    {/* Tempat */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tempat</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="tempat"
                          value={formData.tempat || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Masukkan tempat/lokasi TPQ"
                        />
                      ) : (
                        <p className="text-gray-900">{informasi?.tempat || '-'}</p>
                      )}
                    </div>

                    {/* Telepon */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nomor Telepon</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="no_telp"
                          value={formData.no_telp || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Masukkan nomor telepon"
                        />
                      ) : (
                        <p className="text-gray-900">{informasi?.no_telp || '-'}</p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Masukkan email"
                        />
                      ) : (
                        <p className="text-gray-900">{informasi?.email || '-'}</p>
                      )}
                    </div>

                    {/* Link Alamat */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Link Alamat (Google Maps)</label>
                      {isEditing ? (
                        <input
                          type="url"
                          name="link_alamat"
                          value={formData.link_alamat || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="https://maps.google.com/..."
                        />
                      ) : (
                        <p className="text-gray-900">
                          {informasi?.link_alamat ? (
                            <a 
                              href={informasi.link_alamat} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              {informasi.link_alamat}
                            </a>
                          ) : '-'}
                        </p>
                      )}
                    </div>

                    {/* Alamat */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Lengkap</label>
                      {isEditing ? (
                        <textarea
                          name="alamat"
                          value={formData.alamat || ''}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Masukkan alamat lengkap TPQ"
                        />
                      ) : (
                        <p className="text-gray-900 whitespace-pre-line">{informasi?.alamat || '-'}</p>
                      )}
                    </div>

                    {/* Hari & Jam Belajar */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hari & Jam Belajar</label>
                      {isEditing ? (
                        <textarea
                          name="hari_jam_belajar"
                          value={formData.hari_jam_belajar || ''}
                          onChange={handleInputChange}
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Contoh: Senin - Kamis: 15:00-17:00, Jumat: 14:00-16:00"
                        />
                      ) : (
                        <p className="text-gray-900 whitespace-pre-line">{informasi?.hari_jam_belajar || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Visi, Misi, Deskripsi - Full Width di Bawah */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-3">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Visi</label>
                      {isEditing ? (
                        <textarea
                          name="visi"
                          value={formData.visi || ''}
                          onChange={handleInputChange}
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Masukkan visi TPQ"
                        />
                      ) : (
                        <p className="text-gray-900 whitespace-pre-line">{informasi?.visi || '-'}</p>
                      )}
                    </div>

                    {/* Misi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Misi</label>
                      {isEditing ? (
                        <textarea
                          name="misi"
                          value={formData.misi || ''}
                          onChange={handleInputChange}
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Masukkan misi TPQ"
                        />
                      ) : (
                        <p className="text-gray-900 whitespace-pre-line">{informasi?.misi || '-'}</p>
                      )}
                    </div>

                    {/* Deskripsi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                      {isEditing ? (
                        <textarea
                          name="deskripsi"
                          value={formData.deskripsi || ''}
                          onChange={handleInputChange}
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Masukkan deskripsi lengkap tentang TPQ"
                        />
                      ) : (
                        <p className="text-gray-900 whitespace-pre-line">{informasi?.deskripsi || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Updated Info */}
              {informasi && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Terakhir diperbarui: {new Date(informasi.diperbarui_pada).toLocaleDateString('id-ID')} 
                    {informasi.diupdate_oleh && ` oleh ${informasi.diupdate_oleh.nama_lengkap}`}
                  </div>
                </div>
              )}
            </div>

             {/* SOSIAL MEDIA SECTION */}
             <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Sosial Media</h2>
                  <p className="text-gray-600 mt-1">Kelola akun sosial media TPQ</p>
                </div>
                
                {user?.role === 'super_admin' && (
                  <button
                    onClick={() => openSosmedModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Sosial Media
                  </button>
                )}
              </div>

              {loadingSosmed ? (
                <div className="animate-pulse space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="w-20 h-8 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : sosialMedia.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <p>Belum ada sosial media yang ditambahkan</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sosialMedia.map((sosmed) => (
                    <div key={sosmed.id_sosmed} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
                            {renderSocialMediaIcon(sosmed.icon_sosmed, "w-5 h-5 text-blue-600")}
                          </div>
                          <h3 className="font-semibold text-gray-800">{sosmed.username}</h3>
                        </div>
                        {user?.role === 'super_admin' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => openSosmedModal(sosmed)}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteSosialMedia(sosmed.id_sosmed)}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                        
                      </div>
                      {sosmed.nama_sosmed && (
                        <a 
                          className="text-black text-m break-all block mt-2"
                        >
                          {sosmed.nama_sosmed}
                        </a>
                      )}
                      {sosmed.link_sosmed && (
                        <a 
                          href={sosmed.link_sosmed} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm break-all block mt-2"
                        >
                          {sosmed.link_sosmed}
                        </a>
                      )}
                      {sosmed.diperbarui_pada && (
                        <p className="text-xs text-gray-500 mt-3">
                          Diupdate: {new Date(sosmed.diperbarui_pada).toLocaleDateString('id-ID')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Sosial Media */}
        {showSosmedModal && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingSosmed ? 'Edit Sosial Media' : 'Tambah Sosial Media'}
                </h3>
                <button
                  onClick={closeSosmedModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Sosial Media *
                  </label>
                  <select
                    value={sosmedForm.nama_sosmed}
                    onChange={handleSocialMediaSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Pilih Sosial Media --</option>
                    {popularSocialMedia.map((social) => (
                      <option key={social.name} value={social.name}>
                        {social.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon Terpilih
                  </label>
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                    {sosmedForm.icon_sosmed ? (
                      <>
                        <div className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full">
                          {renderSocialMediaIcon(sosmedForm.icon_sosmed, "w-4 h-4 text-blue-600")}
                        </div>
                        <span className="text-sm text-gray-600">
                          {sosmedForm.nama_sosmed}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Pilih sosial media untuk melihat icon</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username Sosmed
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={sosmedForm.username}
                    onChange={handleSosmedInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="@username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Link URL *
                  </label>
                  <input
                    type="url"
                    name="link_sosmed"
                    value={sosmedForm.link_sosmed}
                    onChange={handleSosmedInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={closeSosmedModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={saveSosialMedia}
                  disabled={saving || !sosmedForm.nama_sosmed || !sosmedForm.link_sosmed}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    editingSosmed ? 'Update' : 'Simpan'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Alert */}
        {showAlertModal && (
          <div className="fixed inset-0 backdrop-blur drop-shadow-2xl bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center p-6">
                <div className={`flex-shrink-0 rounded-full p-3 ${
                  alertData.type === 'success' ? 'bg-green-100' : 
                  alertData.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <svg className={`w-6 h-6 ${
                    alertData.type === 'success' ? 'text-green-600' : 
                    alertData.type === 'error' ? 'text-red-600' : 'text-blue-600'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {alertData.type === 'success' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : alertData.type === 'error' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    )}
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{alertData.title}</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{alertData.message}</p>
                  </div>
                </div>
              </div>
              
              <div className={`flex ${
                alertData.type === 'confirm' ? 'justify-between' : 'justify-end'
              } gap-3 p-6 border-t border-gray-200`}>
                {alertData.type === 'confirm' ? (
                  <>
                    <button
                      onClick={closeAlertModal}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => {
                        if (alertData.onConfirm) {
                          alertData.onConfirm();
                        }
                        closeAlertModal();
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Hapus
                    </button>
                  </>
                ) : (
                  <button
                    onClick={closeAlertModal}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tutup
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthDashboardLayout>
  );
};

export default InformasiTPQ;