package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"
	"tpq_asysyafii/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SyahriahController struct {
	db *gorm.DB
}

func NewSyahriahController(db *gorm.DB) *SyahriahController {
	return &SyahriahController{db: db}
}

// Request structs
type CreateSyahriahRequest struct {
	ID_Santri string  `json:"id_santri" binding:"required"`
	Bulan    string  `json:"bulan" binding:"required"` // format YYYY-MM
	Nominal  float64 `json:"nominal"`
	Status   string  `json:"status"`
}

type UpdateSyahriahRequest struct {
	Nominal float64 `json:"nominal"`
	Status  string  `json:"status"`
}

type BayarSyahriahRequest struct {
	Status string `json:"status" binding:"required"` // hanya untuk update status menjadi lunas
}

// Helper function untuk check role admin
func (ctrl *SyahriahController) isAdmin(c *gin.Context) bool {
	userRole, exists := c.Get("role")
	if !exists {
		return false
	}
	role := userRole.(string)
	return role == "admin" || role == "super_admin"
}

// Helper function untuk get user ID dari context
func (ctrl *SyahriahController) getUserID(c *gin.Context) (string, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return "", false
	}
	return userID.(string), true
}

func (ctrl *SyahriahController) updateRekapOtomatis(syahriah models.Syahriah) {
	rekapController := NewRekapController(ctrl.db)
	
	// Parse bulan untuk dapat time.Time
	bulanTime, err := time.Parse("2006-01", syahriah.Bulan)
	if err != nil {
		fmt.Printf("Gagal parse bulan: %v\n", err)
		return
	}
	
	if err := rekapController.UpdateRekapOtomatis(bulanTime); err != nil {
		// Log error tapi jangan gagalkan operasi utama
		fmt.Printf("Gagal update rekap: %v\n", err)
	}
}

// CreateSyahriah membuat data syahriah baru (hanya admin)
func (ctrl *SyahriahController) CreateSyahriah(c *gin.Context) {
	// Hanya admin yang bisa create
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat data syahriah"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req CreateSyahriahRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi format bulan (YYYY-MM)
	_, err := time.Parse("2006-01", req.Bulan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format bulan tidak valid. Gunakan format YYYY-MM"})
		return
	}

	// Cek apakah santri exists
	var santri models.Santri
	if err := ctrl.db.Where("id_santri = ?", req.ID_Santri).First(&santri).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Santri tidak ditemukan"})
		return
	}

	// Cek apakah sudah ada syahriah untuk bulan dan santri yang sama
	var existingSyahriah models.Syahriah
	if err := ctrl.db.Where("id_santri = ? AND bulan = ?", req.ID_Santri, req.Bulan).First(&existingSyahriah).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Syahriah untuk bulan ini sudah ada"})
		return
	}

	// Set default nominal jika tidak diisi
	if req.Nominal == 0 {
		req.Nominal = 10000 // default value
	}

	// Validasi status
	var status models.StatusSyahriah
	if req.Status != "" {
		status = models.StatusSyahriah(req.Status)
		if status != models.StatusBelum && status != models.StatusLunas {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'belum' atau 'lunas'"})
			return
		}
	} else {
		status = models.StatusBelum // default
	}

	// Buat data syahriah
	syahriah := models.Syahriah{
		IDSyahriah:  uuid.New().String(),
		ID_Santri:    req.ID_Santri,
		Bulan:       req.Bulan,
		Nominal:     req.Nominal,
		Status:      status,
		DicatatOleh: adminID,
		WaktuCatat:  time.Now(),
	}

	// Simpan ke database
	if err := ctrl.db.Create(&syahriah).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat data syahriah: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Santri").Preload("Santri.Wali").Preload("Admin").First(&syahriah, "id_syahriah = ?", syahriah.IDSyahriah)

	ctrl.updateRekapOtomatis(syahriah)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Data syahriah berhasil dibuat",
		"data":    syahriah,
	})
}

