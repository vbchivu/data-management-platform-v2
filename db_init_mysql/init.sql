-- db_init_mysql/init.sql

-- Create the database (if not already created by MySQL env vars).
CREATE DATABASE IF NOT EXISTS ${MYSQL_DATABASE};

-- Create the user and grant privileges on that database.
CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON ${MYSQL_DATABASE}.* TO '${MYSQL_USER}'@'%';
FLUSH PRIVILEGES;
