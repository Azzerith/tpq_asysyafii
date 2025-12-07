package routes

import (
	"tpq_asysyafii/config"
	"tpq_asysyafii/controllers"
	"tpq_asysyafii/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		api.POST("/register", controllers.RegisterUser)
		api.POST("/login", controllers.LoginUser)
		
		donasiController := controllers.NewDonasiController(config.GetDB())
		api.GET("/donasi-public", donasiController.GetDonasiPublic)
    	api.GET("/donasi-public/summary", donasiController.GetDonasiSummaryPublic)

		pemakaianController := controllers.NewPemakaianSaldoController(config.DB)
		api.GET("/pengeluaran-public", pemakaianController.GetAllPemakaianPublic)
		api.GET("/pengeluaran-public/summary", pemakaianController.GetPemakaianSummaryPublic)
		api.GET("/pengeluaran-public/stats", pemakaianController.GetPemakaianStatsPublic)
		api.GET("/pengeluaran-public/:id", pemakaianController.GetPemakaianByIDPublic)

		rekapController := controllers.NewRekapController(config.DB)
		api.GET("/rekap-public", rekapController.GetRekapPublic)
		api.GET("/rekap-public/latest", rekapController.GetLatestRekapPublic)
		api.GET("/rekap-public/summary", rekapController.GetRekapSummaryPublic)
		api.GET("/rekap-public/period", rekapController.GetRekapByPeriodePublic)
		api.GET("/rekap-public/periods", rekapController.GetRekapPeriodsPublic)

		beritaController := controllers.NewBeritaController(config.DB)
		api.GET("/berita", beritaController.GetBeritaPublic)
		api.GET("/berita/:slug", beritaController.GetBeritaBySlug)
		api.GET("/berita/id/:id", beritaController.GetBeritaByID) 

		fasilitasController := controllers.NewFasilitasController(config.DB)
		api.GET("/fasilitas", fasilitasController.GetFasilitasPublic)
		api.GET("/fasilitas/:slug", fasilitasController.GetFasilitasBySlug)
		api.GET("/fasilitas/id/:id", fasilitasController.GetFasilitasByID)

		programUnggulanController := controllers.NewProgramUnggulanController(config.DB)
		api.GET("/program-unggulan", programUnggulanController.GetProgramUnggulanPublic) 
		api.GET("/program-unggulan/:slug", programUnggulanController.GetProgramUnggulanBySlug)
		api.GET("/program-unggulan/id/:id", programUnggulanController.GetProgramUnggulanByID)
		informasiTPQController := controllers.NewInformasiTPQController(config.DB)
		api.GET("/informasi-tpq", informasiTPQController.GetInformasiTPQ)

		sosialMediaController := controllers.NewSosialMediaController(config.DB)
		api.GET("/sosial-media", sosialMediaController.GetAllSosialMedia)

		testimoniController := controllers.NewTestimoniController(config.DB)
		api.GET("/testimoni", testimoniController.GetTestimoniPublic)
		api.GET("/testimoni/:id", testimoniController.GetTestimoniByID)

		protected := api.Group("/")
		protected.Use(middlewares.AuthMiddleware())
		{
			protected.GET("/users", controllers.GetUsers)
			protected.GET("/users/:id", controllers.GetUserByID)
			protected.PUT("/users/:id", controllers.UpdateUser)

			keluargaController := controllers.NewKeluargaController(config.DB)
			protected.POST("/keluarga", keluargaController.CreateKeluarga)
			protected.GET("/keluarga", keluargaController.GetAllKeluarga)
			protected.GET("/keluarga/my", keluargaController.GetMyKeluarga)
			protected.GET("/keluarga/search", keluargaController.SearchKeluarga)
			protected.GET("/keluarga/:id", keluargaController.GetKeluargaByID)
			protected.GET("/keluarga/wali/:id_wali", keluargaController.GetKeluargaByWali)
			protected.PUT("/keluarga/:id", keluargaController.UpdateKeluarga)
			protected.DELETE("/keluarga/:id", keluargaController.DeleteKeluarga)

			santriController := controllers.NewSantriController(config.DB)
			protected.GET("/santri/my", santriController.GetMySantri)
			protected.GET("/wali/santri", santriController.GetSantriByWali) 

			syahriahController := controllers.NewSyahriahController(config.DB)
			protected.GET("/syahriah", syahriahController.GetSyahriahForWali)
			protected.GET("/syahriah/my", syahriahController.GetMySyahriah)	
			protected.GET("/syahriah/summary", syahriahController.GetSyahriahSummaryForWali)
			protected.GET("/syahriah/:id", syahriahController.GetSyahriahByID)

			donasiController := controllers.NewDonasiController(config.GetDB())
			protected.GET("/donasi", donasiController.GetAllDonasi)
			protected.GET("/donasi/summary", donasiController.GetDonasiSummary)
			protected.GET("/donasi/by-date", donasiController.GetDonasiByDateRange)
			protected.GET("/donasi/:id", donasiController.GetDonasiByID)

			pengumumanController := controllers.NewPengumumanController(config.DB)
			protected.GET("/pengumuman", pengumumanController.GetAllPengumuman)
			protected.GET("/pengumuman/aktif", pengumumanController.GetPengumumanAktif)
			protected.GET("/pengumuman/:id", pengumumanController.GetPengumumanByID)

			rekapController := controllers.NewRekapController(config.DB)
			protected.GET("/rekap", rekapController.GetAllRekap)
			protected.GET("/rekap/summary", rekapController.GetRekapSummary)
			protected.GET("/rekap/latest", rekapController.GetLatestRekap)
			protected.GET("/rekap/period", rekapController.GetRekapByPeriode)
			protected.GET("/rekap/:id", rekapController.GetRekapByID)

			pemakaianController := controllers.NewPemakaianSaldoController(config.DB)
			protected.GET("/pemakaian", pemakaianController.GetAllPemakaian)
			protected.GET("/pemakaian/summary", pemakaianController.GetPemakaianSummary)
			protected.GET("/pemakaian/:id", pemakaianController.GetPemakaianByID)

			testimoniController := controllers.NewTestimoniController(config.DB)
			protected.POST("/testimoni", testimoniController.CreateTestimoni)
			protected.GET("/testimoni/my", testimoniController.GetMyTestimoni)
			protected.PUT("/testimoni/:id", testimoniController.UpdateTestimoni)
			protected.DELETE("/testimoni/:id", testimoniController.DeleteTestimoni)
		}

		// Group untuk admin DAN super-admin
		admin := api.Group("/admin")
		admin.Use(middlewares.AuthMiddleware(), middlewares.AdminOrSuperAdminMiddleware())
		{
			admin.GET("/users", controllers.GetUsers)
			admin.GET("/wali",controllers.GetWali)
			admin.POST("/users", controllers.RegisterUser)

			santriController := controllers.NewSantriController(config.DB)
			admin.GET("/santri", santriController.GetAllSantri)

			donasiController := controllers.NewDonasiController(config.GetDB())
			admin.POST("/donasi", donasiController.CreateDonasi)
			admin.GET("/donasi", donasiController.GetAllDonasi)
			admin.GET("/donasi/summary", donasiController.GetDonasiSummary)
			admin.GET("/donasi/by-date", donasiController.GetDonasiByDateRange)
			admin.GET("/donasi/:id", donasiController.GetDonasiByID)
			admin.PUT("/donasi/:id", donasiController.UpdateDonasi)
			admin.DELETE("/donasi/:id", donasiController.DeleteDonasi)

			syahriahController := controllers.NewSyahriahController(config.DB)
			admin.POST("/syahriah", syahriahController.CreateSyahriah)
			admin.POST("/syahriah/batch", syahriahController.BatchCreateSyahriah)
        	admin.PUT("/syahriah/:id", syahriahController.UpdateSyahriah)
        	admin.DELETE("/syahriah/:id", syahriahController.DeleteSyahriah)
			admin.GET("/syahriah", syahriahController.GetAllSyahriah)
			admin.GET("/syahriah/my", syahriahController.GetMySyahriah)	
			admin.GET("/syahriah/summary", syahriahController.GetSyahriahSummary)
			admin.GET("/syahriah/:id", syahriahController.GetSyahriahByID)
			admin.PUT("/syahriah/:id/bayar", syahriahController.BayarSyahriah)

			pengumumanController := controllers.NewPengumumanController(config.DB)
			admin.POST("/pengumuman", pengumumanController.CreatePengumuman)
			admin.PUT("/pengumuman/:id", pengumumanController.UpdatePengumuman)
			admin.DELETE("/pengumuman/:id", pengumumanController.DeletePengumuman)
			admin.GET("/pengumuman/summary", pengumumanController.GetPengumumanSummary)

			logController := controllers.NewLogAktivitasController(config.GetDB())
			admin.GET("/logs", logController.GetAllLogAktivitas)
			admin.GET("/logs/summary", logController.GetLogSummary)
			admin.GET("/logs/:id", logController.GetLogAktivitasByID)

			rekapController := controllers.NewRekapController(config.DB)
			admin.POST("/rekap", rekapController.CreateRekap)
			admin.PUT("/rekap/:id", rekapController.UpdateRekap)
			admin.DELETE("/rekap/:id", rekapController.DeleteRekap)
			admin.POST("/rekap/generate", rekapController.GenerateRekapOtomatis)
			admin.GET("/rekap", rekapController.GetAllRekap)
			admin.GET("/rekap/summary", rekapController.GetRekapSummary)
			admin.GET("/rekap/latest", rekapController.GetLatestRekap)
			admin.GET("/rekap/period", rekapController.GetRekapByPeriode)
			admin.GET("/rekap/:id", rekapController.GetRekapByID)

			pemakaianController := controllers.NewPemakaianSaldoController(config.DB)
			admin.GET("/pemakaian", pemakaianController.GetAllPemakaian)
			admin.POST("/pemakaian", pemakaianController.CreatePemakaian)
			admin.PUT("/pemakaian/:id", pemakaianController.UpdatePemakaian)
			admin.DELETE("/pemakaian/:id", pemakaianController.DeletePemakaian)
			admin.GET("/pemakaian/summary", pemakaianController.GetPemakaianSummary)
			admin.GET("/pemakaian/:id", pemakaianController.GetPemakaianByID)
		}

		// Hanya untuk super-admin
		superAdmin := api.Group("/super-admin")
		superAdmin.Use(middlewares.AuthMiddleware(), middlewares.SuperAdminMiddleware())
		{
			superAdmin.GET("/users", controllers.GetUsers)
			superAdmin.GET("/wali",controllers.GetWali)
			superAdmin.POST("/users", controllers.RegisterUser)
			superAdmin.DELETE("/users/:id", controllers.DeleteUser)
			superAdmin.PUT("/users/:id", controllers.UpdateUser)
			
			santriController := controllers.NewSantriController(config.DB)
			superAdmin.POST("/santri", santriController.CreateSantri)
			superAdmin.GET("/santri", santriController.GetAllSantri)
			superAdmin.GET("/santri/wali/:id_wali", santriController.GetSantriByWali)
			superAdmin.GET("/santri/by-wali/:id", santriController.GetSantriByWaliID)
			superAdmin.GET("/santri/search", santriController.SearchSantri) 
			superAdmin.GET("/santri/:id", santriController.GetSantriByID) 
			superAdmin.PUT("/santri/:id", santriController.UpdateSantri) 
			superAdmin.DELETE("/santri/:id", santriController.DeleteSantri)
			superAdmin.PUT("/santri/:id/status", santriController.UpdateStatusSantri)

			keluargaController := controllers.NewKeluargaController(config.DB)
			superAdmin.POST("/keluarga", keluargaController.CreateKeluarga)
			superAdmin.GET("/keluarga", keluargaController.GetAllKeluarga)
			superAdmin.GET("/keluarga/search", keluargaController.SearchKeluarga)
			superAdmin.GET("/keluarga/wali/:id_wali", keluargaController.GetKeluargaByWali)
			superAdmin.GET("/keluarga/:id", keluargaController.GetKeluargaByID)
			superAdmin.PUT("/keluarga/:id", keluargaController.UpdateKeluarga)
			superAdmin.DELETE("/keluarga/:id", keluargaController.DeleteKeluarga)

			superAdmin.POST("/berita", beritaController.CreateBerita)
			superAdmin.GET("/berita/all", beritaController.GetAllBerita)
			superAdmin.PUT("/berita/:id", beritaController.UpdateBerita)
			superAdmin.PUT("/berita/:id/publish", beritaController.PublishBerita)
			superAdmin.DELETE("/berita/:id", beritaController.DeleteBerita)

			superAdmin.POST("/program-unggulan", programUnggulanController.CreateProgramUnggulan)
			superAdmin.GET("/program-unggulan/all", programUnggulanController.GetAllProgramUnggulan)
			superAdmin.PUT("/program-unggulan/:id", programUnggulanController.UpdateProgramUnggulan)
			superAdmin.DELETE("/program-unggulan/:id", programUnggulanController.DeleteProgramUnggulan)
			superAdmin.PUT("/program-unggulan/:id/aktif", programUnggulanController.AktifkanProgramUnggulan)
			superAdmin.PUT("/program-unggulan/:id/nonaktif", programUnggulanController.NonaktifkanProgramUnggulan)

			superAdmin.POST("/fasilitas", fasilitasController.CreateFasilitas)
			superAdmin.GET("/fasilitas/all", fasilitasController.GetAllFasilitas)
			superAdmin.PUT("/fasilitas/:id", fasilitasController.UpdateFasilitas)
			superAdmin.DELETE("/fasilitas/:id", fasilitasController.DeleteFasilitas)
			superAdmin.PUT("/fasilitas/:id/aktif", fasilitasController.AktifkanFasilitas)
			superAdmin.PUT("/fasilitas/:id/nonaktif", fasilitasController.NonaktifkanFasilitas)

			superAdmin.POST("/informasi-tpq", informasiTPQController.CreateInformasiTPQ)
			superAdmin.GET("/informasi-tpq/all", informasiTPQController.GetInformasiTPQ)
			superAdmin.PUT("/informasi-tpq/:id", informasiTPQController.UpdateInformasiTPQ)
			superAdmin.DELETE("/informasi-tpq/:id", informasiTPQController.DeleteInformasiTPQ)

			superAdmin.POST("/sosial-media", sosialMediaController.CreateSosialMedia)
			superAdmin.GET("/sosial-media", sosialMediaController.GetAllSosialMedia)
			superAdmin.GET("/sosial-media/:id", sosialMediaController.GetSosialMediaByID)
			superAdmin.PUT("/sosial-media/:id", sosialMediaController.UpdateSosialMedia)
			superAdmin.DELETE("/sosial-media/:id", sosialMediaController.DeleteSosialMedia)

			testimoniController := controllers.NewTestimoniController(config.DB)
			superAdmin.GET("/testimoni", testimoniController.GetAllTestimoni)
			superAdmin.PUT("/testimoni/:id/show", testimoniController.ShowTestimoni)
			superAdmin.PUT("/testimoni/:id/hide", testimoniController.HideTestimoni)
			superAdmin.DELETE("/testimoni/:id", testimoniController.DeleteTestimoni)
		}
	}
}