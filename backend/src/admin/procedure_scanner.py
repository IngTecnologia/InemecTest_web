"""
Scanner de procedimientos para el módulo administrativo de InemecTest
Basado en la lógica de word_to_excel.py con integración al sistema existente
"""

import os
import json
import re
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from docx import Document
import pandas as pd
from .utils import create_tracking_key
from .utils import extract_procedure_code_and_version
from .config import get_admin_file_path, get_admin_directory_path

from ..config import (
    get_data_file_path,
    DATA_SHEETS,
    PROCEDURES_COLUMNS,
    ensure_data_directory
)

class ProcedureScanner:
    """
    Scanner de procedimientos que detecta archivos .docx nuevos o actualizados
    y determina cuáles necesitan generación de preguntas
    """
    
    def __init__(self, procedures_source_dir: str | None = None):
        """
        Inicializar scanner
        
        Args:
            procedures_source_dir: Directorio donde están los archivos .docx de procedimientos
        """

        if procedures_source_dir is None:
            procedures_source_dir = str(get_admin_directory_path("procedures_source"))
        self.procedures_source_dir = Path(procedures_source_dir)
        self.excel_file = get_data_file_path()
        self.tracking_file = get_admin_file_path("tracking")
        
        # Crear directorios si no existen
        ensure_data_directory()
        self.procedures_source_dir.mkdir(exist_ok=True)
        
        print(f"📁 Scanner inicializado:")
        print(f"   - Directorio fuente: {self.procedures_source_dir}")
        print(f"   - Archivo Excel: {self.excel_file}")
        print(f"   - Tracking file: {self.tracking_file}")
    
    def extraer_datos_encabezado(self, document: Document) -> Dict[str, Any]:
        """
        Extrae información del encabezado del documento
        Basado en word_to_excel.py
        """
        try:
            header = document.sections[0].header
            tables = header.tables
            if not tables:
                return {}
            
            tabla = tables[0]
            codigo = tabla.cell(0, 2).text.strip().replace("CÓDIGO:", "").strip()
            version = tabla.cell(1, 2).text.strip().replace("VERSIÓN:", "").strip()
            nombre = tabla.cell(2, 1).text.strip()
            edicion = tabla.cell(2, 2).text.strip().replace("EDICIÓN:", "").strip()
            
            return {
                "codigo": codigo,
                "nombre": nombre,
                "version": version,
                "edicion": edicion
            }
        except Exception as e:
            print(f"⚠️ Error procesando encabezado: {e}")
            return {}
    
    def detectar_secciones_principales(self, document: Document) -> Dict[str, int]:
        """
        Detecta los índices de inicio y fin de las secciones principales
        Basado en word_to_excel.py
        """
        indices = {}
        secciones_buscar = [
            "INFORMACIÓN GENERAL DEL PROCEDIMIENTO",
            "PELIGROS, RIESGOS Y CONTROLES DE LA ACTIVIDAD",
            "ASPECTOS E IMPACTOS AMBIENTALES Y CONTROLES DE LA ACTIVIDAD",
            "CONDICIONES PREVIAS A LA EJECUCION DE LA ACTIVIDAD",
            "DESCRIPCIÓN DE ACTIVIDADES",
            "CONSIDERACIONES POSTERIORES A LA EJECUCIÓN DE LA ACTIVIDAD"
        ]
        
        for i, para in enumerate(document.paragraphs):
            # Normalizar el texto para la comparación
            texto_normalizado = ' '.join(para.text.strip().split()).upper()
            
            for seccion in secciones_buscar:
                seccion_normalizada = ' '.join(seccion.strip().split()).upper()
                if seccion_normalizada in texto_normalizado:
                    indices[seccion] = i
                    break
        
        return indices
    
    def extraer_seccion_info_general(self, document: Document, indice_inicio: int, indice_fin: int) -> Dict[str, str]:
        """
        Extrae la información de la sección INFORMACIÓN GENERAL
        Basado en word_to_excel.py
        """
        patrones_subseccion = [
            (r"OBJETO", "OBJETO"),
            (r"ALCANCE", "ALCANCE"),
            (r"DISCIPLINA", "DISCIPLINA"),
            (r"RECURSOS REQUERIDOS", "RECURSOS_REQUERIDOS"),
            (r"ELEMENTOS PROTECCION PERSONAL", "ELEMENTOS_PROTECCION")
        ]
        
        info_general = {}
        subseccion_actual = None
        
        for i in range(indice_inicio + 1, indice_fin):
            if i >= len(document.paragraphs):
                break
                
            texto = document.paragraphs[i].text.strip()
            if not texto:
                continue
            
            # Verificar si es un título de subsección
            es_subseccion = False
            for patron, clave in patrones_subseccion:
                if re.search(patron, texto, re.IGNORECASE):
                    subseccion_actual = clave
                    info_general[subseccion_actual] = ""
                    es_subseccion = True
                    break
            
            # Si no es subsección y tenemos subsección actual, añadir contenido
            if not es_subseccion and subseccion_actual:
                if info_general[subseccion_actual]:
                    info_general[subseccion_actual] += "\n" + texto
                else:
                    info_general[subseccion_actual] = texto
        
        return info_general
    
    def extraer_texto_completo_seccion(self, document: Document, indice_inicio: int, indice_fin: int) -> str:
        """
        Extrae todo el texto entre dos índices de párrafo como un solo bloque
        Basado en word_to_excel.py
        """
        texto_completo = []
        
        for i in range(indice_inicio + 1, indice_fin):
            if i >= len(document.paragraphs):
                break
                
            texto = document.paragraphs[i].text.strip()
            if texto:
                texto_completo.append(texto)
        
        return "\n".join(texto_completo)
    
    
    def procesar_documento(self, ruta_archivo: Path) -> Dict[str, Any]:
        """
        Procesa un documento .docx y extrae toda la información relevante
        🔧 VERSIÓN CORREGIDA: Usa SOLO filename, ignora encabezado
        """
        try:
            doc = Document(ruta_archivo)
            
            # ✅ USAR SOLO FILENAME - Más confiable
            codigo_raw, version_final = extract_procedure_code_and_version(ruta_archivo.name)
            
            # ✅ LIMPIAR el código de prefijos no deseados
            codigo_final = self._limpiar_codigo(codigo_raw)
            
            # Extraer datos del encabezado SOLO para nombre (opcional)
            datos_encabezado = self.extraer_datos_encabezado(doc)
            nombre_encabezado = datos_encabezado.get("nombre", "")
            
            # 🎯 ESTRUCTURA SIMPLIFICADA usando solo filename
            datos = {
                # ✅ Datos principales desde FILENAME
                "codigo": codigo_final,
                "version": str(version_final),
                "nombre": nombre_encabezado or f"Procedimiento {codigo_final}",
                
                # Información básica
                "alcance": "",  # Se puede extraer después si es necesario
                "objetivo": "",  # Se puede extraer después si es necesario
                "archivo": ruta_archivo.name,
                "ruta_completa": str(ruta_archivo.absolute()),
                "fecha_escaneado": datetime.now().isoformat(),
                
                # Información adicional (opcional)
                "disciplina": "",
                "recursos_requeridos": "",
                "elementos_proteccion": "",
                "descripcion_actividades": ""
            }
            
            # 🔍 DEBUG: Mostrar datos procesados
            print(f"📄 Procesado: {ruta_archivo.name}")
            print(f"   - Código original: {codigo_raw}")
            print(f"   - Código limpio: {codigo_final}")
            print(f"   - Versión: {version_final}")
            print(f"   - Tracking key sería: {codigo_final}_v{version_final}")
            
            # Extraer secciones opcionales (mantienes si las necesitas)
            indices = self.detectar_secciones_principales(doc)
            
            if "INFORMACIÓN GENERAL DEL PROCEDIMIENTO" in indices and "PELIGROS, RIESGOS Y CONTROLES DE LA ACTIVIDAD" in indices:
                info_general = self.extraer_seccion_info_general(
                    doc, 
                    indices["INFORMACIÓN GENERAL DEL PROCEDIMIENTO"],
                    indices["PELIGROS, RIESGOS Y CONTROLES DE LA ACTIVIDAD"]
                )
                datos["alcance"] = info_general.get("ALCANCE", "")
                datos["objetivo"] = info_general.get("OBJETO", "")
            
            return datos
            
        except Exception as e:
            print(f"❌ Error procesando documento {ruta_archivo}: {e}")
            # ✅ Usar filename incluso en caso de error
            codigo_fallback, version_fallback = extract_procedure_code_and_version(ruta_archivo.name)
            codigo_fallback = self._limpiar_codigo(codigo_fallback)
            return {
                "codigo": codigo_fallback,
                "version": str(version_fallback),
                "nombre": f"ERROR: {ruta_archivo.name}",
                "alcance": "",
                "objetivo": "",
                "archivo": ruta_archivo.name,
                "error": str(e),
                "fecha_escaneado": datetime.now().isoformat()
            }

    def _limpiar_codigo(self, codigo: str) -> str:
        """
        Limpiar código de prefijos no deseados
        """
        import re
        
        # Remover prefijos comunes
        prefijos_a_remover = ["CODIGO:", "CÓDIGO:", "CODIGO ", "CÓDIGO "]
        
        codigo_limpio = codigo.strip()
        
        for prefijo in prefijos_a_remover:
            if codigo_limpio.upper().startswith(prefijo.upper()):
                codigo_limpio = codigo_limpio[len(prefijo):].strip()
                break
        
        # Validar formato final
        if not re.match(r'^PEP-PRO-\d+$', codigo_limpio):
            print(f"⚠️ Código limpiado no válido: '{codigo_limpio}' (original: '{codigo}')")
            # Intentar extraer PEP-PRO-XXX del texto
            pep_match = re.search(r'(PEP-PRO-\d+)', codigo_limpio)
            if pep_match:
                codigo_limpio = pep_match.group(1)
                print(f"   ✅ Código extraído: {codigo_limpio}")
        
        return codigo_limpio
    
    def cargar_tracking_data(self) -> Dict[str, Any]:
        """
        Cargar datos de tracking de generación de preguntas
        """
        if self.tracking_file.exists():
            try:
                with open(self.tracking_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"⚠️ Error cargando tracking data: {e}")
        
        # Estructura por defecto
        return {
            "generated_questions": {},  # {codigo_version: {...}}
            "last_scan": None,
            "scan_history": []
        }
    
    def guardar_tracking_data(self, tracking_data: Dict[str, Any]):
        """
        Guardar datos de tracking
        """
        try:
            with open(self.tracking_file, 'w', encoding='utf-8') as f:
                json.dump(tracking_data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"❌ Error guardando tracking data: {e}")
    
    
    def escanear_directorio(self) -> Dict[str, Any]:
        """
        Escanear directorio de procedimientos y detectar cambios
        """
        print(f"🔍 Escaneando directorio: {self.procedures_source_dir}")
        
        # Cargar tracking data
        tracking_data = self.cargar_tracking_data()
        
        # Escanear archivos .docx
        archivos_encontrados = []
        procedimientos_escaneados = []
        
        if not self.procedures_source_dir.exists():
            print(f"⚠️ Directorio no existe: {self.procedures_source_dir}")
            return {
                "success": False,
                "message": f"Directorio no existe: {self.procedures_source_dir}",
                "archivos_encontrados": 0,
                "procedimientos_nuevos": 0,
                "procedimientos_actualizados": 0,
                "cola_generacion": []
            }
        
        for archivo in self.procedures_source_dir.glob("*.docx"):
            if archivo.name.startswith("~$"):  # Ignorar archivos temporales de Word
                continue
                
            archivos_encontrados.append(archivo.name)
            
            # Procesar documento
            datos_procedimiento = self.procesar_documento(archivo)
            procedimientos_escaneados.append(datos_procedimiento)
        
        print(f"📄 Archivos .docx encontrados: {len(archivos_encontrados)}")
        
        # Analizar qué procedimientos necesitan preguntas
        cola_generacion = []
        procedimientos_nuevos = 0
        procedimientos_actualizados = 0
        
        for proc_data in procedimientos_escaneados:
            codigo = proc_data["codigo"]
            version = proc_data.get("version", "1")
            
            tracking_key = create_tracking_key(codigo, version)

            # Verificar si ya se completó el procesamiento
            if tracking_key in tracking_data.get("generated_questions", {}):
                status = tracking_data["generated_questions"][tracking_key].get("status")
                if status == "completed":
                    # Ya tiene preguntas generadas, no agregar a cola
                    continue

            # Si llegamos aquí, necesita procesamiento
            estado = "necesita_preguntas"
            procedimientos_nuevos += 1  # Simplificamos: todo lo nuevo cuenta como nuevo
            
            # Añadir a cola de generación
            item_cola = {
                "codigo": codigo,
                "nombre": proc_data["nombre"],
                "version": version,
                "archivo": proc_data["archivo"],
                "estado": estado,
                "tracking_key": tracking_key,
                "datos_completos": proc_data
            }
            
            cola_generacion.append(item_cola)
        
        # Actualizar tracking data
        scan_info = {
            "timestamp": datetime.now().isoformat(),
            "archivos_escaneados": len(archivos_encontrados),
            "procedimientos_en_cola": len(cola_generacion)
        }
        
        tracking_data["last_scan"] = scan_info
        tracking_data["scan_history"].append(scan_info)
        
        # Mantener solo últimos 10 scans en historial
        if len(tracking_data["scan_history"]) > 10:
            tracking_data["scan_history"] = tracking_data["scan_history"][-10:]
        
        self.guardar_tracking_data(tracking_data)
        
        resultado = {
            "success": True,
            "message": f"Escaneo completado: {len(archivos_encontrados)} archivos procesados",
            "archivos_encontrados": len(archivos_encontrados),
            "procedimientos_pendientes": procedimientos_nuevos,  # ✅ cambiar nombre
            "cola_generacion": cola_generacion,
            "tracking_file": str(self.tracking_file),
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"✅ Escaneo completado:")
        print(f"   - Archivos encontrados: {len(archivos_encontrados)}")
        print(f"   - Procedimientos nuevos: {procedimientos_nuevos}")
        print(f"   - Procedimientos actualizados: {procedimientos_actualizados}")
        print(f"   - Total en cola: {len(cola_generacion)}")
        
        return resultado
    
    def get_generation_queue(self) -> List[Dict[str, Any]]:
        """
        Obtener cola actual de generación
        """
        resultado_scan = self.escanear_directorio()
        return resultado_scan.get("cola_generacion", [])
    
    def marcar_como_generado(self, codigo: str, version: str, preguntas_data: Dict[str, Any]):
        """
        Marcar un procedimiento como que ya tiene preguntas generadas
        """
        tracking_data = self.cargar_tracking_data()
        # Normalizar el código antes de construir la clave de tracking
        codigo_limpio = self._limpiar_codigo(codigo)
        tracking_key = create_tracking_key(codigo_limpio, version)
        
        # CORREGIDO: Manejar diferentes tipos de datos de preguntas
        preguntas_count = 0
        if isinstance(preguntas_data, dict):
            if "preguntas" in preguntas_data:
                preguntas_value = preguntas_data["preguntas"]
                if isinstance(preguntas_value, list):
                    preguntas_count = len(preguntas_value)
                elif isinstance(preguntas_value, int):
                    preguntas_count = preguntas_value
                else:
                    preguntas_count = 5  # Default
            elif "batch_id" in preguntas_data:
                preguntas_count = 5  # Default para lotes
            else:
                preguntas_count = 5  # Default
        elif isinstance(preguntas_data, list):
            preguntas_count = len(preguntas_data)
        elif isinstance(preguntas_data, int):
            preguntas_count = preguntas_data
        else:
            preguntas_count = 5  # Default
        
        tracking_data["generated_questions"][tracking_key] = {
            "codigo": codigo,
            "version": version,
            "fecha_generacion": datetime.now().isoformat(),
            "preguntas_count": preguntas_count,
            "status": "completed",
            "batch_info": preguntas_data if isinstance(preguntas_data, dict) else {"count": preguntas_count}
        }
        
        self.guardar_tracking_data(tracking_data)
        print(f"✅ Marcado como generado: {tracking_key} ({preguntas_count} preguntas)")
    
    def remover_de_cola(self, codigo: str, version: str) -> bool:
        """
        Remover un procedimiento de la cola de generación
        (marcándolo como procesado sin generar preguntas)
        """
        tracking_data = self.cargar_tracking_data()
        tracking_key = create_tracking_key(codigo, version)
        
        tracking_data["generated_questions"][tracking_key] = {
            "codigo": codigo,
            "version": version,
            "fecha_marcado": datetime.now().isoformat(),
            "status": "skipped",
            "reason": "removed_from_queue"
        }
        
        self.guardar_tracking_data(tracking_data)
        print(f"🚫 Removido de cola: {tracking_key}")
        return True

