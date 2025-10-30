package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"tpq_asysyafii/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	// Ambil environment variables
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbname := os.Getenv("DB_NAME")

	// DSN MySQL dengan parameter optimasi
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local&timeout=10s&readTimeout=10s&writeTimeout=10s",
		user, pass, host, port, dbname)

	// Config dengan timeout context
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
		NowFunc: func() time.Time {
			return time.Now().Local()
		},
	})
	if err != nil {
		log.Printf("❌ Gagal koneksi DB: %v", err)
		DB = nil
		return
	}

	// Ambil koneksi SQL mentah buat atur pooling
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("❌ Gagal ambil koneksi DB: %v", err)
		DB = nil
		return
	}

	// ⚡ OPTIMASI KRITIS: Kurangi koneksi untuk shared environment
	sqlDB.SetMaxOpenConns(1)           // MAX 1 koneksi aktif
    sqlDB.SetMaxIdleConns(0)           // NO koneksi idle  
    sqlDB.SetConnMaxLifetime(5 * time.Minute)
    sqlDB.SetConnMaxIdleTime(1 * time.Minute)

	// Test connection dengan timeout
	pingCtx, pingCancel := context.WithTimeout(ctx, 5*time.Second)
	defer pingCancel()
	
	if err := sqlDB.PingContext(pingCtx); err != nil {
		log.Printf("❌ Database ping failed: %v", err)
		sqlDB.Close()
		DB = nil
		return
	}

	DB = db
	log.Printf("✅ Database terkoneksi (MaxOpen: 2, MaxIdle: 1)")

	// AutoMigrate dalam goroutine terpisah agar tidak block startup
	go migrateDB(db)
}

func CloseDB() {
    if DB != nil {
        if sqlDB, err := DB.DB(); err == nil {
            sqlDB.Close()
        }
    }
}

func migrateDB(db *gorm.DB) {
    log.Printf("🔄 Starting database migration...")
    
    start := time.Now()
    
    // Cek koneksi sebelum migration
    if !config.CheckDBHealth() {
        log.Printf("⚠️ Skip migration: database not healthy")
        return
    }
    
    // Migration dengan timeout
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    // Use transaction for migration
    err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
        return tx.AutoMigrate(
            &models.User{},
            &models.Keluarga{},
            &models.Santri{},
		&models.Syahriah{},
		&models.Donasi{},
		&models.PemakaianSaldo{},
		&models.RekapSaldo{},
		&models.Pengumuman{},
		&models.Berita{},
		&models.Fasilitas{},
		&models.Testimoni{},
		&models.InformasiTPQ{},
		&models.SosialMedia{},
		&models.ProgramUnggulan{},
		&models.LogAktivitas{},
	)
})
	
	if err != nil {
		log.Printf("⚠️ Migration warning: %v", err)
		// Jangan fatal, biarkan aplikasi tetap running
	} else {
		log.Printf("✅ Migration completed in %v", time.Since(start))
	}
}

func GetDB() *gorm.DB {
	return DB
}

// Function untuk health check database
func CheckDBHealth() bool {
	if DB == nil {
		return false
	}
	
	sqlDB, err := DB.DB()
	if err != nil {
		return false
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	return sqlDB.PingContext(ctx) == nil
}
func PrintDBStats() {
    if DB == nil {
        log.Println("❌ DB is nil")
        return
    }
    
    sqlDB, err := DB.DB()
    if err != nil {
        log.Printf("❌ Failed to get DB stats: %v", err)
        return
    }
    
    stats := sqlDB.Stats()
    log.Printf("📊 DB Stats - OpenConnections: %d, InUse: %d, Idle: %d", 
        stats.OpenConnections, stats.InUse, stats.Idle)
}