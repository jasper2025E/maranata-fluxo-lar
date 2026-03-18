
DROP FUNCTION IF EXISTS public.get_public_tables_ddl();

CREATE OR REPLACE FUNCTION public.get_public_tables_ddl()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result text := '';
  v_table record;
  v_column record;
  v_constraint record;
  v_enum record;
BEGIN
  v_result := v_result || '-- ENUMS' || E'\n';
  FOR v_enum IN
    SELECT t.typname, 
           string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder) as labels
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
    GROUP BY t.typname
  LOOP
    v_result := v_result || 'CREATE TYPE public.' || v_enum.typname || ' AS ENUM (' || v_enum.labels || ');' || E'\n';
  END LOOP;

  v_result := v_result || E'\n-- TABLES\n';

  FOR v_table IN
    SELECT c.relname as table_name
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname
  LOOP
    v_result := v_result || E'\nCREATE TABLE public.' || v_table.table_name || ' (' || E'\n';
    
    FOR v_column IN
      SELECT 
        a.attname as column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
        CASE WHEN a.attnotnull THEN ' NOT NULL' ELSE '' END as not_null,
        CASE 
          WHEN a.attgenerated = 's' THEN ' GENERATED ALWAYS AS (' || pg_get_expr(d.adbin, d.adrelid) || ') STORED'
          WHEN d.adbin IS NOT NULL THEN ' DEFAULT ' || pg_get_expr(d.adbin, d.adrelid)
          ELSE ''
        END as default_val
      FROM pg_attribute a
      LEFT JOIN pg_attrdef d ON a.attrelid = d.adrelid AND a.attnum = d.adnum
      WHERE a.attrelid = (SELECT oid FROM pg_class WHERE relname = v_table.table_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum
    LOOP
      v_result := v_result || '  ' || v_column.column_name || ' ' || v_column.data_type || v_column.default_val || v_column.not_null || ',' || E'\n';
    END LOOP;

    FOR v_constraint IN
      SELECT pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      WHERE c.conrelid = (SELECT oid FROM pg_class WHERE relname = v_table.table_name AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
        AND c.contype IN ('p', 'u')
    LOOP
      v_result := v_result || '  ' || v_constraint.def || ',' || E'\n';
    END LOOP;

    v_result := rtrim(v_result, E',\n') || E'\n';
    v_result := v_result || ');' || E'\n';
  END LOOP;

  v_result := v_result || E'\n-- FOREIGN KEYS\n';
  FOR v_constraint IN
    SELECT 
      'ALTER TABLE public.' || cl.relname || ' ADD CONSTRAINT ' || c.conname || ' ' || pg_get_constraintdef(c.oid) || ';' as fk_sql
    FROM pg_constraint c
    JOIN pg_class cl ON c.conrelid = cl.oid
    JOIN pg_namespace n ON cl.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.contype = 'f'
    ORDER BY cl.relname
  LOOP
    v_result := v_result || v_constraint.fk_sql || E'\n';
  END LOOP;

  v_result := v_result || E'\n-- RLS POLICIES\n';
  FOR v_table IN
    SELECT c.relname as table_name
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true
    ORDER BY c.relname
  LOOP
    v_result := v_result || 'ALTER TABLE public.' || v_table.table_name || ' ENABLE ROW LEVEL SECURITY;' || E'\n';
  END LOOP;

  RETURN v_result;
END;
$function$;
