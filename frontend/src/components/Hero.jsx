import React, { useState, useEffect } from 'react'
import logo from "../assets/logo.png";

const Hero = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [currentWord, setCurrentWord] = useState(0)
  const [informasiTPQ, setInformasiTPQ] = useState(null)
  const [loading, setLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

  // Dummy data sebagai fallback
  const dummyInformasiTPQ = {
    nama_tpq: "TPQ Asy-Syafi'i",
    tempat: "Campakoah",
    slogan: "Membentuk generasi Qur'ani yang berakhlak mulia dan berprestasi",
    deskripsi: "Membentuk generasi Qur'ani yang berakhlak mulia dan berprestasi",
    visi: "Menjadi Lembaga Pendidikan yang Membentuk Generasi Berakhlak Mulia dengan Mempelajari Al Qur'an sejak dini.",
    misi: "1. Membudayakan pelaksanaan ajaran-ajaran islam.\n2. Menumbuhkan kegemaran dan kebiasaan membaca alqur'an dan dzikir\n3. Menumbuhkan akhlakul karimah dalam kehidupan sehari-hari",
    no_telp: "+6281234567890",
    link_alamat: "Jl. Pendidikan No. 123, Campakoah",
    logo: "logo.png"
  }

  const words = ['Qurani', 'Berakhlak', 'Cerdas', 'Shalih', 'Berprestasi']

  // Fetch data dari API
  useEffect(() => {
    const fetchInformasiTPQ = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${API_URL}/api/informasi-tpq`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Data informasi TPQ dari API:', data.data) // Debug log
          setInformasiTPQ(data.data)
        } else {
          console.log('Gagal fetch informasi TPQ, menggunakan dummy data')
          setInformasiTPQ(dummyInformasiTPQ)
        }
      } catch (error) {
        console.error('Error fetching informasi TPQ:', error)
        setInformasiTPQ(dummyInformasiTPQ)
      } finally {
        setLoading(false)
        setIsVisible(true)
      }
    }

    fetchInformasiTPQ()
  }, [API_URL])

  useEffect(() => {
    const wordInterval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2000)

    return () => clearInterval(wordInterval)
  }, [])

  // Data yang digunakan (dari API atau dummy)
  const tpqData = informasiTPQ || dummyInformasiTPQ

  // Fungsi untuk mendapatkan URL logo
  const getLogoUrl = (logoData) => {
    if (!logoData) return logo;
    
    // Jika logo adalah string path dari API
    if (typeof logoData === 'string') {
      // Jika sudah full URL
      if (logoData.startsWith('http')) {
        return logoData;
      }
      // Jika relative path, gabungkan dengan API URL di path /image/tpq/
      return `${API_URL}/image/tpq/${logoData}`;
    }
    
    return logo;
  };

  // Format nomor no_telp untuk WhatsApp
  const formatWhatsAppNumber = (phone) => {
    if (!phone) return '6281234567890'; // Default fallback
    
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
    
    return '6281234567890'; // Final fallback
  };

  // Generate Google Maps URL
  const getGoogleMapsUrl = (alamat) => {
    if (!alamat) return "https://www.google.com/maps/place/Jl.+Raya+Sangkanayu,+Kabupaten+Purbalingga,+Jawa+Tengah/@-7.2761685,109.3159791,17z/data=!3m1!4b1!4m6!3m5!1s0x2e6ff6cc4c6c9dcb:0x765c59d7b7c4ef45!8m2!3d-7.2761738!4d109.318554!16s%2Fg%2F11cm2qz6p1?authuser=0&entry=ttu&g_ep=EgoyMDI1MTAyMC4wIKXMDSoASAFQAw%3D%3D";
    return `https://maps.google.com/?q=${encodeURIComponent(alamat)}`;
  };

  // Fungsi untuk memformat misi dengan line breaks
  const formatMisi = (misiText) => {
    if (!misiText) return null;
    
    // Split berdasarkan newline atau angka dengan titik
    const points = misiText.split(/\n|(?=\d+\.)/).filter(point => point.trim() !== '');
    
    return points.map((point, index) => (
      <div key={index} className="mb-2 last:mb-0">
        {point.trim()}
      </div>
    ));
  };

  // Floating elements data
  const floatingElements = [
    { icon: '📖', top: '20%', left: '10%', delay: 0 },
    { icon: '🕌', top: '60%', left: '5%', delay: 0.5 },
    { icon: '✏️', top: '30%', right: '10%', delay: 1 },
    { icon: '🌟', top: '70%', right: '15%', delay: 1.5 },
    { icon: '🎓', top: '40%', left: '15%', delay: 2 },
    { icon: '📚', top: '80%', right: '5%', delay: 2.5 },
  ]

  if (loading) {
    return (
      <section id="beranda" className="relative min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 overflow-hidden pt-5">
        <div className="relative container mx-auto px-4 py-20">
          <div className="flex flex-col lg:flex-row items-center justify-between min-h-[80vh]">
            {/* Loading Skeleton */}
            <div className="lg:w-1/2 mb-12 lg:mb-0 space-y-8">
              <div className="inline-flex items-center space-x-2 bg-green-200 border border-green-300 rounded-full px-4 py-2 animate-pulse">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="text-green-700 font-medium text-sm w-40 h-4 bg-green-200 rounded"></span>
              </div>
              
              <div className="space-y-4">
                <div className="h-16 bg-green-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-8 bg-green-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-6 bg-green-200 rounded w-2/3 animate-pulse"></div>
              </div>
              
              <div className="h-20 bg-green-200 rounded animate-pulse"></div>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="h-14 bg-green-200 rounded-2xl w-40 animate-pulse"></div>
                <div className="h-14 bg-green-200 rounded-2xl w-40 animate-pulse"></div>
              </div>
            </div>
            
            <div className="lg:w-1/2 flex justify-center items-center">
              <div className="w-80 h-80 bg-green-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="beranda" className="relative min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 overflow-hidden pt-5">
      
      {/* Background Animated Elements */}
      <div className="absolute inset-0">  
        {/* Floating Circles */}
        <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-green-100 rounded-full animate-float"></div>
        <div className="absolute top-3/4 right-1/3 w-8 h-8 bg-green-100 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-green-100 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="grid-pattern animate-grid-flow"></div>
        </div>
      </div>

      {/* Floating Icons */}
      {floatingElements.map((element, index) => (
        <div
          key={index}
          className={`absolute text-2xl md:text-3xl opacity-20 animate-bounce-slow`}
          style={{
            top: element.top,
            left: element.left,
            right: element.right,
            animationDelay: `${element.delay}s`
          }}
        >
          {element.icon}
        </div>
      ))}

      <div className="relative container mx-auto px-4 py-20">
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-[80vh]">
          
          {/* Text Content dengan Animasi */}
          <div className="lg:w-1/2 mb-12 lg:mb-0 space-y-8 pt-15" >
            {/* Badge dengan Animasi */}
            {/* <div className={`inline-flex items-center space-x-2 bg-green-100 border border-green-200 rounded-full px-4 py-2 transform transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-700 font-medium text-sm">
                {tpqData.deskripsi || "Taman Pendidikan Quran Terpercaya"}
              </span>
            </div> */}

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-green-900 leading-tight">
                <span className={`block transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  {' '}
                  <span className="bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                    {tpqData.nama_tpq || "Asy-Syafi'i"}
                  </span>
                </span>
                <span className={`block text-2xl md:text-3xl text-green-700 font-semibold mt-2 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                  {tpqData.tempat || "Campakoah"}
                </span>
              </h1>
            </div>

            {/* Visi dan Misi */}
            <div className={`transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h3 className="text-xl font-bold text-green-800 mb-3">
                VISI
              </h3>
              <p className="text-lg text-green-700 leading-relaxed max-w-2xl mb-6">
                {tpqData.visi}
              </p>
              
              <h3 className="text-xl font-bold text-green-800 mb-3">
                MISI
              </h3>
              <div className="text-lg text-green-700 leading-relaxed max-w-2xl space-y-2">
                {formatMisi(tpqData.misi) || (
                  <div className="space-y-2">
                    <div>1. Membudayakan pelaksanaan ajaran-ajaran islam.</div>
                    <div>2. Menumbuhkan kegemaran dan kebiasaan membaca alqur'an dan dzikir</div>
                    <div>3. Menumbuhkan akhlakul karimah dalam kehidupan sehari-hari</div>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Buttons - Hubungi dan link_alamat */}
            <div className={`flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 transform transition-all duration-1000 delay-1100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} relative z-20`}>
              <a 
                href={`https://wa.me/${formatWhatsAppNumber(tpqData.no_telp)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 rounded-2xl hover:rounded-3xl transform hover:-translate-y-1 hover:scale-105 hover:shadow-2xl transition-all duration-300 font-semibold shadow-lg overflow-hidden text-center"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  {/* Phone SVG Icon */}
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <span>Hubungi Kami</span>
                  <span className="transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </a>

              <a 
                href={tpqData.link_alamat || getGoogleMapsUrl(tpqData.alamat)}
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative border-2 border-green-600 text-green-600 px-8 py-4 rounded-2xl hover:rounded-3xl transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 font-semibold text-center hover:bg-green-600 hover:text-white overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  {/* Location SVG Icon */}
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>Lihat Alamat</span>
                </span>
                <div className="absolute inset-0 bg-green-600 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-bottom"></div>
              </a>
            </div>
          </div>

          {/* Hero Illustration dengan Animasi */}
          <div className="lg:w-1/2 flex justify-center items-center relative z-10">
            <div className="relative">
              
              {/* Main Circle dengan ukuran lebih kecil di mobile */}
              <div className={`relative w-64 h-64 md:w-96 md:h-96 rounded-full flex items-center justify-center transform transition-all duration-1500 delay-500 ${isVisible ? 'scale-100 md:scale-170 rotate-0 opacity-100' : 'scale-50 rotate-180 opacity-0'}`}>
                
                {/* Inner Circle dengan Pulse Animation */}
                <div className="absolute inset-8 flex items-center justify-center animate-pulse-slow">
                  
                  {/* Content Center dengan ukuran lebih kecil di mobile */}
                  <div className="text-center space-y-4">
                    <div className="w-70 h-70 md:w-50 md:h-70 flex items-center justify-center mx-auto animate-bounce-gentle opacity-50">
                      <img 
                        src={getLogoUrl(tpqData.logo)} 
                        alt={`${tpqData.nama_tpq || "TPQ Asy-Syafi'i"} Logo`} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          // Fallback ke default logo jika gambar error
                          e.target.src = logo;
                        }}
                      />
                    </div>
                    
                  </div>
                </div>

                {/* Floating Elements Around Circle - disembunyikan di mobile */}
                <div className=" md:block absolute -top-4 -left-4 w-16 h-16 flex items-center justify-center animate-float-rotate">
                  <span className="text-2xl opacity-50">📚</span>
                </div>
                <div className=" md:block absolute -bottom-4 -right-4 w-16 h-16 flex items-center justify-center animate-float-rotate" style={{ animationDelay: '1s' }}>
                  <span className="text-2xl opacity-50">🕌</span>
                </div>
                <div className=" md:block absolute -top-4 -right-4 w-12 h-12 flex items-center justify-center animate-float-rotate" style={{ animationDelay: '2s' }}>
                  <span className="text-xl opacity-50">🎯</span>
                </div>
                <div className=" md:block absolute -bottom-4 -left-4 w-12 h-12 flex items-center justify-center animate-float-rotate" style={{ animationDelay: '1.5s' }}>
                  <span className="text-xl opacity-50">📖</span>
                </div>
              </div>

              {/* Decorative Elements - disembunyikan di mobile */}
              <div className="hidden md:block absolute top-10 -right-10 w-20 h-20 bg-yellow-200 rounded-full opacity-60 animate-ping-slow"></div>
              <div className="hidden md:block absolute bottom-10 -left-10 w-16 h-16 bg-blue-200 rounded-full opacity-60 animate-ping-slow" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero