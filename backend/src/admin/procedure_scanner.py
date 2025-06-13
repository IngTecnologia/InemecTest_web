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
    
    def __init__(self, procedures_source_dir: str = "data/procedures_source"):
        """
        Inicializar scanner
        
        Args:
            procedures_source_dir: Directorio donde están los archivos .docx de procedimientos
        """
        self.procedures_source_dir = Path(procedures_source_dir)
        self.excel_file = get_data_file_path()
        self.tracking_file = Path("data/question_generation_tracking.json")
        
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
    
    def extraer_codigo_version_desde_filename(self, filename: str) -> Tuple[str, int]:
        """
        Extrae código y versión desde el nombre del archivo
        Formatos soportados:
        - PEP-PRO-1141.docx (versión 1 por defecto)
        - PEP-PRO-1141 V.2.docx (versión 2)
        - PEP-PRO-1141 V.3.docx (versión 3)
        """
        # Remover extensión
        base_name = filename.replace('.docx', '').replace('.doc', '')
        
        # Detectar versión - formato: PEP-PRO-XXX V.2
        version = 1  # Versión por defecto
        codigo = base_name
        
        # Buscar versión en formato " V.2", " V.3", etc. (con espacio)
        version_match = re.search(r' V\.(\d+)$', base_name)
        if version_match:
            version = int(version_match.group(1))
            # Remover la parte de versión para obtener el código
            codigo = base_name[:version_match.start()]
        
        # Validar que el código tenga el formato correcto PEP-PRO-XXX
        if not re.match(r'^PEP-PRO-\d+$', codigo):
            print(f"⚠️ Formato de código no esperado: {codigo} (archivo: {filename})")
            # Intentar extraer solo la parte PEP-PRO-XXX si hay caracteres extra
            pep_match = re.search(r'(PEP-PRO-\d+)', codigo)
            if pep_match:
                codigo = pep_match.group(1)
                print(f"   ✅ Código corregido a: {codigo}")
        
        print(f"📄 Archivo procesado: {filename} → Código: {codigo}, Versión: {version}")
        return codigo, version
    
    def procesar_documento(self, ruta_archivo: Path) -> Dict[str, Any]:
        """
        Procesa un documento .docx y extrae toda la información relevante
        """
        try:
            doc = Document(ruta_archivo)
            
            # Extraer código y versión desde filename
            codigo_filename, version_filename = self.extraer_codigo_version_desde_filename(ruta_archivo.name)
            
            # Extraer datos del encabezado
            datos_encabezado = self.extraer_datos_encabezado(doc)
            
            # Usar código del encabezado si existe, sino del filename
            codigo_final = datos_encabezado.get("codigo", codigo_filename)
            version_final = datos_encabezado.get("version", str(version_filename))
            
            # Datos básicos para compatibilidad con Excel existente
            datos = {
                # Columnas requeridas por PROCEDURES_COLUMNS
                "codigo": codigo_final,
                "nombre": datos_encabezado.get("nombre", ""),
                "alcance": "",  # Se extraerá de la sección INFORMACIÓN GENERAL
                "objetivo": "",  # Se extraerá de la sección INFORMACIÓN GENERAL
                
                # Información adicional del encabezado
                "version": version_final,
                "edicion": datos_encabezado.get("edicion", ""),
                "archivo": ruta_archivo.name,
                "ruta_completa": str(ruta_archivo.absolute()),
                "fecha_escaneado": datetime.now().isoformat(),
                
                # Información adicional que se extraerá
                "disciplina": "",
                "recursos_requeridos": "",
                "elementos_proteccion": "",
                "descripcion_actividades": ""
            }
            
            # Detectar índices de secciones principales
            indices = self.detectar_secciones_principales(doc)
            
            # Extraer sección de Información General
            if "INFORMACIÓN GENERAL DEL PROCEDIMIENTO" in indices and "PELIGROS, RIESGOS Y CONTROLES DE LA ACTIVIDAD" in indices:
                info_general = self.extraer_seccion_info_general(
                    doc, 
                    indices["INFORMACIÓN GENERAL DEL PROCEDIMIENTO"],
                    indices["PELIGROS, RIESGOS Y CONTROLES DE LA ACTIVIDAD"]
                )
                
                # Mapear información general a campos específicos
                datos["alcance"] = info_general.get("ALCANCE", "")
                datos["objetivo"] = info_general.get("OBJETO", "")
                datos["disciplina"] = info_general.get("DISCIPLINA", "")
                datos["recursos_requeridos"] = info_general.get("RECURSOS_REQUERIDOS", "")
                datos["elementos_proteccion"] = info_general.get("ELEMENTOS_PROTECCION", "")
            
            # Extraer descripción de actividades
            if "DESCRIPCIÓN DE ACTIVIDADES" in indices and "CONSIDERACIONES POSTERIORES A LA EJECUCIÓN DE LA ACTIVIDAD" in indices:
                descripcion_texto = self.extraer_texto_completo_seccion(
                    doc, 
                    indices["DESCRIPCIÓN DE ACTIVIDADES"],
                    indices["CONSIDERACIONES POSTERIORES A LA EJECUCIÓN DE LA ACTIVIDAD"]
                )
                datos["descripcion_actividades"] = descripcion_texto
            
            return datos
            
        except Exception as e:
            print(f"❌ Error procesando documento {ruta_archivo}: {e}")
            return {
                "codigo": codigo_filename,
                "nombre": f"ERROR: {ruta_archivo.name}",
                "alcance": "",
                "objetivo": "",
                "archivo": ruta_archivo.name,
                "error": str(e),
                "fecha_escaneado": datetime.now().isoformat()
            }
    
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
    
    def get_existing_procedures_from_excel(self) -> List[Dict[str, Any]]:
        """
        Obtener procedimientos existentes desde el archivo Excel
        """
        try:
            if not self.excel_file.exists():
                print(f"⚠️ Archivo Excel no encontrado: {self.excel_file}")
                return []
            
            df = pd.read_excel(self.excel_file, sheet_name=DATA_SHEETS["procedures"]["name"])
            
            procedures = []
            for index, row in df.iterrows():
                # Saltar filas vacías
                if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == "":
                    continue
                
                try:
                    procedure = {
                        "codigo": str(row.iloc[0]).strip(),
                        "nombre": str(row.iloc[1]).strip(),
                        "alcance": str(row.iloc[2]).strip(),
                        "objetivo": str(row.iloc[3]).strip()
                    }
                    
                    if procedure["codigo"] and procedure["codigo"] != "nan":
                        procedures.append(procedure)
                        
                except Exception as e:
                    print(f"⚠️ Error procesando fila Excel {index + 2}: {e}")
                    continue
            
            return procedures
            
        except Exception as e:
            print(f"❌ Error leyendo Excel: {e}")
            return []
    
    def escanear_directorio(self) -> Dict[str, Any]:
        """
        Escanear directorio de procedimientos y detectar cambios
        """
        print(f"🔍 Escaneando directorio: {self.procedures_source_dir}")
        
        # Cargar tracking data
        tracking_data = self.cargar_tracking_data()
        
        # Obtener procedimientos existentes en Excel
        existing_procedures = self.get_existing_procedures_from_excel()
        existing_codes = {proc["codigo"] for proc in existing_procedures}
        
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
            
            # Crear clave única para tracking
            tracking_key = f"{codigo}_v{version}"
            
            # Verificar si ya existe en Excel
            existe_en_excel = codigo in existing_codes
            
            # Verificar si ya se generaron preguntas para esta versión
            ya_generado = tracking_key in tracking_data["generated_questions"]
            
            # Determinar estado
            if not existe_en_excel:
                estado = "nuevo_procedimiento"
                procedimientos_nuevos += 1
            elif not ya_generado:
                estado = "nueva_version"
                procedimientos_actualizados += 1
            else:
                estado = "ya_procesado"
                continue  # No añadir a cola
            
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
            "procedimientos_nuevos": procedimientos_nuevos,
            "procedimientos_actualizados": procedimientos_actualizados,
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
        tracking_key = f"{codigo}_v{version}"
        
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
        tracking_key = f"{codigo}_v{version}"
        
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
        procedures_dir = os.getenv("PROCEDURES_SOURCE_DIR", "data/procedures_source")
    
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