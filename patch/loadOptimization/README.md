Данный патч применяет оптимизации для установленных WP cluster на базе LiteSpeed
Список оптимизаций:
Данный патч оптимизирует след. настройки:
**LiteSpeed ADC (Load Balancer)**

- включает WordPress Brute Force Attaks Protection с параметрами 
  WP_PROTECT_ACTION: 3
  WP_PROTECT_LIMIT: 100
https://www.litespeedtech.com/support/wiki/doku.php/litespeed_wiki:config:wordpress-protection
  
- включает кеширование статических ресурсов
https://www.litespeedtech.com/support/wiki/doku.php/litespeed_wiki:cache:webadc

- устанавливает Max Connection для Worker Groups в 150
- устанавливает стратегию балансировки - Fast Response
https://www.litespeedtech.com/support/wiki/doku.php/litespeed_wiki:lslb:basic_config

**LSWEB**
отключает WordPress Brute Force Attaks Protection
отключает GZIP сжатие
обновляет LSCACHE плагин

**DataBase**
устанавливает параметр innodb_flush_log_at_trx_commit = 2*