// GetAllSyahriah mendapatkan semua data syahriah (admin) atau hanya milik sendiri (santri)
func (ctrl *SyahriahController) GetAllSyahriah(c *gin.Context) {
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Parse query parameters

	bulan := c.Query("bulan")
	status := c.Query("status")
	idSantri := c.Query("id_santri") // untuk filter oleh admin

	var syahriah []models.Syahriah
	var total int64

	// Build query dengan preload yang benar
	query := ctrl.db.Preload("Santri").Preload("Santri.Wali").Preload("Admin")

	// Jika user adalah santri, hanya tampilkan data miliknya
	if !ctrl.isAdmin(c) {
		query = query.Where("id_santri = ?", userID)
	} else if idSantri != "" {
		// Jika admin dan filter by id_santri
		query = query.Where("id_santri = ?", idSantri)
	}

	// Apply filters
	if bulan != "" {
		query = query.Where("bulan = ?", bulan)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Hitung total records
	if err := query.Model(&models.Syahriah{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	err := query.Order("bulan DESC, waktu_catat DESC").
		Find(&syahriah).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": syahriah,
	})
}

// GetSyahriahByID mendapatkan syahriah berdasarkan ID
func (ctrl *SyahriahController) GetSyahriahByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID syahriah diperlukan"})
		return
	}

	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var syahriah models.Syahriah
	err := ctrl.db.Preload("Santri").Preload("Santri.Wali").Preload("Admin").Where("id_syahriah = ?", id).First(&syahriah).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data syahriah tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	// Authorization: hanya admin atau santri yang bersangkutan yang bisa lihat
	if !ctrl.isAdmin(c) && syahriah.ID_Santri != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses ke data ini"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": syahriah,
	})
}

// GetMySyahriah mendapatkan data syahriah milik user yang login (untuk santri)
func (ctrl *SyahriahController) GetMySyahriah(c *gin.Context) {
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	bulan := c.Query("bulan")
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	var syahriah []models.Syahriah
	var total int64

	// Build query hanya untuk user yang login
	query := ctrl.db.Preload("Santri").Preload("Santri.Wali").Preload("Admin").Where("id_santri = ?", userID)

	// Apply filters
	if bulan != "" {
		query = query.Where("bulan = ?", bulan)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Hitung total records
	if err := query.Model(&models.Syahriah{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("bulan DESC, waktu_catat DESC").
		Offset(offset).
		Limit(limit).
		Find(&syahriah).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": syahriah,
		"meta": gin.H{
			"page":      page,
			"limit":     limit,
			"total":     total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// UpdateSyahriah mengupdate data syahriah (hanya admin)
func (ctrl *SyahriahController) UpdateSyahriah(c *gin.Context) {
	// Hanya admin yang bisa update
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat mengupdate data syahriah"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID syahriah diperlukan"})
		return
	}

	var req UpdateSyahriahRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Cek apakah syahriah exists
	var existingSyahriah models.Syahriah
	err := ctrl.db.Where("id_syahriah = ?", id).First(&existingSyahriah).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data syahriah tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	// Update fields
	if req.Nominal > 0 {
		existingSyahriah.Nominal = req.Nominal
	}
	if req.Status != "" {
		status := models.StatusSyahriah(req.Status)
		if status != models.StatusBelum && status != models.StatusLunas {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'belum' atau 'lunas'"})
			return
		}
		existingSyahriah.Status = status
	}

	// Simpan perubahan
	if err := ctrl.db.Save(&existingSyahriah).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate data syahriah: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Santri").Preload("Santri.Wali").Preload("Admin").First(&existingSyahriah, "id_syahriah = ?", existingSyahriah.IDSyahriah)

	ctrl.updateRekapOtomatis(existingSyahriah)

	c.JSON(http.StatusOK, gin.H{
		"message": "Data syahriah berhasil diupdate",
		"data":    existingSyahriah,
	})
}

// BayarSyahriah update status menjadi lunas (bisa oleh santri untuk bayar)
func (ctrl *SyahriahController) BayarSyahriah(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID syahriah diperlukan"})
		return
	}

	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req BayarSyahriahRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi status
	if req.Status != string(models.StatusLunas) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status harus 'lunas' untuk pembayaran"})
		return
	}

	// Cek apakah syahriah exists
	var existingSyahriah models.Syahriah
	err := ctrl.db.Where("id_syahriah = ?", id).First(&existingSyahriah).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data syahriah tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	// Authorization: hanya admin atau santri yang bersangkutan yang bisa bayar
	if !ctrl.isAdmin(c) && existingSyahriah.ID_Santri != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: Anda tidak memiliki akses untuk melakukan pembayaran ini"})
		return
	}

	// Update status menjadi lunas
	existingSyahriah.Status = models.StatusLunas
	existingSyahriah.WaktuCatat = time.Now() // Update waktu catat saat pembayaran

	// Simpan perubahan
	if err := ctrl.db.Save(&existingSyahriah).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal melakukan pembayaran: " + err.Error()})
		return
	}

	// Preload relations untuk response
	ctrl.db.Preload("Santri").Preload("Santri.Wali").Preload("Admin").First(&existingSyahriah, "id_syahriah = ?", existingSyahriah.IDSyahriah)

	ctrl.updateRekapOtomatis(existingSyahriah)

	c.JSON(http.StatusOK, gin.H{
		"message": "Pembayaran syahriah berhasil",
		"data":    existingSyahriah,
	})
}

