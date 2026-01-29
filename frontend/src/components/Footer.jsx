import React, { useState, useEffect } from 'react'
import logoCircle from "../assets/logo-circle.png";

const Footer = () => {
  const [informasiTPQ, setInformasiTPQ] = useState(null)
  const [sosialMedia, setSosialMedia] = useState([])
  const [loading, setLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  // Dummy data sebagai fallback
  const dummyInformasiTPQ = {
    nama_tpq: "TPQ Asy-Syafi'i",
    tempat: "Campakoah",
    visi: "Menjadi Lembaga Pendidikan yang Membentuk Generasi Berakhlak Mulia dengan Mempelajari Al Qur'an sejak dini.",
    misi: "1. Membudayakan pelaksanaan ajaran-ajaran islam.\n2. Menumbuhkan kegemaran dan kebiasaan membaca alqur’an dan dzikir.\n3. Menumbuhkan akhlakul karimah dalam kehidupan sehari-hari.",
    deskripsi: "-",
    no_telp: "085726311183",
    email: "tpqasysyafiicampakoah@gmail.com",
    alamat: "Jl. Raya Sangkanayu - Pengalusan KM 1 Campakoah RT 01 RW 01 Kec. Mrebet - Purbalingga",
    link_alamat: "https://www.google.com/maps/place/P87C%2BP97+Masjid+Babussalam,+Dusun+1,+Campakoah,+Kec.+Mrebet,+Kabupaten+Purbalingga,+Jawa+Tengah+53352/@-7.2858343,109.3210678,3a,75y,346.76h,84.15t/data=!3m5!1e1!3m3!1sw15DUHVo_eMq6XDOocNJKw!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fpanoid%3Dw15DUHVo_eMq6XDOocNJKw%26w%3D900%26h%3D600%26ll%3D0.0,0.0%26yaw%3D346.0%26pitch%3D6.0%26thumbfov%3D98%26cb_client%3Dgmm.iv.android!4m2!3m1!1s0x2e6ff78f4b53e5e1:0x892d1e560fff2985?utm_source=mstt_0&g_ep=CAESBzI1LjQ5LjYYACCBgQEqdSw5NDI2NzcyNyw5NDI3NTQwNyw5NDI5MjE5NSw5NDI5OTUzMiw5NDI4MDU3Niw5NDIwNzM5NCw5NDIwNzUwNiw5NDIwODUwNiw5NDIxODY1Myw5NDIyOTgzOSw5NDI3NTE2OCw5NDI3OTYxOSw5NDI5NTUwOEICSUQ%3D&skid=075f5c29-a73f-4469-9503-7bbf92981e98&g_st=ac",
    hari_jam_belajar: "Senin - Sabtu Ba’da Dzuhur dan Ba’da Ashar"
  }

  const dummySosialMedia = [
    { 
      nama_sosmed: "Facebook", 
      username: "tpqasyasyafii",
      link_sosmed: "#", 
      icon_sosmed: "facebook" 
    },
    { 
      nama_sosmed: "WhatsApp", 
      username: "+6281234567890",
      link_sosmed: "#", 
      icon_sosmed: "whatsapp" 
    },
    { 
      nama_sosmed: "Instagram", 
      username: "@tpqasyasyafii",
      link_sosmed: "#", 
      icon_sosmed: "instagram" 
    }
  ]

  // Popular social media icons (sama seperti di crud page)
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

  // Fetch data dari API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch informasi TPQ
        const infoResponse = await fetch(`${API_URL}/api/informasi-tpq`)
        if (infoResponse.ok) {
          const infoData = await infoResponse.json()
          console.log('Informasi TPQ dari API:', infoData.data) // Debug log
          setInformasiTPQ(infoData.data)
        } else {
          console.log('Gagal fetch informasi TPQ, menggunakan dummy data')
          setInformasiTPQ(dummyInformasiTPQ)
        }

        // Fetch sosial media
        const sosmedResponse = await fetch(`${API_URL}/api/sosial-media`)
        if (sosmedResponse.ok) {
          const sosmedData = await sosmedResponse.json()
          console.log('Sosial media dari API:', sosmedData.data) // Debug log
          setSosialMedia(sosmedData.data)
        } else {
          console.log('Gagal fetch sosial media, menggunakan dummy data')
          setSosialMedia(dummySosialMedia)
        }

      } catch (error) {
        console.error('Error fetching data:', error)
        // Gunakan dummy data jika fetch gagal
        setInformasiTPQ(dummyInformasiTPQ)
        setSosialMedia(dummySosialMedia)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [API_URL])

  // Data yang digunakan (dari API atau dummy)
  const tpqData = informasiTPQ || dummyInformasiTPQ
  const sosmedData = sosialMedia.length > 0 ? sosialMedia : dummySosialMedia

  // Fungsi untuk mendapatkan URL logo
  const getLogoUrl = (logoData) => {
    if (!logoData) return logoCircle;
    
    // Jika logo adalah string path dari API
    if (typeof logoData === 'string') {
      // Jika sudah full URL
      if (logoData.startsWith('http')) {
        return logoData;
      }
      // Jika relative path, gabungkan dengan API URL di path /image/tpq/
      return `${API_URL}/image/tpq/${logoData}`;
    }
    
    return logoCircle;
  };

  // Fungsi untuk render SVG icon sosial media
  const renderSocialMediaIcon = (iconName, className = "w-4 h-4") => {
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

  // Format visi dan misi dengan enter
  const getVisiMisi = () => {
    const visi = tpqData.visi || '';
    const misi = tpqData.misi || '';
    
    if (visi && misi) {
      return (
        <>
          <div className="mb-2">
            <strong>Visi:</strong>
            <div className="ml-2 whitespace-pre-line">{visi}</div>
          </div>
          <div>
            <strong>Misi:</strong>
            <div className="ml-2 whitespace-pre-line">{misi}</div>
          </div>
        </>
      );
    } else if (visi) {
      return (
        <div className="whitespace-pre-line">{visi}</div>
      );
    } else if (misi) {
      return (
        <div className="whitespace-pre-line">{misi}</div>
      );
    } else {
      return tpqData.deskripsi || "Membentuk generasi Qurani yang berakhlak mulia sesuai manhaj Ahlus Sunnah wal Jama'ah melalui pendidikan agama Islam yang berkualitas dan menyenangkan.";
    }
  };

  // Parse jam belajar dari string ke array
  const parseJamBelajar = (jamBelajar) => {
    if (!jamBelajar) return [];
    return jamBelajar.split('\n').filter(jam => jam.trim() !== '');
  };

  const jamBelajarList = parseJamBelajar(tpqData.hari_jam_belajar);

  // Format nomor telepon untuk WhatsApp
  const formatWhatsAppNumber = (phone) => {
    if (!phone) return '6281234567890';
    
    // Hapus semua karakter non-digit
    const cleanNumber = phone.replace(/\D/g, '');
    
    // Jika nomor sudah diawali 62, return langsung
    if (cleanNumber.startsWith('62')) {
      return cleanNumber;
    }
    
    // Jika diawali 0, ganti dengan 62
    if (cleanNumber.startsWith('0')) {
      return '62' + cleanNumber.substring(1);
    }
    
    // Jika hanya angka tanpa prefix, tambahkan 62
    if (/^\d+$/.test(cleanNumber)) {
      return '62' + cleanNumber;
    }
    
    return '6281234567890';
  };

  if (loading) {
    return (
      <footer id="kontak" className="bg-green-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Loading Skeleton */}
            {[...Array(4)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="h-6 bg-green-700 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-green-700 rounded w-full"></div>
                  <div className="h-4 bg-green-700 rounded w-5/6"></div>
                  <div className="h-4 bg-green-700 rounded w-4/6"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer id="kontak" className="bg-green-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <img 
                  src={getLogoUrl(tpqData.logo)} 
                  alt={`${tpqData.nama_tpq} Logo`} 
                  className="w-full h-full object-cover rounded-full" 
                  onError={(e) => {
                    e.target.src = logoCircle;
                  }}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">{tpqData.nama_tpq || "TPQ Asy-Syafi'i"}</h2>
                <p className="text-green-200">{tpqData.tempat || "Campakoah"}</p>
              </div>
            </div>
            <div className="text-green-200 mb-4 max-w-md">
              {getVisiMisi()}
            </div>
            <div className="flex flex-wrap gap-4">
              {sosmedData.map((sosmed, index) => (
                <a 
                  key={index}
                  href={sosmed.link_sosmed || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-green-700 hover:bg-green-600 transition-colors rounded-full px-4 py-2"
                  title={`${sosmed.nama_sosmed}: ${sosmed.username}`}
                >
                  <div className="w-5 h-5 flex items-center justify-center">
                    {renderSocialMediaIcon(sosmed.icon_sosmed)}
                  </div>
                  <span className="text-sm">{sosmed.username}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Kontak Kami</h3>
            <div className="space-y-3 text-green-200">
              {tpqData.no_telp && (
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <div>
                    <span>{tpqData.no_telp}</span>
                    {tpqData.no_telp && (
                      <a 
                        href={`https://wa.me/${formatWhatsAppNumber(tpqData.no_telp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-green-300 hover:text-green-100 mt-1"
                      >
                        Chat via WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )}
              
              {tpqData.email && (
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <span>{tpqData.email}</span>
                </div>
              )}
              
              {tpqData.alamat && (
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <div>
                    <span className="whitespace-pre-line">{tpqData.alamat}</span>
                    {(tpqData.link_alamat || tpqData.alamat) && (
                      <a 
                        href={tpqData.link_alamat || `https://maps.google.com/?q=${encodeURIComponent(tpqData.alamat)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-green-300 hover:text-green-100 mt-1"
                      >
                        Lihat di Google Maps
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Jam Belajar</h3>
            <div className="space-y-2 text-green-200">
              {jamBelajarList.length > 0 ? (
                jamBelajarList.map((jam, index) => (
                  <p key={index}>{jam}</p>
                ))
              ) : (
                <>
                  <p>Senin - Kamis: 15.00 - 17.00</p>
                  <p>Jum'at: 14.00 - 16.00</p>
                  <p>Sabtu: 08.00 - 11.00</p>
                  <p>Minggu: Libur</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-green-700 mt-8 pt-8 text-center text-green-200">
          <p>&copy; 2025 {tpqData.nama_tpq || "TPQ Asy-Syafi'i"} {tpqData.tempat || "Campakoah"}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer