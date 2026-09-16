
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `wallet_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `wallet_id` (`wallet_id`),
  CONSTRAINT `category_ibfk_1` FOREIGN KEY (`wallet_id`) REFERENCES `wallet` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `crypto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crypto` (
  `symbol` varchar(10) NOT NULL,
  `name` varchar(100) DEFAULT NULL,
  `price` decimal(20,8) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`symbol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `portfolio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `portfolio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `wallet_id` int(11) NOT NULL,
  `symbol` varchar(10) NOT NULL,
  `amount` decimal(30,10) NOT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `wallet_id` (`wallet_id`),
  CONSTRAINT `portfolio_ibfk_1` FOREIGN KEY (`wallet_id`) REFERENCES `wallet` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `detail` varchar(150) DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `transaction_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(75) NOT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `login_attempts` int(11) NOT NULL DEFAULT 0,
  `recovery_phrase` varchar(75) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `vw_crypto_holdings`;
/*!50001 DROP VIEW IF EXISTS `vw_crypto_holdings`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_crypto_holdings` AS SELECT 
 1 AS `user_id`,
 1 AS `username`,
 1 AS `wallet_id`,
 1 AS `wallet_name`,
 1 AS `symbol`,
 1 AS `crypto_name`,
 1 AS `amount`,
 1 AS `price`,
 1 AS `current_value_usd`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_expenses_by_category`;
/*!50001 DROP VIEW IF EXISTS `vw_expenses_by_category`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_expenses_by_category` AS SELECT 
 1 AS `user_id`,
 1 AS `username`,
 1 AS `wallet_id`,
 1 AS `wallet_name`,
 1 AS `period`,
 1 AS `category_id`,
 1 AS `category_name`,
 1 AS `total`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_income_by_category`;
/*!50001 DROP VIEW IF EXISTS `vw_income_by_category`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_income_by_category` AS SELECT 
 1 AS `user_id`,
 1 AS `username`,
 1 AS `wallet_id`,
 1 AS `wallet_name`,
 1 AS `period`,
 1 AS `category_id`,
 1 AS `category_name`,
 1 AS `total`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_ledger`;
/*!50001 DROP VIEW IF EXISTS `vw_ledger`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_ledger` AS SELECT 
 1 AS `id`,
 1 AS `date`,
 1 AS `user_id`,
 1 AS `username`,
 1 AS `wallet_id`,
 1 AS `wallet_name`,
 1 AS `wallet_type`,
 1 AS `category_id`,
 1 AS `category_name`,
 1 AS `category_type`,
 1 AS `signed_amount`,
 1 AS `amount`,
 1 AS `detail`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_monthly_balance`;
/*!50001 DROP VIEW IF EXISTS `vw_monthly_balance`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_monthly_balance` AS SELECT 
 1 AS `user_id`,
 1 AS `username`,
 1 AS `wallet_id`,
 1 AS `wallet_name`,
 1 AS `period`,
 1 AS `income`,
 1 AS `expenses`,
 1 AS `net_flow`,
 1 AS `savings_pct`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_recurring_expenses`;
/*!50001 DROP VIEW IF EXISTS `vw_recurring_expenses`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_recurring_expenses` AS SELECT 
 1 AS `user_id`,
 1 AS `username`,
 1 AS `category_name`,
 1 AS `detail`,
 1 AS `occurrences`,
 1 AS `avg_amount`,
 1 AS `total_amount`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_running_balance`;
/*!50001 DROP VIEW IF EXISTS `vw_running_balance`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_running_balance` AS SELECT 
 1 AS `user_id`,
 1 AS `username`,
 1 AS `wallet_id`,
 1 AS `wallet_name`,
 1 AS `period`,
 1 AS `net_flow`,
 1 AS `running_balance`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `vw_wallet_balance`;
/*!50001 DROP VIEW IF EXISTS `vw_wallet_balance`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_wallet_balance` AS SELECT 
 1 AS `wallet_id`,
 1 AS `wallet_name`,
 1 AS `wallet_type`,
 1 AS `user_id`,
 1 AS `username`,
 1 AS `current_balance`*/;
SET character_set_client = @saved_cs_client;
DROP TABLE IF EXISTS `wallet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `detail` varchar(150) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `starting_amount` decimal(15,2) NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'fiat',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `exclude_from_total` tinyint(1) NOT NULL DEFAULT 0,
  `is_archived` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wallet_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50001 DROP VIEW IF EXISTS `vw_crypto_holdings`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_crypto_holdings` AS select `u`.`id` AS `user_id`,`u`.`username` AS `username`,`w`.`id` AS `wallet_id`,`w`.`name` AS `wallet_name`,`p`.`symbol` AS `symbol`,`c`.`name` AS `crypto_name`,`p`.`amount` AS `amount`,`c`.`price` AS `price`,`p`.`amount` * `c`.`price` AS `current_value_usd` from (((`portfolio` `p` join `wallet` `w` on(`p`.`wallet_id` = `w`.`id`)) join `user` `u` on(`w`.`user_id` = `u`.`id`)) join `crypto` `c` on(`p`.`symbol` = `c`.`symbol`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_expenses_by_category`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_expenses_by_category` AS select `vw_ledger`.`user_id` AS `user_id`,`vw_ledger`.`username` AS `username`,`vw_ledger`.`wallet_id` AS `wallet_id`,`vw_ledger`.`wallet_name` AS `wallet_name`,date_format(`vw_ledger`.`date`,'%Y-%m-01') AS `period`,`vw_ledger`.`category_id` AS `category_id`,`vw_ledger`.`category_name` AS `category_name`,sum(`vw_ledger`.`amount`) AS `total` from `vw_ledger` where `vw_ledger`.`category_type` = 'expense' group by `vw_ledger`.`user_id`,`vw_ledger`.`username`,`vw_ledger`.`wallet_id`,`vw_ledger`.`wallet_name`,date_format(`vw_ledger`.`date`,'%Y-%m-01'),`vw_ledger`.`category_id`,`vw_ledger`.`category_name` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_income_by_category`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_income_by_category` AS select `vw_ledger`.`user_id` AS `user_id`,`vw_ledger`.`username` AS `username`,`vw_ledger`.`wallet_id` AS `wallet_id`,`vw_ledger`.`wallet_name` AS `wallet_name`,date_format(`vw_ledger`.`date`,'%Y-%m-01') AS `period`,`vw_ledger`.`category_id` AS `category_id`,`vw_ledger`.`category_name` AS `category_name`,sum(`vw_ledger`.`amount`) AS `total` from `vw_ledger` where `vw_ledger`.`category_type` = 'income' group by `vw_ledger`.`user_id`,`vw_ledger`.`username`,`vw_ledger`.`wallet_id`,`vw_ledger`.`wallet_name`,date_format(`vw_ledger`.`date`,'%Y-%m-01'),`vw_ledger`.`category_id`,`vw_ledger`.`category_name` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_ledger`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_ledger` AS select `t`.`id` AS `id`,`t`.`date` AS `date`,`u`.`id` AS `user_id`,`u`.`username` AS `username`,`w`.`id` AS `wallet_id`,`w`.`name` AS `wallet_name`,`w`.`type` AS `wallet_type`,`c`.`id` AS `category_id`,`c`.`name` AS `category_name`,`c`.`type` AS `category_type`,case when `c`.`type` = 'income' then `t`.`amount` else -`t`.`amount` end AS `signed_amount`,`t`.`amount` AS `amount`,`t`.`detail` AS `detail` from (((`transaction` `t` join `category` `c` on(`t`.`category_id` = `c`.`id`)) join `wallet` `w` on(`c`.`wallet_id` = `w`.`id`)) join `user` `u` on(`w`.`user_id` = `u`.`id`)) where `w`.`type` <> 'crypto' */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_monthly_balance`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_monthly_balance` AS select `vw_ledger`.`user_id` AS `user_id`,`vw_ledger`.`username` AS `username`,`vw_ledger`.`wallet_id` AS `wallet_id`,`vw_ledger`.`wallet_name` AS `wallet_name`,date_format(`vw_ledger`.`date`,'%Y-%m-01') AS `period`,sum(case when `vw_ledger`.`category_type` = 'income' then `vw_ledger`.`amount` else 0 end) AS `income`,sum(case when `vw_ledger`.`category_type` = 'expense' then `vw_ledger`.`amount` else 0 end) AS `expenses`,sum(`vw_ledger`.`signed_amount`) AS `net_flow`,case when sum(case when `vw_ledger`.`category_type` = 'income' then `vw_ledger`.`amount` else 0 end) = 0 then NULL else round(sum(`vw_ledger`.`signed_amount`) / sum(case when `vw_ledger`.`category_type` = 'income' then `vw_ledger`.`amount` else 0 end) * 100,1) end AS `savings_pct` from `vw_ledger` group by `vw_ledger`.`user_id`,`vw_ledger`.`username`,`vw_ledger`.`wallet_id`,`vw_ledger`.`wallet_name`,date_format(`vw_ledger`.`date`,'%Y-%m-01') */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_recurring_expenses`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_recurring_expenses` AS select `vw_ledger`.`user_id` AS `user_id`,`vw_ledger`.`username` AS `username`,`vw_ledger`.`category_name` AS `category_name`,lcase(trim(`vw_ledger`.`detail`)) AS `detail`,count(0) AS `occurrences`,avg(`vw_ledger`.`amount`) AS `avg_amount`,sum(`vw_ledger`.`amount`) AS `total_amount` from `vw_ledger` where `vw_ledger`.`category_type` = 'expense' group by `vw_ledger`.`user_id`,`vw_ledger`.`username`,`vw_ledger`.`category_name`,lcase(trim(`vw_ledger`.`detail`)) having count(0) >= 3 */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_running_balance`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_running_balance` AS select `w`.`user_id` AS `user_id`,`l`.`username` AS `username`,`l`.`wallet_id` AS `wallet_id`,`l`.`wallet_name` AS `wallet_name`,date_format(`l`.`date`,'%Y-%m-01') AS `period`,sum(`l`.`signed_amount`) AS `net_flow`,`w`.`starting_amount` + sum(sum(`l`.`signed_amount`)) over ( partition by `l`.`wallet_id` order by date_format(`l`.`date`,'%Y-%m-01')) AS `running_balance` from (`vw_ledger` `l` join `wallet` `w` on(`w`.`id` = `l`.`wallet_id`)) group by `w`.`user_id`,`l`.`username`,`l`.`wallet_id`,`l`.`wallet_name`,date_format(`l`.`date`,'%Y-%m-01'),`w`.`starting_amount` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_wallet_balance`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 SQL SECURITY DEFINER */
/*!50001 VIEW `vw_wallet_balance` AS select `w`.`id` AS `wallet_id`,`w`.`name` AS `wallet_name`,`w`.`type` AS `wallet_type`,`u`.`id` AS `user_id`,`u`.`username` AS `username`,`w`.`starting_amount` + coalesce(sum(case when `c`.`type` = 'income' then `t`.`amount` else -`t`.`amount` end),0) AS `current_balance` from (((`wallet` `w` join `user` `u` on(`u`.`id` = `w`.`user_id`)) left join `category` `c` on(`c`.`wallet_id` = `w`.`id`)) left join `transaction` `t` on(`t`.`category_id` = `c`.`id`)) where `w`.`type` <> 'crypto' group by `w`.`id`,`w`.`name`,`w`.`type`,`w`.`starting_amount`,`u`.`id`,`u`.`username` union all select `vw_crypto_holdings`.`wallet_id` AS `wallet_id`,`vw_crypto_holdings`.`wallet_name` AS `wallet_name`,'crypto' AS `wallet_type`,`vw_crypto_holdings`.`user_id` AS `user_id`,`vw_crypto_holdings`.`username` AS `username`,sum(`vw_crypto_holdings`.`current_value_usd`) AS `current_balance` from `vw_crypto_holdings` group by `vw_crypto_holdings`.`wallet_id`,`vw_crypto_holdings`.`wallet_name`,`vw_crypto_holdings`.`user_id`,`vw_crypto_holdings`.`username` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
