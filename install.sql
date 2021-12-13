-- Adminer 4.8.1 MySQL 5.5.5-10.4.17-MariaDB dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS `invoices`;
CREATE DATABASE `invoices` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE `invoices`;

DROP TABLE IF EXISTS `access_tokens`;
CREATE TABLE `access_tokens` (
  `token` char(64) NOT NULL,
  `id` char(64) NOT NULL,
  `tablename` char(64) NOT NULL,
  `created` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00' ON UPDATE current_timestamp(),
  `last_used` date NOT NULL DEFAULT '0000-00-00',
  PRIMARY KEY (`token`),
  KEY `id` (`id`),
  KEY `tablename` (`tablename`),
  CONSTRAINT `access_tokens_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `access_tokens_ibfk_2` FOREIGN KEY (`tablename`) REFERENCES `users` (`tablename`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` char(64) NOT NULL,
  `tablename` char(64) NOT NULL,
  `password` char(64) NOT NULL,
  `username` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tablename` (`tablename`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 2021-11-09 11:48:50