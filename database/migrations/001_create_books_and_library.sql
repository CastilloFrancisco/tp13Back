CREATE TABLE IF NOT EXISTS libros (
    id SERIAL PRIMARY KEY,
    google_books_id VARCHAR(255) NOT NULL UNIQUE,
    titulo TEXT NOT NULL,
    autores TEXT[] NOT NULL DEFAULT '{}',
    descripcion TEXT,
    editorial TEXT,
    fecha_publicacion VARCHAR(50),
    isbn_10 VARCHAR(20),
    isbn_13 VARCHAR(20),
    portada TEXT,
    paginas INTEGER,
    categorias TEXT[] NOT NULL DEFAULT '{}',
    idioma VARCHAR(20),
    info_link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biblioteca_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    libro_id INTEGER NOT NULL,
    fecha_agregado TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    estado_lectura VARCHAR(30) NOT NULL DEFAULT 'por_leer',
    CONSTRAINT fk_biblioteca_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_biblioteca_libro
        FOREIGN KEY (libro_id)
        REFERENCES libros(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_biblioteca_usuario_libro UNIQUE (usuario_id, libro_id)
);

CREATE INDEX IF NOT EXISTS idx_libros_google_books_id ON libros (google_books_id);
CREATE INDEX IF NOT EXISTS idx_biblioteca_usuario ON biblioteca_usuarios (usuario_id);
CREATE INDEX IF NOT EXISTS idx_biblioteca_libro ON biblioteca_usuarios (libro_id);
