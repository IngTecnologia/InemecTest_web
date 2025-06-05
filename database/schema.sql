-- Base de datos InemecTest
CREATE DATABASE inemectest;
\c inemectest;

-- Tabla de procedimientos
CREATE TABLE procedures (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    alcance TEXT,
    objetivo TEXT
);

-- Tabla de preguntas (estructura inicial - se modificará según hoja de cálculo)
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    procedure_id INTEGER REFERENCES procedures(id),
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer VARCHAR(1) CHECK (correct_answer IN ('A', 'B', 'C', 'D'))
);

-- Tabla de evaluaciones
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    cargo VARCHAR(255) NOT NULL,
    campo VARCHAR(20) CHECK (campo IN ('Cusiana', 'Cupiagua', 'Floreña', 'Transversal')),
    procedure_id INTEGER REFERENCES procedures(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'in_progress'
);

-- Tabla de respuestas
CREATE TABLE answers (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations(id),
    question_id INTEGER REFERENCES questions(id),
    selected_option VARCHAR(1),
    is_correct BOOLEAN,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de conocimiento aplicado
CREATE TABLE applied_knowledge (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations(id),
    describio_procedimiento BOOLEAN DEFAULT FALSE,
    identifico_riesgos BOOLEAN DEFAULT FALSE,
    identifico_epp BOOLEAN DEFAULT FALSE,
    describio_incidentes BOOLEAN DEFAULT FALSE
);

-- Tabla de feedback final
CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations(id),
    hizo_sugerencia VARCHAR(2) CHECK (hizo_sugerencia IN ('Sí', 'No')),
    cual_sugerencia TEXT,
    aprobo VARCHAR(2) CHECK (aprobo IN ('Sí', 'No')),
    requiere_entrenamiento TEXT
);
