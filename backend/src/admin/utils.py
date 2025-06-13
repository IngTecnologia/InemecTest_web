"""
backend/src/admin/utils.py

Utilidades estandarizadas para parsing de códigos y versiones de procedimientos
Formato esperado: PEP-PRO-1141 V.2.docx o PEP-PRO-1141.docx
"""

import re
from typing import Tuple

def extract_procedure_code_and_version(filename: str) -> Tuple[str, int]:
    """
    Extrae código y versión desde el nombre del archivo de procedimiento
    
    Formatos soportados:
    - PEP-PRO-1141.docx (versión 1 por defecto)
    - PEP-PRO-1141 V.2.docx (versión 2)
    - PEP-PRO-1141 V.10.docx (versión 10)
    
    Args:
        filename: Nombre del archivo con extensión
        
    Returns:
        Tuple[str, int]: (codigo, version)
        
    Raises:
        ValueError: Si el formato no es válido
    """
    # Remover extensión
    base_name = filename.replace('.docx', '').replace('.doc', '')
    
    # Detectar versión - formato: PEP-PRO-XXX V.2 (con espacio antes de V)
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
        else:
            raise ValueError(f"No se pudo extraer código válido de: {filename}")
    
    print(f"📄 Archivo procesado: {filename} → Código: {codigo}, Versión: {version}")
    return codigo, version

def create_tracking_key(codigo: str, version: int) -> str:
    """
    Crear clave única para tracking
    
    Args:
        codigo: Código del procedimiento (ej: PEP-PRO-1141)
        version: Versión del procedimiento (ej: 2)
        
    Returns:
        str: Clave de tracking (ej: PEP-PRO-1141_v2)
    """
    return f"{codigo}_v{version}"

def validate_procedure_code_format(codigo: str) -> bool:
    """
    Validar que un código tenga el formato correcto
    
    Args:
        codigo: Código a validar
        
    Returns:
        bool: True si es válido, False si no
    """
    return bool(re.match(r'^PEP-PRO-\d+$', codigo))

# =============================================================================
# TESTING
# =============================================================================

def test_parsing():
    """Test de la función de parsing"""
    test_cases = [
        ("PEP-PRO-1141.docx", ("PEP-PRO-1141", 1)),
        ("PEP-PRO-1141 V.2.docx", ("PEP-PRO-1141", 2)),
        ("PEP-PRO-1234 V.10.docx", ("PEP-PRO-1234", 10)),
        ("PEP-PRO-999.docx", ("PEP-PRO-999", 1)),
    ]
    
    print("🧪 Testing parsing de códigos y versiones...")
    
    for filename, expected in test_cases:
        try:
            result = extract_procedure_code_and_version(filename)
            if result == expected:
                print(f"✅ {filename} → {result}")
            else:
                print(f"❌ {filename} → {result} (esperado: {expected})")
        except Exception as e:
            print(f"❌ {filename} → ERROR: {e}")

if __name__ == "__main__":
    test_parsing()