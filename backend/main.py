"""
Aplicación principal InemecTest - Versión simplificada basada en Excel
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from pathlib import Path
from datetime import datetime

# Importar módulos locales
from src.config import API_CONFIG, validate_config, ensure_data_directory
from src.models import HealthCheck, APIResponse
from src.api import router
from src.excel_handler import ExcelHandler

# Validar configuración al iniciar
print("🚀 Iniciando InemecTest...")
if not validate_config():
    print("❌ Error en configuración. Deteniendo aplicación.")
    exit(1)

# Crear aplicación FastAPI
app = FastAPI(
    title=API_CONFIG["title"],
    description=API_CONFIG["description"],
    version=API_CONFIG["version"],
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=API_CONFIG["cors_origins"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Incluir rutas de la API
app.include_router(router, prefix="/api/v1", tags=["InemecTest API"])

# Inicializar handler de Excel
excel_handler = ExcelHandler()

# =============================================================================
# EVENTOS DE STARTUP Y SHUTDOWN
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """Inicializar aplicación"""
    try:
        print("📁 Verificando directorios...")
        ensure_data_directory()
        
        print("📊 Validando archivos Excel...")
        validation_result = await excel_handler.validate_data_file()
        
        if validation_result["exists"] and validation_result["valid"]:
            print(f"✅ Archivo de datos válido: {validation_result['procedures_count']} procedimientos, {validation_result['questions_count']} preguntas")
        else:
            print("⚠️ Archivo de datos no encontrado o inválido")
            if validation_result["errors"]:
                for error in validation_result["errors"]:
                    print(f"   - {error}")
            print("📝 Por favor, asegúrese de que el archivo Excel esté en la ubicación correcta")
        
        # Verificar archivo de resultados
        if excel_handler.results_file.exists():
            evaluations = await excel_handler.get_all_evaluations()
            print(f"📈 Archivo de resultados encontrado: {len(evaluations)} evaluaciones")
        else:
            print("📄 Archivo de resultados será creado automáticamente")
        
        print("✅ InemecTest iniciado correctamente")
        print(f"🌐 API disponible en: http://{API_CONFIG['host']}:{API_CONFIG['port']}")
        print(f"📚 Documentación en: http://{API_CONFIG['host']}:{API_CONFIG['port']}/docs")
        
    except Exception as e:
        print(f"❌ Error durante startup: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup al cerrar aplicación"""
    print("🔄 Cerrando InemecTest...")
    print("✅ Aplicación cerrada correctamente")

# =============================================================================
# ENDPOINTS PRINCIPALES
# =============================================================================

@app.get("/", tags=["General"])
async def root():
    """Endpoint raíz de la API"""
    return APIResponse(
        success=True,
        message="InemecTest API está funcionando",
        data={
            "version": API_CONFIG["version"],
            "timestamp": datetime.now().isoformat(),
            "docs": "/docs",
            "status": "active"
        }
    )

@app.get("/health", response_model=HealthCheck, tags=["General"])
async def health_check():
    """Verificar estado de salud completo de la API"""
    try:
        # Verificar archivos Excel
        data_validation = await excel_handler.validate_data_file()
        results_file_exists = excel_handler.results_file.exists()
        
        excel_files_status = {
            "data_file_exists": data_validation["exists"],
            "data_file_valid": data_validation["valid"],
            "results_file_exists": results_file_exists,
            "procedures_count": data_validation.get("procedures_count", 0),
            "questions_count": data_validation.get("questions_count", 0)
        }
        
        # Determinar estado general
        if data_validation["exists"] and data_validation["valid"]:
            overall_status = "healthy"
        elif data_validation["exists"]:
            overall_status = "warning"
        else:
            overall_status = "error"
        
        return HealthCheck(
            status=overall_status,
            excel_files=excel_files_status,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "excel_files": {
                    "data_file_exists": False,
                    "data_file_valid": False,
                    "results_file_exists": False
                },
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
        )

@app.get("/info", tags=["General"])
async def get_system_info():
    """Obtener información general del sistema"""
    try:
        # Información de archivos
        data_validation = await excel_handler.validate_data_file()
        
        # Estadísticas básicas si hay archivo de resultados
        evaluations = []
        procedure_stats = []
        if excel_handler.results_file.exists():
            evaluations = await excel_handler.get_all_evaluations()
            procedure_stats = await excel_handler.get_procedure_statistics()
        
        return APIResponse(
            success=True,
            message="Información del sistema obtenida",
            data={
                "system": {
                    "name": "InemecTest",
                    "version": API_CONFIG["version"],
                    "mode": "Excel-based"
                },
                "data": {
                    "procedures_available": data_validation.get("procedures_count", 0),
                    "questions_available": data_validation.get("questions_count", 0),
                    "total_evaluations": len(evaluations),
                    "data_file_status": "valid" if data_validation["valid"] else "invalid"
                },
                "files": {
                    "data_file": str(excel_handler.data_file),
                    "results_file": str(excel_handler.results_file)
                },
                "top_procedures": procedure_stats[:5] if procedure_stats else []
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo información del sistema: {str(e)}")

# =============================================================================
# MANEJO DE ERRORES
# =============================================================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Manejador para errores 404"""
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "message": "Recurso no encontrado",
            "error_code": "NOT_FOUND",
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(500)
async def internal_server_error_handler(request, exc):
    """Manejador para errores 500"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Error interno del servidor",
            "error_code": "INTERNAL_ERROR",
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Manejador para HTTPExceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error_code": f"HTTP_{exc.status_code}",
            "timestamp": datetime.now().isoformat()
        }
    )

# =============================================================================
# FUNCIÓN PRINCIPAL
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    print(f"🚀 Iniciando servidor en {API_CONFIG['host']}:{API_CONFIG['port']}")
    
    uvicorn.run(
        "main:app",
        host=API_CONFIG["host"],
        port=API_CONFIG["port"],
        reload=True,
        log_level="info"
    )
    