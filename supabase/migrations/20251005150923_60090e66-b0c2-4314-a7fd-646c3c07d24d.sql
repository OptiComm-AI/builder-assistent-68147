-- Fix vendor search URLs to use dynamic query placeholders
UPDATE vendors 
SET search_url_template = 'https://www.enmax.ro/?page=search&action=products&query={query}'
WHERE name = 'enmax';

UPDATE vendors 
SET search_url_template = 'https://www.maxbau.ro/?page=search&action=products&query={query}'
WHERE name = 'MaxBau';