// DeleteSyahriah menghapus data syahriah (hanya admin)
func (ctrl *SyahriahController) DeleteSyahriah(c *gin.Context) {
	// Hanya admin yang bisa delete
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat menghapus data syahriah"})
		return
	}

	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID syahriah diperlukan"})
		return
	}

	// Cek apakah syahriah exists
	var syahriah models.Syahriah
	err := ctrl.db.Where("id_syahriah = ?", id).First(&syahriah).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data syahriah tidak ditemukan"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	bulan := syahriah.Bulan

	// Hapus syahriah
	if err := ctrl.db.Where("id_syahriah = ?", id).Delete(&models.Syahriah{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data syahriah: " + err.Error()})
		return
	}

	rekapController := NewRekapController(ctrl.db)
	if err := rekapController.UpdateRekapByBulan(bulan); err != nil {
		fmt.Printf("Gagal update rekap: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Data syahriah berhasil dihapus",
	})
}

// GetSyahriahSummary mendapatkan summary syahriah
func (ctrl *SyahriahController) GetSyahriahSummary(c *gin.Context) {
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Build query berdasarkan role
	query := ctrl.db.Model(&models.Syahriah{})
	if !ctrl.isAdmin(c) {
		query = query.Where("id_santri = ?", userID)
	}

	// Hitung total
	var total int64
	if err := query.Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total syahriah: " + err.Error()})
		return
	}

	// Hitung lunas
	var lunas int64
	if err := query.Where("status = ?", models.StatusLunas).Count(&lunas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung syahriah lunas: " + err.Error()})
		return
	}

	// Hitung belum lunas
	var belum int64
	if err := query.Where("status = ?", models.StatusBelum).Count(&belum).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung syahriah belum lunas: " + err.Error()})
		return
	}

	// Total nominal yang sudah dibayar (hanya yang status lunas)
	var totalNominal float64
	if err := query.Where("status = ?", models.StatusLunas).
		Select("COALESCE(SUM(nominal), 0)").
		Scan(&totalNominal).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total nominal: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"total":         total,
			"lunas":         lunas,
			"belum_lunas":   belum,
			"total_nominal": totalNominal,
		},
	})
}

