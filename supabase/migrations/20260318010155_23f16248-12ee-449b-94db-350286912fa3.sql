
CREATE OR REPLACE FUNCTION public.get_public_tables_ddl()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sql text := '';
  v_table record;
  v_col record;
  v_pk record;
  v_fk record;
  v_unique record;
  v_enum record;
BEGIN
  -- First, export all custom enums
  FOR v_enum IN
    SELECT t.typname, e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder
  LOOP
    -- Check if we already started this enum
    IF position('CREATE TYPE public.' || v_enum.typname IN v_sql) = 0 THEN
      v_sql := v_sql || 'CREATE TYPE public.' || v_enum.typname || ' AS ENUM (';
      -- Get all values for this enum
      SELECT string_agg('''' || e.enumlabel || '''', ', ' ORDER BY e.enumsortorder)
      INTO v_sql
      FROM (SELECT v_sql) sub, pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typname = v_enum.typname;
    END IF;
  END LOOP;

  -- Reset and build properly
  v_sql := '';

  -- Export enums
  FOR v_table IN
    SELECT DISTINCT t.typname
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY t.typname
  LOOP
    v_sql := v_sql || 'CREATE TYPE public.' || v_table.typname || ' AS ENUM (';
    SELECT string_agg('''' || e.enumlabel || '''', ', ' ORDER BY e.enumsortorder)
    INTO v_sql
    FROM (SELECT v_sql AS prefix) sub,
         pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public' AND t.typname = v_table.typname;
    -- This approach is broken, let me fix
  END LOOP;

  -- Simpler approach: build enum DDL
  v_sql := '-- ========================================' || chr(10);
  v_sql := v_sql || '-- ENUMS' || chr(10);
  v_sql := v_sql || '-- ========================================' || chr(10) || chr(10);

  FOR v_table IN
    SELECT DISTINCT t.typname as enum_name
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY t.typname
  LOOP
    v_sql := v_sql || 'CREATE TYPE public.' || v_table.enum_name || ' AS ENUM (';
    
    DECLARE
      v_vals text;
    BEGIN
      SELECT string_agg('''' || e.enumlabel || '''', ', ' ORDER BY e.enumsortorder)
      INTO v_vals
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public' AND t.typname = v_table.enum_name;
      
      v_sql := v_sql || v_vals || ');' || chr(10) || chr(10);
    END;
  END LOOP;

  v_sql := v_sql || '-- ========================================' || chr(10);
  v_sql := v_sql || '-- TABLES' || chr(10);
  v_sql := v_sql || '-- ========================================' || chr(10) || chr(10);

  -- For each public table
  FOR v_table IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  LOOP
    v_sql := v_sql || 'CREATE TABLE public.' || v_table.table_name || ' (' || chr(10);

    -- Columns
    FOR v_col IN
      SELECT 
        column_name,
        CASE 
          WHEN udt_name LIKE 'int%' THEN data_type
          WHEN data_type = 'USER-DEFINED' THEN 'public.' || udt_name
          WHEN data_type = 'ARRAY' THEN udt_name || '[]'
          WHEN character_maximum_length IS NOT NULL THEN data_type || '(' || character_maximum_length || ')'
          WHEN numeric_precision IS NOT NULL AND data_type = 'numeric' THEN 'numeric(' || numeric_precision || ',' || COALESCE(numeric_scale, 0) || ')'
          ELSE data_type
        END AS col_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = v_table.table_name
      ORDER BY ordinal_position
    LOOP
      v_sql := v_sql || '  ' || v_col.column_name || ' ' || v_col.col_type;
      
      IF v_col.column_default IS NOT NULL THEN
        v_sql := v_sql || ' DEFAULT ' || v_col.column_default;
      END IF;
      
      IF v_col.is_nullable = 'NO' THEN
        v_sql := v_sql || ' NOT NULL';
      END IF;
      
      v_sql := v_sql || ',' || chr(10);
    END LOOP;

    -- Primary key
    FOR v_pk IN
      SELECT string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as pk_cols
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public' 
        AND tc.table_name = v_table.table_name 
        AND tc.constraint_type = 'PRIMARY KEY'
      GROUP BY tc.constraint_name
    LOOP
      v_sql := v_sql || '  PRIMARY KEY (' || v_pk.pk_cols || '),' || chr(10);
    END LOOP;

    -- Foreign keys
    FOR v_fk IN
      SELECT 
        kcu.column_name,
        ccu.table_schema || '.' || ccu.table_name AS ref_table,
        ccu.column_name AS ref_column,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_schema = 'public' 
        AND tc.table_name = v_table.table_name 
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
      v_sql := v_sql || '  FOREIGN KEY (' || v_fk.column_name || ') REFERENCES ' || v_fk.ref_table || '(' || v_fk.ref_column || ')';
      IF v_fk.delete_rule = 'CASCADE' THEN
        v_sql := v_sql || ' ON DELETE CASCADE';
      ELSIF v_fk.delete_rule = 'SET NULL' THEN
        v_sql := v_sql || ' ON DELETE SET NULL';
      END IF;
      v_sql := v_sql || ',' || chr(10);
    END LOOP;

    -- Unique constraints
    FOR v_unique IN
      SELECT string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as u_cols
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public' 
        AND tc.table_name = v_table.table_name 
        AND tc.constraint_type = 'UNIQUE'
      GROUP BY tc.constraint_name
    LOOP
      v_sql := v_sql || '  UNIQUE (' || v_unique.u_cols || '),' || chr(10);
    END LOOP;

    -- Remove trailing comma
    v_sql := rtrim(v_sql, chr(10));
    v_sql := rtrim(v_sql, ',');
    v_sql := v_sql || chr(10) || ');' || chr(10) || chr(10);

    -- RLS
    v_sql := v_sql || 'ALTER TABLE public.' || v_table.table_name || ' ENABLE ROW LEVEL SECURITY;' || chr(10) || chr(10);
  END LOOP;

  RETURN v_sql;
END;
$$;
