from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Importar módulos locales
from src.database import get_database, init_db
from src.models import *
from src.api import router
from src.config import API_CONFIG, validate_config

# Cargar variables de entorno
load_dotenv()

# Validar configuración al iniciar
validate_config()

# Crear aplicación FastAPI usando configuración
app = FastAPI(
    title=API_CONFIG["title"],
    description=API_CONFIG["description"],
    version=API_CONFIG["version"]
)

# Configurar CORS usando configuración
app.add_middleware(
    CORSMiddleware,
    allow_origins=API_CONFIG["cors_origins"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas de la API
app.include_router(router, prefix="/api/v1")

# Endpoint de salud
@app.get("/")
async def root():
    return {"message": "InemecTest API está funcionando", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    try:
        # Verificar conexión a base de datos
        db = await get_database()
        await db.fetch_one("SELECT 1")
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected", "error": str(e)}
        )

# Inicializar base de datos al arrancar
@app.on_event("startup")
async def startup_event():
    await init_db()
    print("✅ Base de datos inicializada")
    
    # Cargar datos desde Excel o usar ejemplos
    try:
        from src.excel_data_loader import check_data_exists, load_data_from_excel
        data_count = await check_data_exists()
        
        if data_count["procedures"] == 0:
            print("📊 No hay datos, cargando desde Excel...")
            await load_data_from_excel()
        else:
            print(f"📊 Datos existentes: {data_count['procedures']} procedimientos, {data_count['questions']} preguntas")
    except Exception as e:
        print(f"⚠️ Error cargando datos: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    print("🔄 Cerrando aplicación...")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host=API_CONFIG["host"], 
        port=API_CONFIG["port"], 
        reload=True
    )