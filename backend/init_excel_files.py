#!/usr/bin/env python3
"""
Script para inicializar los archivos Excel necesarios
"""

import sys
import os
import asyncio
from pathlib import Path

# Agregar el directorio src al path para importar módulos
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from src.excel_handler import ExcelHandler
from src.config import get_data_file_path, get_results_file_path

async def init_excel_files():
    """Inicializar archivos Excel necesarios"""
    print("🚀 Inicializando archivos Excel...")
    
    handler = ExcelHandler()
    
    # Crear archivo de resultados
    results_file = get_results_file_path()
    if not results_file.exists():
        print(f"📝 Creando archivo de resultados: {results_file}")
        await handler._create_results_file()
    else:
        print(f"✅ Archivo de resultados ya existe: {results_file}")
    
    # Verificar si existe archivo de datos
    data_file = get_data_file_path()
    if data_file.exists():
        print(f"✅ Archivo de datos encontrado: {data_file}")
    else:
        print(f"⚠️  Archivo de datos NO encontrado: {data_file}")
        print("   Debe existir para que el sistema funcione correctamente")
    
    print("✅ Inicialización completada")

if __name__ == "__main__":
    asyncio.run(init_excel_files())