#!/usr/bin/env python3
"""
Script para debuggear los valores de campo disponibles en procedimientos
"""

import sys
import os
import asyncio
import pandas as pd

# Agregar el directorio src al path
sys.path.append('/app/src')

from src.excel_handler import ExcelHandler

async def debug_campos():
    """Debuggear los valores de campo en procedimientos"""
    
    print("🔍 DEBUGGING VALORES DE CAMPO EN PROCEDIMIENTOS")
    print("=" * 80)
    
    try:
        # Crear instancia del handler
        excel_handler = ExcelHandler()
        
        # Obtener todos los procedimientos
        procedures = await excel_handler.get_all_procedures()
        
        print(f"📊 Total procedimientos encontrados: {len(procedures)}")
        print()
        
        if not procedures:
            print("❌ No se encontraron procedimientos")
            return
        
        # Analizar campos únicos
        print("📈 ANÁLISIS DE CAMPOS:")
        print("-" * 40)
        
        campos = {}
        
        for proc in procedures:
            campo = proc.get('datos_completos', {}).get('campo', '')
            if campo:
                if campo not in campos:
                    campos[campo] = []
                campos[campo].append(proc['codigo'])
        
        print(f"Campos únicos encontrados: {len(campos)}")
        print()
        
        for campo, codigos in sorted(campos.items()):
            print(f"📌 Campo: \"{campo}\"")
            print(f"   Procedimientos: {len(codigos)}")
            print(f"   Ejemplos: {', '.join(codigos[:3])}{'...' if len(codigos) > 3 else ''}")
            print()
        
        # Mostrar algunos ejemplos completos
        print("🔍 EJEMPLOS DE PROCEDIMIENTOS:")
        print("-" * 40)
        for i, proc in enumerate(procedures[:5], 1):
            print(f"{i}. Código: {proc['codigo']}")
            print(f"   Nombre: {proc['nombre']}")
            print(f"   Disciplina: {proc['datos_completos'].get('disciplina', 'N/A')}")
            print(f"   Campo: {proc['datos_completos'].get('campo', 'N/A')}")
            print()
        
    except Exception as e:
        print(f"❌ Error en debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_campos())