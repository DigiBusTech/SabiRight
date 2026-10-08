UPDATE admin_settings
SET value = 'https://router.huggingface.co/v1/chat/completions'
WHERE "key" = 'natlas_api_endpoint'
  AND value = 'https://api-inference.huggingface.co/models/NCAIR1/N-ATLaS';
