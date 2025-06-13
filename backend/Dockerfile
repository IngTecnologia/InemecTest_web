FROM python:3.11-slim

# Metadatos
LABEL maintainer="InemecTest Team"
LABEL description="Backend para InemecTest - Sistema basado en Excel"

# Configurar directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema (solo las necesarias)
RUN apt-get update && apt-get install -y \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Copiar archivo de requirements primero (para cachear layers)
COPY requirements.txt .

# Instalar dependencias Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p data logs temp uploads

# Configurar variables de entorno
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Exponer puerto
EXPOSE 8000

# Verificar que la aplicación se puede importar
RUN python -c "import main"

# Comando de inicio
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]