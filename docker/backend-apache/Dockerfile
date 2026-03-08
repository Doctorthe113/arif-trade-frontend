FROM php:8.2-apache

RUN docker-php-ext-install pdo_mysql \
    && a2enmod headers rewrite \
    && sed -ri 's/^Listen 80$/Listen 8000/' /etc/apache2/ports.conf \
    && echo 'ServerName 127.0.0.1' > /etc/apache2/conf-available/server-name.conf \
    && a2enconf server-name

COPY docker/backend-apache/000-default.conf /etc/apache2/sites-available/000-default.conf
COPY arif_trade_international/restAPI/ /var/www/html/

EXPOSE 8000

CMD ["apache2-foreground"]