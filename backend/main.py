from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Importar módulos locales
from src.database import get_database, init_db
from src.models import *
from src.api import router

# Cargar variables de entorno
load_dotenv()

# Crear aplicación FastAPI
app = FastAPI(
    title="InemecTest API",
    description="API para sistema de evaluación de conocimientos técnicos",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:3000", "http://localhost:5173"],
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
    
    # Insertar datos de ejemplo si no existen
    try:
        from src.sample_data import check_data_exists, insert_sample_data
        data_count = await check_data_exists()
        
        if data_count["procedures"] == 0:
            print("📝 No hay datos, insertando ejemplos...")
            await insert_sample_data()
        else:
            print(f"📊 Datos existentes: {data_count['procedures']} procedimientos, {data_count['questions']} preguntas")
    except Exception as e:
        print(f"⚠️ Error con datos de ejemplo: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    print("🔄 Cerrando aplicación...")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)