# =============================================================================
# FUNCIONES DE UTILIDAD
# =============================================================================

def crear_scanner(procedures_dir: str = None) -> ProcedureScanner:
    """
    Crear instancia del scanner con configuración por defecto
    """
    if procedures_dir is None:
        procedures_dir = os.getenv(
            "PROCEDURES_SOURCE_DIR",
            str(get_admin_directory_path("procedures_source"))
        )
    
    return ProcedureScanner(procedures_dir)

def escanear_procedimientos_rapido(procedures_dir: str = None) -> Dict[str, Any]:
    """
    Función de conveniencia para escaneo rápido
    """
    scanner = crear_scanner(procedures_dir)
    return scanner.escanear_directorio()

# =============================================================================
# TESTING
# =============================================================================

if __name__ == "__main__":
    # Test básico del scanner
    print("🧪 Testing ProcedureScanner...")
    
    scanner = crear_scanner()
    resultado = scanner.escanear_directorio()
    
    print(f"\n📊 Resultado del escaneo:")
    print(f"   - Success: {resultado['success']}")
    print(f"   - Archivos encontrados: {resultado['archivos_encontrados']}")
    print(f"   - Procedimientos nuevos: {resultado['procedimientos_nuevos']}")
    print(f"   - Procedimientos actualizados: {resultado['procedimientos_actualizados']}")
    print(f"   - Items en cola: {len(resultado['cola_generacion'])}")
    
    if resultado['cola_generacion']:
        print(f"\n📋 Primeros items en cola:")
        for i, item in enumerate(resultado['cola_generacion'][:3]):
            print(f"   {i+1}. {item['codigo']} v{item['version']} - {item['estado']}")