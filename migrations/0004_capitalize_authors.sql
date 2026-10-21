-- Capitalize first names
UPDATE route
SET author = CASE substr(author, 1, 1)
    WHEN 'é' THEN 'É' WHEN 'è' THEN 'È' WHEN 'ê' THEN 'Ê'
    WHEN 'à' THEN 'À' WHEN 'â' THEN 'Â' WHEN 'î' THEN 'Î'
    WHEN 'ô' THEN 'Ô' WHEN 'û' THEN 'Û' WHEN 'ç' THEN 'Ç'
    ELSE upper(substr(author, 1, 1))
  END || substr(author, 2)
WHERE author IS NOT NULL;
