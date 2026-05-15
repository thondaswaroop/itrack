-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 01, 2026 at 12:27 AM
-- Server version: 10.6.24-MariaDB-cll-lve
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pmgs_itrack`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL COMMENT 'e.g., shipment, package, user',
  `entity_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `containers`
--

CREATE TABLE `containers` (
  `id` int(11) NOT NULL,
  `container_code` varchar(50) NOT NULL,
  `container_type` enum('small','medium','large','pallet','custom') DEFAULT 'medium',
  `hub_id` int(11) NOT NULL,
  `shelf_id` int(11) DEFAULT NULL,
  `current_status` enum('empty','in_use','full','dispatched','in_transit') DEFAULT 'empty',
  `capacity_weight` decimal(10,2) DEFAULT NULL COMMENT 'Max weight in KG',
  `capacity_volume` decimal(10,2) DEFAULT NULL COMMENT 'Max volume in cubic meters',
  `destination_hub_id` int(11) DEFAULT NULL COMMENT 'When dispatched',
  `transport_mode` enum('AIR','OCEAN','GROUND') DEFAULT NULL,
  `dispatched_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `containers`
--

INSERT INTO `containers` (`id`, `container_code`, `container_type`, `hub_id`, `shelf_id`, `current_status`, `capacity_weight`, `capacity_volume`, `destination_hub_id`, `transport_mode`, `dispatched_at`, `created_at`, `updated_at`) VALUES
(1, 'CNT01', 'medium', 1, 1, 'in_use', NULL, NULL, NULL, NULL, NULL, '2026-01-13 12:26:29', '2026-01-13 12:41:59'),
(2, 'CNT02', 'large', 1, 1, 'in_use', NULL, NULL, NULL, NULL, NULL, '2026-01-14 16:11:27', '2026-01-14 16:44:57');

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

CREATE TABLE `countries` (
  `id` int(11) NOT NULL,
  `country_code` varchar(10) NOT NULL,
  `country_name` varchar(255) NOT NULL,
  `currency_code` varchar(10) DEFAULT NULL,
  `phone_code` varchar(10) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` (`id`, `country_code`, `country_name`, `currency_code`, `phone_code`, `status`, `created_at`, `updated_at`) VALUES
(1, 'US', 'United States', 'USD', '+1', 'active', '2026-01-12 14:17:45', '2026-01-12 14:17:45'),
(2, 'IN', 'India', 'INR', '+91', 'active', '2026-01-12 14:17:45', '2026-01-12 14:17:45'),
(3, 'GB', 'United Kingdom', 'GBP', '+44', 'active', '2026-01-12 14:17:45', '2026-01-12 14:17:45'),
(4, 'AE', 'United Arab Emirates', 'AED', '+971', 'active', '2026-01-12 14:17:45', '2026-01-12 14:17:45'),
(5, 'CN', 'China', 'CNY', '+86', 'active', '2026-01-12 14:17:45', '2026-01-12 14:17:45');

-- --------------------------------------------------------

--
-- Table structure for table `fleet_managers`
--

CREATE TABLE `fleet_managers` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL COMMENT 'Associate works for this vendor',
  `hub_id` int(11) DEFAULT NULL COMMENT 'Primary hub assignment (optional)',
  `employee_code` varchar(50) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('active','inactive') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fleet_managers`
--

INSERT INTO `fleet_managers` (`id`, `user_id`, `vendor_id`, `hub_id`, `employee_code`, `designation`, `department`, `assigned_at`, `status`) VALUES
(1, 2, 1, NULL, '01', 'Fleet manager', '', '2026-01-12 14:50:40', 'active'),
(2, 3, 2, 2, '002', '', '', '2026-03-01 06:08:50', 'active');

-- --------------------------------------------------------

--
-- Table structure for table `hubs`
--

CREATE TABLE `hubs` (
  `id` int(11) NOT NULL,
  `hub_name` varchar(255) NOT NULL,
  `hub_code` varchar(50) NOT NULL,
  `location_id` int(11) NOT NULL COMMENT 'Hub belongs to a location',
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `hub_type` enum('origin','transit','destination','all') DEFAULT 'all',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `hubs`
--

INSERT INTO `hubs` (`id`, `hub_name`, `hub_code`, `location_id`, `address`, `city`, `state`, `postal_code`, `latitude`, `longitude`, `contact_person`, `contact_phone`, `contact_email`, `hub_type`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Hyderabad warehouse', 'HUB001', 1, '204, Ring Rd', 'Hyderabad', 'Telangana', '500030', NULL, NULL, 'Sai Swaroop', '9876543210', 'tst@sdd.com', 'all', 'active', '2026-01-12 14:25:53', '2026-01-12 14:25:53'),
(2, 'Dubai', 'HUB002', 2, '7-651 , sriramnagar', 'Dubai', 'Dubai', '533435', NULL, NULL, 'Craving', '', '', 'all', 'active', '2026-01-13 04:51:19', '2026-01-13 04:51:30'),
(3, 'Maimi', 'HUB03', 3, 'Maimi', 'Maimi', 'New York', '12123', NULL, NULL, 'Melch', '2398948', '', 'all', 'active', '2026-03-01 06:57:41', '2026-03-01 06:57:41');

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `location_name` varchar(255) NOT NULL,
  `location_code` varchar(50) NOT NULL,
  `country_id` int(11) NOT NULL COMMENT 'Location belongs to a country',
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`id`, `location_name`, `location_code`, `country_id`, `address`, `city`, `state`, `postal_code`, `latitude`, `longitude`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Hyderabad', 'LOC01', 2, '204, Ring Rd', 'Hyderabad', 'Telangana', '500030', NULL, NULL, 'active', '2026-01-12 14:23:13', '2026-01-12 14:23:13'),
(2, 'Dubai', 'LOC002', 4, '7-651 , sriramnagar', 'Dubai', 'Dubai', '533435', NULL, NULL, 'active', '2026-01-13 04:50:46', '2026-01-13 04:50:46'),
(3, 'Maimi', 'LOC03', 1, 'Maimi', 'Maimi', 'Maimi', '234', NULL, NULL, 'active', '2026-03-01 06:57:08', '2026-03-01 06:57:08');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `notification_type` enum('info','warning','success','error') DEFAULT 'info',
  `related_shipment_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `packages`
--

CREATE TABLE `packages` (
  `id` int(11) NOT NULL,
  `shipment_id` int(11) NOT NULL,
  `package_code` varchar(100) NOT NULL,
  `container_id` int(11) DEFAULT NULL COMMENT 'Assigned during consolidation',
  `shelf_id` int(11) DEFAULT NULL COMMENT 'Warehouse location',
  `weight` decimal(10,2) NOT NULL COMMENT 'Weight in KG',
  `length` decimal(10,2) DEFAULT NULL COMMENT 'Length in CM',
  `width` decimal(10,2) DEFAULT NULL COMMENT 'Width in CM',
  `height` decimal(10,2) DEFAULT NULL COMMENT 'Height in CM',
  `volumetric_weight` decimal(10,2) DEFAULT NULL,
  `description` text DEFAULT NULL COMMENT 'Package description',
  `declared_value` decimal(10,2) DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `status` enum('RECEIVED','CONSOLIDATED','DISPATCHED','IN_TRANSIT','ARRIVED','DELIVERED') DEFAULT 'RECEIVED',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `package_items`
--

CREATE TABLE `package_items` (
  `id` int(11) NOT NULL,
  `package_id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `item_description` text DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `unit_value` decimal(10,2) DEFAULT NULL,
  `hs_code` varchar(50) DEFAULT NULL COMMENT 'Harmonized System code for customs',
  `country_of_origin` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parties`
--

CREATE TABLE `parties` (
  `id` int(11) NOT NULL,
  `hub_id` int(11) DEFAULT NULL COMMENT 'Hub where party was created/registered',
  `party_type` enum('customer','shipper','consignee','both') DEFAULT 'both' COMMENT 'Type of party',
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `tax_id` varchar(100) DEFAULT NULL COMMENT 'Tax ID / VAT number',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parties`
--

INSERT INTO `parties` (`id`, `hub_id`, `party_type`, `name`, `email`, `phone`, `address`, `city`, `state`, `country`, `postal_code`, `company_name`, `tax_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'both', 'Pmgs Technology', 'pmgs@gmail.com', '9876543210', '204, Ring Rd', NULL, NULL, 'India', NULL, NULL, NULL, 'active', '2026-01-13 04:35:31', '2026-03-01 06:13:08'),
(2, 1, 'both', 'Craving Corner', 'cravingcorner.jaggampeta@gmail.com', '9876543210', '204, Ring Rd', NULL, NULL, 'United States', NULL, NULL, NULL, 'active', '2026-01-13 04:49:53', '2026-03-01 06:13:08'),
(3, 1, 'both', 'Cavexpert', 'shanegoodgie@gmail.com', '12354367890', '204, Ring Rd', NULL, NULL, 'India', NULL, NULL, NULL, 'active', '2026-01-14 16:17:57', '2026-03-01 06:13:08');

-- --------------------------------------------------------

--
-- Table structure for table `platform_settings`
--

CREATE TABLE `platform_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `setting_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `platform_settings`
--

INSERT INTO `platform_settings` (`id`, `setting_key`, `setting_value`, `setting_type`, `description`, `updated_at`) VALUES
(1, 'site_name', 'iTrack Logistics', 'string', 'Platform name', '2026-01-12 14:17:45'),
(2, 'default_currency', 'USD', 'string', 'Default currency code', '2026-01-12 14:17:45'),
(3, 'tracking_number_prefix', 'ITK', 'string', 'Tracking number prefix', '2026-01-12 14:17:45'),
(4, 'wr_number_prefix', 'WR', 'string', 'Warehouse receipt prefix', '2026-01-12 14:17:45'),
(5, 'enable_email_notifications', 'true', 'boolean', 'Enable email notifications', '2026-01-12 14:17:45'),
(6, 'enable_sms_notifications', 'false', 'boolean', 'Enable SMS notifications', '2026-01-12 14:17:45');

-- --------------------------------------------------------

--
-- Table structure for table `scan_logs`
--

CREATE TABLE `scan_logs` (
  `id` int(11) NOT NULL,
  `scan_type` enum('package','container','shipment') NOT NULL,
  `scanned_code` varchar(100) NOT NULL,
  `shipment_id` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `container_id` int(11) DEFAULT NULL,
  `hub_id` int(11) NOT NULL,
  `scanned_by_user_id` int(11) NOT NULL,
  `action_taken` varchar(255) DEFAULT NULL COMMENT 'e.g., Received, Consolidated, Dispatched',
  `scan_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `device_info` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shipments`
--

CREATE TABLE `shipments` (
  `id` int(11) NOT NULL,
  `tracking_number` varchar(100) NOT NULL COMMENT 'Main tracking ID',
  `wr_number` varchar(100) DEFAULT NULL COMMENT 'Warehouse Receipt Number (Step 1)',
  `customer_id` int(11) DEFAULT NULL,
  `origin_hub_id` int(11) NOT NULL,
  `destination_hub_id` int(11) NOT NULL,
  `current_hub_id` int(11) DEFAULT NULL,
  `transport_mode` enum('AIR','OCEAN','GROUND') NOT NULL,
  `service_type` enum('express','standard','economy') DEFAULT 'standard',
  `payment_type` enum('prepaid','collect','partial_payment','third_party') DEFAULT 'prepaid',
  `payment_status` enum('pending','paid','cod') DEFAULT 'pending',
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `paid_amount` decimal(10,2) DEFAULT 0.00,
  `pending_amount` decimal(10,2) DEFAULT 0.00,
  `currency` varchar(10) DEFAULT 'USD',
  `shipper_name` varchar(255) NOT NULL,
  `shipper_phone` varchar(50) NOT NULL,
  `shipper_email` varchar(255) DEFAULT NULL,
  `shipper_address` text NOT NULL,
  `shipper_city` varchar(100) DEFAULT NULL,
  `shipper_country` varchar(100) DEFAULT NULL,
  `shipper_postal_code` varchar(20) DEFAULT NULL,
  `consignee_name` varchar(255) NOT NULL,
  `consignee_phone` varchar(50) NOT NULL,
  `consignee_email` varchar(255) DEFAULT NULL,
  `consignee_address` text NOT NULL,
  `consignee_city` varchar(100) DEFAULT NULL,
  `consignee_country` varchar(100) DEFAULT NULL,
  `consignee_postal_code` varchar(20) DEFAULT NULL,
  `current_status` enum('RECEIVED','CONSOLIDATED','DISPATCHED','IN_TRANSIT','ARRIVED','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED','RETURNED','CANCELLED') DEFAULT 'RECEIVED',
  `received_at` timestamp NULL DEFAULT NULL,
  `consolidated_at` timestamp NULL DEFAULT NULL,
  `dispatched_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `created_by_user_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `notes` text DEFAULT NULL,
  `special_instructions` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shipment_documents`
--

CREATE TABLE `shipment_documents` (
  `id` int(11) NOT NULL,
  `shipment_id` int(11) NOT NULL,
  `document_type` enum('invoice','packing_list','bl','awb','pod','customs','other') DEFAULT 'other',
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL COMMENT 'Path to uploaded file',
  `file_size` int(11) DEFAULT NULL COMMENT 'File size in bytes',
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_by_user_id` int(11) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `shipment_tracking`
--

CREATE TABLE `shipment_tracking` (
  `id` int(11) NOT NULL,
  `shipment_id` int(11) NOT NULL,
  `package_id` int(11) DEFAULT NULL,
  `status` varchar(100) NOT NULL,
  `location_hub_id` int(11) DEFAULT NULL,
  `location_name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_by_user_id` int(11) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` enum('super_admin','vendor','associate','customer') NOT NULL,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `full_name`, `phone`, `role`, `status`, `created_at`, `updated_at`, `last_login`) VALUES
(1, 'admin', 'admin@itrack.com', '$2y$10$YDzG95VANuO0hnK75BfO.OWbhyP8aJCnjgewVEomNYLxefDcmbYE2', 'hyderabad', '9876543210', 'super_admin', 'active', '2026-01-12 14:17:45', '2026-03-01 06:58:26', '2026-03-01 06:11:59'),
(2, 'Hyderabad', 'test@s.com', '$2y$10$l.UMTGT6QVraK.EYqE20Zuzl7o0hmTourExye0gbdCcef1AhFH4wa', 'hyderabad associate', '9876543210', 'associate', 'active', '2026-01-12 14:50:39', '2026-01-12 14:50:39', NULL),
(3, 'shane', 'shanegoodgie@gmail.com', '$2y$10$YDzG95VANuO0hnK75BfO.OWbhyP8aJCnjgewVEomNYLxefDcmbYE2', 'shane', '32849832749', 'associate', 'active', '2026-03-01 06:08:49', '2026-03-01 06:40:15', '2026-03-01 06:40:15');

-- --------------------------------------------------------

--
-- Table structure for table `user_preferences`
--

CREATE TABLE `user_preferences` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `preference_key` varchar(100) NOT NULL,
  `preference_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_preferences`
--

INSERT INTO `user_preferences` (`id`, `user_id`, `preference_key`, `preference_value`, `created_at`, `updated_at`) VALUES
(1, 1, 'email_notifications', 'true', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(2, 2, 'email_notifications', 'true', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(4, 1, 'sms_notifications', 'false', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(5, 2, 'sms_notifications', 'false', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(7, 1, 'shipment_updates', 'true', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(8, 2, 'shipment_updates', 'true', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(10, 1, 'delivery_alerts', 'true', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(11, 2, 'delivery_alerts', 'true', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(13, 1, 'system_alerts', 'true', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(14, 2, 'system_alerts', 'true', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(16, 1, 'language', 'en', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(17, 2, 'language', 'en', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(19, 1, 'timezone', 'UTC', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(20, 2, 'timezone', 'UTC', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(22, 1, 'date_format', 'MM/DD/YYYY', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(23, 2, 'date_format', 'MM/DD/YYYY', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(25, 1, 'currency', 'USD', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(26, 2, 'currency', 'USD', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(28, 1, 'theme', 'system', '2026-03-01 05:43:46', '2026-03-01 05:43:46'),
(29, 2, 'theme', 'system', '2026-03-01 05:43:46', '2026-03-01 05:43:46');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `vendor_name` varchar(255) NOT NULL,
  `vendor_code` varchar(50) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `hub_id` int(11) NOT NULL COMMENT 'Vendor belongs to a hub',
  `user_id` int(11) DEFAULT NULL COMMENT 'Link to users table',
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `vendor_name`, `vendor_code`, `email`, `phone`, `address`, `hub_id`, `user_id`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Sai Swaroop', '001', 'test', '9876543210', '204, Ring Rd', 1, NULL, 'active', '2026-01-12 14:26:31', '2026-01-12 14:26:31'),
(2, 'Shane', '002', 'shane@gmail.com', '983983479', 'tesitng address', 2, NULL, 'active', '2026-03-01 06:09:37', '2026-03-01 06:56:28'),
(3, 'Melchpope', '003', 'melchpop@gmail.com', '232394', 'sdf', 3, NULL, 'active', '2026-03-01 06:58:05', '2026-03-01 06:58:05');

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_shelves`
--

CREATE TABLE `warehouse_shelves` (
  `id` int(11) NOT NULL,
  `hub_id` int(11) NOT NULL,
  `shelf_code` varchar(50) NOT NULL,
  `shelf_name` varchar(255) DEFAULT NULL,
  `aisle` varchar(50) DEFAULT NULL,
  `section` varchar(50) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL COMMENT 'Max containers',
  `status` enum('active','inactive','maintenance') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warehouse_shelves`
--

INSERT INTO `warehouse_shelves` (`id`, `hub_id`, `shelf_code`, `shelf_name`, `aisle`, `section`, `capacity`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'SH01', 'Shelf', 'A', NULL, NULL, 'active', '2026-01-13 12:22:42', '2026-01-13 12:22:42');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `containers`
--
ALTER TABLE `containers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `container_code` (`container_code`),
  ADD KEY `hub_id` (`hub_id`),
  ADD KEY `shelf_id` (`shelf_id`),
  ADD KEY `destination_hub_id` (`destination_hub_id`),
  ADD KEY `idx_status` (`current_status`);

--
-- Indexes for table `countries`
--
ALTER TABLE `countries`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `country_code` (`country_code`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `fleet_managers`
--
ALTER TABLE `fleet_managers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `hub_id` (`hub_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `hubs`
--
ALTER TABLE `hubs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `hub_code` (`hub_code`),
  ADD KEY `location_id` (`location_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `location_code` (`location_code`),
  ADD KEY `country_id` (`country_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `related_shipment_id` (`related_shipment_id`),
  ADD KEY `idx_unread` (`user_id`,`is_read`);

--
-- Indexes for table `packages`
--
ALTER TABLE `packages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `package_code` (`package_code`),
  ADD KEY `shipment_id` (`shipment_id`),
  ADD KEY `container_id` (`container_id`),
  ADD KEY `shelf_id` (`shelf_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `package_items`
--
ALTER TABLE `package_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `package_id` (`package_id`);

--
-- Indexes for table `parties`
--
ALTER TABLE `parties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_party_name` (`name`),
  ADD KEY `idx_party_email` (`email`),
  ADD KEY `idx_parties_hub_id` (`hub_id`);

--
-- Indexes for table `platform_settings`
--
ALTER TABLE `platform_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `scan_logs`
--
ALTER TABLE `scan_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shipment_id` (`shipment_id`),
  ADD KEY `package_id` (`package_id`),
  ADD KEY `container_id` (`container_id`),
  ADD KEY `hub_id` (`hub_id`),
  ADD KEY `scanned_by_user_id` (`scanned_by_user_id`),
  ADD KEY `idx_timestamp` (`scan_timestamp`);

--
-- Indexes for table `shipments`
--
ALTER TABLE `shipments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tracking_number` (`tracking_number`),
  ADD UNIQUE KEY `wr_number` (`wr_number`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `origin_hub_id` (`origin_hub_id`),
  ADD KEY `destination_hub_id` (`destination_hub_id`),
  ADD KEY `current_hub_id` (`current_hub_id`),
  ADD KEY `created_by_user_id` (`created_by_user_id`),
  ADD KEY `idx_status` (`current_status`),
  ADD KEY `idx_tracking` (`tracking_number`,`current_status`);

--
-- Indexes for table `shipment_documents`
--
ALTER TABLE `shipment_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shipment_id` (`shipment_id`),
  ADD KEY `uploaded_by_user_id` (`uploaded_by_user_id`);

--
-- Indexes for table `shipment_tracking`
--
ALTER TABLE `shipment_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `shipment_id` (`shipment_id`),
  ADD KEY `package_id` (`package_id`),
  ADD KEY `location_hub_id` (`location_hub_id`),
  ADD KEY `updated_by_user_id` (`updated_by_user_id`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_preference_unique` (`user_id`,`preference_key`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vendor_code` (`vendor_code`),
  ADD KEY `hub_id` (`hub_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `warehouse_shelves`
--
ALTER TABLE `warehouse_shelves`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `hub_shelf` (`hub_id`,`shelf_code`),
  ADD KEY `hub_id` (`hub_id`),
  ADD KEY `idx_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `containers`
--
ALTER TABLE `containers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `countries`
--
ALTER TABLE `countries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `fleet_managers`
--
ALTER TABLE `fleet_managers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `hubs`
--
ALTER TABLE `hubs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `packages`
--
ALTER TABLE `packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `package_items`
--
ALTER TABLE `package_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `parties`
--
ALTER TABLE `parties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `platform_settings`
--
ALTER TABLE `platform_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `scan_logs`
--
ALTER TABLE `scan_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shipments`
--
ALTER TABLE `shipments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shipment_documents`
--
ALTER TABLE `shipment_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shipment_tracking`
--
ALTER TABLE `shipment_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_preferences`
--
ALTER TABLE `user_preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `warehouse_shelves`
--
ALTER TABLE `warehouse_shelves`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `containers`
--
ALTER TABLE `containers`
  ADD CONSTRAINT `containers_ibfk_1` FOREIGN KEY (`hub_id`) REFERENCES `hubs` (`id`),
  ADD CONSTRAINT `containers_ibfk_2` FOREIGN KEY (`shelf_id`) REFERENCES `warehouse_shelves` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `containers_ibfk_3` FOREIGN KEY (`destination_hub_id`) REFERENCES `hubs` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `fleet_managers`
--
ALTER TABLE `fleet_managers`
  ADD CONSTRAINT `fleet_managers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fleet_managers_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fleet_managers_ibfk_3` FOREIGN KEY (`hub_id`) REFERENCES `hubs` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `hubs`
--
ALTER TABLE `hubs`
  ADD CONSTRAINT `hubs_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`);

--
-- Constraints for table `locations`
--
ALTER TABLE `locations`
  ADD CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`country_id`) REFERENCES `countries` (`id`);

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`related_shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `packages`
--
ALTER TABLE `packages`
  ADD CONSTRAINT `packages_ibfk_1` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `packages_ibfk_2` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `packages_ibfk_3` FOREIGN KEY (`shelf_id`) REFERENCES `warehouse_shelves` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `package_items`
--
ALTER TABLE `package_items`
  ADD CONSTRAINT `package_items_ibfk_1` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `parties`
--
ALTER TABLE `parties`
  ADD CONSTRAINT `fk_parties_hub` FOREIGN KEY (`hub_id`) REFERENCES `hubs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `scan_logs`
--
ALTER TABLE `scan_logs`
  ADD CONSTRAINT `scan_logs_ibfk_1` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `scan_logs_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `scan_logs_ibfk_3` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `scan_logs_ibfk_4` FOREIGN KEY (`hub_id`) REFERENCES `hubs` (`id`),
  ADD CONSTRAINT `scan_logs_ibfk_5` FOREIGN KEY (`scanned_by_user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `shipments`
--
ALTER TABLE `shipments`
  ADD CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `shipments_ibfk_2` FOREIGN KEY (`origin_hub_id`) REFERENCES `hubs` (`id`),
  ADD CONSTRAINT `shipments_ibfk_3` FOREIGN KEY (`destination_hub_id`) REFERENCES `hubs` (`id`),
  ADD CONSTRAINT `shipments_ibfk_4` FOREIGN KEY (`current_hub_id`) REFERENCES `hubs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `shipments_ibfk_5` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `shipment_documents`
--
ALTER TABLE `shipment_documents`
  ADD CONSTRAINT `shipment_documents_ibfk_1` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shipment_documents_ibfk_2` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `shipment_tracking`
--
ALTER TABLE `shipment_tracking`
  ADD CONSTRAINT `shipment_tracking_ibfk_1` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shipment_tracking_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shipment_tracking_ibfk_3` FOREIGN KEY (`location_hub_id`) REFERENCES `hubs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `shipment_tracking_ibfk_4` FOREIGN KEY (`updated_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vendors`
--
ALTER TABLE `vendors`
  ADD CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`hub_id`) REFERENCES `hubs` (`id`),
  ADD CONSTRAINT `vendors_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `warehouse_shelves`
--
ALTER TABLE `warehouse_shelves`
  ADD CONSTRAINT `warehouse_shelves_ibfk_1` FOREIGN KEY (`hub_id`) REFERENCES `hubs` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