// BatchCreateSyahriah membuat data syahriah untuk semua santri yang belum memiliki data di bulan tertentu
func (ctrl *SyahriahController) BatchCreateSyahriah(c *gin.Context) {
	// Hanya admin yang bisa create batch
	if !ctrl.isAdmin(c) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Forbidden: hanya admin yang dapat membuat data syahriah batch"})
		return
	}

	// Get admin ID dari token
	adminID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	var req struct {
		Bulan   string  `json:"bulan" binding:"required"` // format YYYY-MM
		Nominal float64 `json:"nominal"`
		Status  string  `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validasi format bulan (YYYY-MM)
	_, err := time.Parse("2006-01", req.Bulan)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format bulan tidak valid. Gunakan format YYYY-MM"})
		return
	}

	// Set default nominal jika tidak diisi
	if req.Nominal == 0 {
		req.Nominal = 110000 // default value
	}

	// Validasi status
	var status models.StatusSyahriah
	if req.Status != "" {
		status = models.StatusSyahriah(req.Status)
		if status != models.StatusBelum && status != models.StatusLunas {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Status tidak valid. Gunakan 'belum' atau 'lunas'"})
			return
		}
	} else {
		status = models.StatusBelum // default
	}

	// Dapatkan hanya santri dengan status aktif
	var santriList []models.Santri
	if err := ctrl.db.Where("status = ?", "aktif").Find(&santriList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data santri aktif: " + err.Error()})
		return
	}

	if len(santriList) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tidak ada data santri aktif yang tersedia"})
		return
	}

	// Dapatkan santri aktif yang sudah memiliki syahriah di bulan ini
	var existingSantri []string
	if err := ctrl.db.Model(&models.Syahriah{}).
		Joins("JOIN santri ON syahriah.id_santri = santri.id_santri").
		Where("syahriah.bulan = ? AND santri.status = ?", req.Bulan, "aktif").
		Pluck("syahriah.id_santri", &existingSantri).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memeriksa data syahriah yang sudah ada: " + err.Error()})
		return
	}

	// Buat map untuk pengecekan cepat
	existingMap := make(map[string]bool)
	for _, id := range existingSantri {
		existingMap[id] = true
	}

	var syahriahList []models.Syahriah
	var createdCount int

	for _, santri := range santriList {
		// Skip jika santri sudah memiliki data syahriah untuk bulan ini
		if existingMap[santri.IDSantri] {
			continue
		}

		syahriah := models.Syahriah{
			IDSyahriah:  uuid.New().String(),
			ID_Santri:    santri.IDSantri,
			Bulan:       req.Bulan,
			Nominal:     req.Nominal,
			Status:      status,
			DicatatOleh: adminID,
			WaktuCatat:  time.Now(),
		}
		syahriahList = append(syahriahList, syahriah)
		createdCount++
	}

	if len(syahriahList) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message": "Semua santri aktif sudah memiliki data syahriah untuk bulan ini",
			"data": gin.H{
				"created":      0,
				"total_santri_aktif": len(santriList),
			},
		})
		return
	}

	// Simpan ke database dalam batch
	if err := ctrl.db.CreateInBatches(&syahriahList, 100).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat data syahriah batch: " + err.Error()})
		return
	}

	// Update rekap untuk bulan ini
	rekapController := NewRekapController(ctrl.db)
	bulanTime, _ := time.Parse("2006-01", req.Bulan)
	if err := rekapController.UpdateRekapOtomatis(bulanTime); err != nil {
		fmt.Printf("Gagal update rekap: %v\n", err)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": fmt.Sprintf("Berhasil membuat data syahriah untuk %d santri aktif", createdCount),
		"data": gin.H{
			"created":      createdCount,
			"total_santri_aktif": len(santriList),
			"skipped":      len(santriList) - createdCount,
			"bulan":        req.Bulan,
		},
	})
}

// GetSyahriahForWali mendapatkan data syahriah untuk wali (semua santri yang terhubung)
func (ctrl *SyahriahController) GetSyahriahForWali(c *gin.Context) {
	userID, exists := ctrl.getUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
		return
	}

	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	bulan := c.Query("bulan")
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// Cari semua santri yang terhubung dengan wali ini
	var santriList []models.Santri
	if err := ctrl.db.Where("id_wali = ?", userID).Find(&santriList).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data santri: " + err.Error()})
		return
	}

	if len(santriList) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"data": []models.Syahriah{},
			"meta": gin.H{
				"page":       page,
				"limit":      limit,
				"total":      0,
				"total_page": 0,
			},
		})
		return
	}

	// Ambil ID santri
	santriIDs := make([]string, len(santriList))
	for i, santri := range santriList {
		santriIDs[i] = santri.IDSantri
	}

	var syahriah []models.Syahriah
	var total int64

	// Build query untuk syahriah santri-santri wali
	query := ctrl.db.Preload("Santri").Preload("Santri.Wali").Preload("Admin").
		Where("id_santri IN ?", santriIDs)

	// Apply filters
	if bulan != "" {
		query = query.Where("bulan = ?", bulan)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Hitung total records
	if err := query.Model(&models.Syahriah{}).Count(&total).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total data: " + err.Error()})
		return
	}

	// Apply pagination
	offset := (page - 1) * limit
	err := query.Order("bulan DESC, waktu_catat DESC").
		Offset(offset).
		Limit(limit).
		Find(&syahriah).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data syahriah: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": syahriah,
		"meta": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"total_page": (int(total) + limit - 1) / limit,
		},
	})
}

// GetSyahriahSummaryForWali mendapatkan summary syahriah untuk wali
func (ctrl *SyahriahController) GetSyahriahSummaryForWali(c *gin.Context) {
    userID, exists := ctrl.getUserID(c)
    if !exists {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: user ID tidak ditemukan"})
        return
    }

    // Cari semua santri yang terhubung dengan wali ini
    var santriList []models.Santri
    if err := ctrl.db.Where("id_wali = ?", userID).Find(&santriList).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data santri: " + err.Error()})
        return
    }

    if len(santriList) == 0 {
        c.JSON(http.StatusOK, gin.H{
            "data": gin.H{
                "total":         0,
                "lunas":         0,
                "belum_lunas":   0,
                "total_nominal": 0,
            },
        })
        return
    }

    // Ambil ID santri
    santriIDs := make([]string, len(santriList))
    for i, santri := range santriList {
        santriIDs[i] = santri.IDSantri
    }

    // Build query
    query := ctrl.db.Model(&models.Syahriah{}).Where("id_santri IN ?", santriIDs)

    // Hitung total
    var total int64
    if err := query.Count(&total).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total syahriah: " + err.Error()})
        return
    }

    // Hitung lunas
    var lunas int64
    if err := query.Where("status = ?", models.StatusLunas).Count(&lunas).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung syahriah lunas: " + err.Error()})
        return
    }

    // Hitung belum lunas
    var belum int64
    if err := query.Where("status = ?", models.StatusBelum).Count(&belum).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung syahriah belum lunas: " + err.Error()})
        return
    }

    // Total nominal yang sudah dibayar (hanya yang status lunas)
    var totalNominal float64
    if err := query.Where("status = ?", models.StatusLunas).
        Select("COALESCE(SUM(nominal), 0)").
        Scan(&totalNominal).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghitung total nominal: " + err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "data": gin.H{
            "total":         total,
            "lunas":         lunas,
            "belum_lunas":   belum,
            "total_nominal": totalNominal,
        },
    })
}