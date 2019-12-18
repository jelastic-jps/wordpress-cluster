#!/bin/bash

cp -f /etc/my.cnf /etc/my.cnf.backup.$(date +%d-%m-%Y.%H:%M:%S.%N) || exit 1

sed -i '/innodb_flush_log_at_trx_commit/d' /etc/my.cnf
sed -i '/\[mysqld\]/a innodb_flush_log_at_trx_commit = 2' /etc/my.cnf

cp -f /etc/jelastic/redeploy.conf /etc/jelastic/redeploy.conf.$(date +%d-%m-%Y.%H:%M:%S.%N) || exit 1

sed -i '/\/etc\/mysql\/conf.d/d' /etc/jelastic/redeploy.conf
echo "/etc/mysql/conf.d" >> /etc/jelastic/redeploy.conf 

sudo service mysql restart;
