#!/usr/bin/env python3
"""
Script para debuggear la inconsistencia de datos entre estadísticas filtradas y no filtradas
"""

import sys
import os
import asyncio
import pandas as pd

# Agregar el directorio src al path
sys.path.append('/app/src')

from src.excel_handler import ExcelHandler

async def debug_data_consistency():
    """Debuggear la consistencia de datos entre filtros"""
    
    print("🔍 DEBUGGING CONSISTENCIA DE DATOS")
    print("=" * 80)
    
    try:
        # Crear instancia del handler
        excel_handler = ExcelHandler()
        
        # Obtener todas las evaluaciones
        all_evaluations = await excel_handler.get_all_evaluations()
        
        print(f"📊 Total evaluaciones encontradas: {len(all_evaluations)}")
        print()
        
        if not all_evaluations:
            print("❌ No se encontraron evaluaciones")
            return
        
        # Analizar estadísticas generales
        print("📈 ESTADÍSTICAS GENERALES:")
        print("-" * 40)
        
        aprovado_conocimiento_count = 0
        aprovado_aplicado_count = 0
        campos_stats = {}
        
        for eval_data in all_evaluations:
            # Procesar campo
            campo = eval_data.get("campo", "Sin campo")
            if campo:
                campos_stats[campo] = campos_stats.get(campo, 0) + 1
            
            # Contar aprobación conocimiento
            aprobo_conocimiento = eval_data.get("aprobo_conocimiento", "")
            if str(aprobo_conocimiento).lower() in ["sí", "si", "yes", "true", "1"]:
                aprovado_conocimiento_count += 1
            
            # Contar aprobación aplicado
            aprobo_aplicado = eval_data.get("aprobo", "")
            if str(aprobo_aplicado).lower() in ["sí", "si", "yes", "true", "1"]:
                aprovado_aplicado_count += 1
        
        conocimiento_rate = (aprovado_conocimiento_count / len(all_evaluations)) * 100
        aplicado_rate = (aprovado_aplicado_count / len(all_evaluations)) * 100
        
        print(f"Total: {len(all_evaluations)} evaluaciones")
        print(f"Campos: {campos_stats}")
        print(f"Conocimiento aprobado: {aprovado_conocimiento_count}/{len(all_evaluations)} ({conocimiento_rate:.2f}%)")
        print(f"Aplicado aprobado: {aprovado_aplicado_count}/{len(all_evaluations)} ({aplicado_rate:.2f}%)")
        print()
        
        # Analizar datos filtrados por cupiagua
        print("🔍 ANÁLISIS FILTRADO (campo=cupiagua):")
        print("-" * 40)
        
        filtered_evaluations = [
            e for e in all_evaluations 
            if e.get("campo", "").lower() == "cupiagua"
        ]
        
        print(f"Evaluaciones filtradas: {len(filtered_evaluations)}")
        
        if filtered_evaluations:
            aprovado_conocimiento_filtered = 0
            aprovado_aplicado_filtered = 0
            
            print("\nDetalle de evaluaciones filtradas:")
            for i, eval_data in enumerate(filtered_evaluations, 1):
                cedula = eval_data.get("cedula", "N/A")
                score = eval_data.get("score_percentage", 0)
                aprobo_conocimiento = eval_data.get("aprobo_conocimiento", "")
                aprobo_aplicado = eval_data.get("aprobo", "")
                
                print(f"  {i}. Cédula: {cedula}")
                print(f"     Score: {score}% -> Conocimiento: {aprobo_conocimiento}")
                print(f"     Aplicado: {aprobo_aplicado}")
                print()
                
                # Contar aprobados
                if str(aprobo_conocimiento).lower() in ["sí", "si", "yes", "true", "1"]:
                    aprovado_conocimiento_filtered += 1
                
                if str(aprobo_aplicado).lower() in ["sí", "si", "yes", "true", "1"]:
                    aprovado_aplicado_filtered += 1
            
            conocimiento_rate_filtered = (aprovado_conocimiento_filtered / len(filtered_evaluations)) * 100
            aplicado_rate_filtered = (aprovado_aplicado_filtered / len(filtered_evaluations)) * 100
            
            print(f"Conocimiento aprobado (filtrado): {aprovado_conocimiento_filtered}/{len(filtered_evaluations)} ({conocimiento_rate_filtered:.2f}%)")
            print(f"Aplicado aprobado (filtrado): {aprovado_aplicado_filtered}/{len(filtered_evaluations)} ({aplicado_rate_filtered:.2f}%)")
        
        # Mostrar datos raw para identificar diferencias
        print("\n🔍 DATOS RAW DE EJEMPLO:")
        print("-" * 40)
        for i, eval_data in enumerate(all_evaluations[:3], 1):
            print(f"Evaluación {i}:")
            print(f"  Campo: {eval_data.get('campo', 'N/A')}")
            print(f"  Score: {eval_data.get('score_percentage', 'N/A')}")
            print(f"  Aprobo conocimiento: '{eval_data.get('aprobo_conocimiento', 'N/A')}'")
            print(f"  Aprobo aplicado: '{eval_data.get('aprobo', 'N/A')}'")
            print()
        
    except Exception as e:
        print(f"❌ Error en debug: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_data_consistency())