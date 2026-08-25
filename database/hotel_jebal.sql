-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 19, 2026 at 06:03 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hotel_jebal`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin_sessions`
--

CREATE TABLE `admin_sessions` (
  `id` int(10) UNSIGNED NOT NULL,
  `admin_user_id` int(10) UNSIGNED NOT NULL,
  `token_hash` char(64) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `last_used_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin_users`
--

CREATE TABLE `admin_users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'admin',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin_users`
--

INSERT INTO `admin_users` (`id`, `name`, `email`, `password_hash`, `role`, `is_active`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'Jebal Homes Admin', 'admin@jebalhomes.com', '$2y$10$qUxMi011QkaqBK9d9f6P7OxCIR5fJLtxt4j4FNvjalX6ACuLFI1m2', 'admin', 1, NULL, '2026-06-19 08:27:53', '2026-06-19 09:14:41');

-- --------------------------------------------------------

--
-- Table structure for table `bookings`
--

CREATE TABLE `bookings` (
  `id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `phone` varchar(50) NOT NULL,
  `room_name` varchar(150) NOT NULL,
  `check_in_date` date NOT NULL,
  `check_out_date` date NOT NULL,
  `guests` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `message` text DEFAULT NULL,
  `status` enum('Pending','Confirmed','Cancelled') NOT NULL DEFAULT 'Pending',
  `payment_status` enum('Payment Pending','Paid','Failed','Cancelled','Refunded') NOT NULL DEFAULT 'Payment Pending',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'LKR',
  `invoice_id` int(10) UNSIGNED DEFAULT NULL,
  `invoice_number` varchar(80) DEFAULT NULL,
  `invoice_file_path` varchar(255) DEFAULT NULL,
  `invoice_generated_at` datetime DEFAULT NULL,
  `email_status` varchar(50) NOT NULL DEFAULT 'Pending',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `bookings`
--

INSERT INTO `bookings` (`id`, `full_name`, `email`, `phone`, `room_name`, `check_in_date`, `check_out_date`, `guests`, `message`, `status`, `payment_status`, `amount`, `currency`, `invoice_id`, `invoice_number`, `invoice_file_path`, `invoice_generated_at`, `email_status`, `ip_address`, `user_agent`, `created_at`, `updated_at`) VALUES
(1, 'Kumar Rajan', 'kumar@example.com', '+94771234567', 'Ground Floor Room 1', '2026-06-24', '2026-06-26', 2, 'Need parking space.', 'Pending', 'Payment Pending', 17000.00, 'LKR', NULL, NULL, NULL, NULL, 'Sent', NULL, NULL, '2026-06-19 08:27:54', '2026-06-19 08:27:54'),
(2, 'Nivetha Siva', 'nivetha@example.com', '+94772345678', 'Family Room', '2026-06-29', '2026-07-01', 4, 'Family stay.', 'Confirmed', 'Paid', 28000.00, 'LKR', NULL, NULL, NULL, NULL, 'Sent', NULL, NULL, '2026-06-19 08:27:54', '2026-06-19 08:27:54'),
(3, 'Arun Thevan', 'arun@example.com', '+94773456789', 'Private Cottage', '2026-07-04', '2026-07-05', 2, 'Late check-in possible?', 'Cancelled', 'Cancelled', 18000.00, 'LKR', NULL, NULL, NULL, NULL, 'Sent', NULL, NULL, '2026-06-19 08:27:54', '2026-06-19 08:27:54');

-- --------------------------------------------------------

--
-- Table structure for table `email_logs`
--

CREATE TABLE `email_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `booking_id` int(10) UNSIGNED DEFAULT NULL,
  `enquiry_id` int(10) UNSIGNED DEFAULT NULL,
  `recipient_email` varchar(190) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `email_type` varchar(80) NOT NULL,
  `status` enum('Pending','Sent','Failed') NOT NULL DEFAULT 'Pending',
  `error_message` text DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `enquiries`
--

CREATE TABLE `enquiries` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(190) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `subject` varchar(190) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('New','Read','Replied') NOT NULL DEFAULT 'New',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `enquiries`
--

INSERT INTO `enquiries` (`id`, `name`, `email`, `phone`, `subject`, `message`, `status`, `ip_address`, `user_agent`, `created_at`, `updated_at`) VALUES
(1, 'Suresh Kanthan', 'suresh@example.com', '+94774567890', 'Room availability', 'Do you have a room available this weekend?', 'New', NULL, NULL, '2026-06-19 08:27:54', '2026-06-19 08:27:54'),
(2, 'Meena Raj', 'meena@example.com', '+94775678901', 'Family room details', 'Please send family room details and price.', 'Read', NULL, NULL, '2026-06-19 08:27:54', '2026-06-19 08:27:54'),
(3, 'David Fernando', 'david@example.com', '+94776789012', 'Parking', 'Is parking available for guests?', 'Replied', NULL, NULL, '2026-06-19 08:27:54', '2026-06-19 08:27:54');

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(10) UNSIGNED NOT NULL,
  `booking_id` int(10) UNSIGNED NOT NULL,
  `invoice_number` varchar(80) NOT NULL,
  `customer_name` varchar(150) NOT NULL,
  `customer_email` varchar(190) NOT NULL,
  `room_name` varchar(150) NOT NULL,
  `check_in_date` date NOT NULL,
  `check_out_date` date NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'LKR',
  `payment_method` varchar(60) NOT NULL DEFAULT 'PayHere',
  `payment_date` datetime DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(10) UNSIGNED NOT NULL,
  `booking_id` int(10) UNSIGNED DEFAULT NULL,
  `order_id` varchar(100) NOT NULL,
  `payment_id` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'LKR',
  `status` enum('Payment Pending','Paid','Failed','Cancelled','Refunded') NOT NULL DEFAULT 'Payment Pending',
  `method` varchar(60) NOT NULL DEFAULT 'PayHere',
  `gateway_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gateway_response`)),
  `invoice_id` int(10) UNSIGNED DEFAULT NULL,
  `invoice_number` varchar(80) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `booking_id`, `order_id`, `payment_id`, `amount`, `currency`, `status`, `method`, `gateway_response`, `invoice_id`, `invoice_number`, `created_at`, `updated_at`) VALUES
(1, 2, 'JH-ORDER-00002', 'PH-SAMPLE-00002', 28000.00, 'LKR', 'Paid', 'PayHere', '{\"sample\": true, \"status_message\": \"Sample paid payment\"}', NULL, NULL, '2026-06-19 08:27:54', '2026-06-19 08:27:54');

-- --------------------------------------------------------

--
-- Table structure for table `rate_limits`
--

CREATE TABLE `rate_limits` (
  `id` int(10) UNSIGNED NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `action` varchar(80) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(10) UNSIGNED NOT NULL,
  `room_name` varchar(150) NOT NULL,
  `slug` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `max_guests` int(10) UNSIGNED NOT NULL DEFAULT 2,
  `bed_type` varchar(100) DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'LKR',
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`amenities`)),
  `status` enum('Available','Unavailable','Maintenance') NOT NULL DEFAULT 'Available',
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `room_name`, `slug`, `description`, `max_guests`, `bed_type`, `base_price`, `currency`, `amenities`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Ground Floor Room 1', 'ground-floor-room-1', 'Comfortable ground floor room with attached bathroom and easy access.', 2, 'Double Bed', 8500.00, 'LKR', '[\"Air Conditioning\", \"Free WiFi\", \"Television\", \"Attached Bathroom\", \"Parking\", \"Garden Access\"]', 'Available', 1, '2026-06-19 08:27:53', '2026-06-19 08:27:53'),
(2, 'Ground Floor Room 2', 'ground-floor-room-2', 'Clean and peaceful ground floor room suitable for short stays.', 2, 'Double Bed', 8500.00, 'LKR', '[\"Air Conditioning\", \"Free WiFi\", \"Television\", \"Attached Bathroom\", \"Parking\"]', 'Available', 2, '2026-06-19 08:27:53', '2026-06-19 08:27:53'),
(3, 'First Floor Room 1', 'first-floor-room-1', 'First floor room with balcony and comfortable stay facilities.', 2, 'Double Bed', 9500.00, 'LKR', '[\"Air Conditioning\", \"Free WiFi\", \"Television\", \"Attached Bathroom\", \"Balcony\", \"Parking\"]', 'Available', 3, '2026-06-19 08:27:53', '2026-06-19 08:27:53'),
(4, 'First Floor Room 2', 'first-floor-room-2', 'Quiet first floor room with balcony and attached bathroom.', 2, 'Double Bed', 9500.00, 'LKR', '[\"Air Conditioning\", \"Free WiFi\", \"Television\", \"Attached Bathroom\", \"Balcony\", \"Parking\"]', 'Available', 4, '2026-06-19 08:27:53', '2026-06-19 08:27:53'),
(5, 'Family Room', 'family-room', 'Spacious room suitable for families and small groups.', 4, 'Double Bed + Single Beds', 14000.00, 'LKR', '[\"Air Conditioning\", \"Free WiFi\", \"Television\", \"Attached Bathroom\", \"Parking\", \"Garden Access\"]', 'Available', 5, '2026-06-19 08:27:53', '2026-06-19 08:27:53'),
(6, 'Private Cottage', 'private-cottage', 'Private cottage for guests who prefer more privacy and space.', 4, 'Double Bed', 18000.00, 'LKR', '[\"Air Conditioning\", \"Free WiFi\", \"Television\", \"Attached Bathroom\", \"Parking\", \"Garden Access\"]', 'Available', 6, '2026-06-19 08:27:53', '2026-06-19 08:27:53');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_admin_sessions_token_hash` (`token_hash`),
  ADD KEY `idx_admin_sessions_user` (`admin_user_id`),
  ADD KEY `idx_admin_sessions_expires` (`expires_at`);

--
-- Indexes for table `admin_users`
--
ALTER TABLE `admin_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_admin_users_email` (`email`),
  ADD KEY `idx_admin_users_active` (`is_active`);

--
-- Indexes for table `bookings`
--
ALTER TABLE `bookings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bookings_room_dates_status` (`room_name`,`status`,`check_in_date`,`check_out_date`),
  ADD KEY `idx_bookings_status` (`status`),
  ADD KEY `idx_bookings_payment_status` (`payment_status`),
  ADD KEY `idx_bookings_created_at` (`created_at`),
  ADD KEY `idx_bookings_email` (`email`),
  ADD KEY `fk_bookings_invoice` (`invoice_id`);

--
-- Indexes for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email_logs_booking` (`booking_id`),
  ADD KEY `idx_email_logs_enquiry` (`enquiry_id`),
  ADD KEY `idx_email_logs_status` (`status`);

--
-- Indexes for table `enquiries`
--
ALTER TABLE `enquiries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_enquiries_status` (`status`),
  ADD KEY `idx_enquiries_created_at` (`created_at`),
  ADD KEY `idx_enquiries_email` (`email`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_invoices_invoice_number` (`invoice_number`),
  ADD KEY `idx_invoices_booking_id` (`booking_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_payments_order_id` (`order_id`),
  ADD KEY `idx_payments_booking_id` (`booking_id`),
  ADD KEY `idx_payments_status` (`status`),
  ADD KEY `idx_payments_created_at` (`created_at`),
  ADD KEY `fk_payments_invoice` (`invoice_id`);

--
-- Indexes for table `rate_limits`
--
ALTER TABLE `rate_limits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_rate_limits_lookup` (`ip_address`,`action`,`created_at`),
  ADD KEY `idx_rate_limits_created_at` (`created_at`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_rooms_room_name` (`room_name`),
  ADD UNIQUE KEY `uniq_rooms_slug` (`slug`),
  ADD KEY `idx_rooms_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin_users`
--
ALTER TABLE `admin_users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `bookings`
--
ALTER TABLE `bookings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `email_logs`
--
ALTER TABLE `email_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `enquiries`
--
ALTER TABLE `enquiries`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `rate_limits`
--
ALTER TABLE `rate_limits`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin_sessions`
--
ALTER TABLE `admin_sessions`
  ADD CONSTRAINT `fk_admin_sessions_user` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `bookings`
--
ALTER TABLE `bookings`
  ADD CONSTRAINT `fk_bookings_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD CONSTRAINT `fk_email_logs_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_email_logs_enquiry` FOREIGN KEY (`enquiry_id`) REFERENCES `enquiries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_invoices_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

CREATE TABLE IF NOT EXISTS gallery_folders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  folder_id INT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  image_file_name VARCHAR(180) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_gallery_images_folder
    FOREIGN KEY (folder_id) REFERENCES gallery_folders(id)
    ON DELETE CASCADE,
  INDEX idx_gallery_images_folder_sort (folder_id, sort_order),
  INDEX idx_gallery_images_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS experience_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  location VARCHAR(150) DEFAULT NULL,
  description TEXT NOT NULL,
  image_path VARCHAR(255) DEFAULT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  sort_order INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE experience_items
ADD COLUMN distance VARCHAR(100) NULL AFTER location;

CREATE TABLE IF NOT EXISTS `website_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `website_settings` (`setting_key`, `setting_value`) VALUES
('business_name', 'Jebal Guest House'),
('address', 'Jebal Guest House, Sri Lanka'),
('phone', '+94 77 123 4567'),
('reception_contact_number', '+94 21 222 4567'),
('whatsapp_reservation_number', '+94 77 123 4567'),
('email', 'reservations@jebalguesthouse.com'),
('business_hours', 'Daily · 7:00 AM – 10:00 PM'),
('facebook_link', ''),
('instagram_link', ''),
('map_embed_url', '')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

CREATE TABLE IF NOT EXISTS admin_password_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  attempts INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_email (email),
  INDEX idx_expires_at (expires_at)
);

ALTER TABLE admin_password_otps
ADD COLUMN expires_at_epoch INT NOT NULL DEFAULT 0 AFTER expires_at;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_booking_for_other TINYINT(1) NOT NULL DEFAULT 0 AFTER phone,
  ADD COLUMN IF NOT EXISTS staying_guest_name VARCHAR(150) DEFAULT NULL AFTER is_booking_for_other,
  ADD COLUMN IF NOT EXISTS staying_guest_email VARCHAR(190) DEFAULT NULL AFTER staying_guest_name,
  ADD COLUMN IF NOT EXISTS staying_guest_phone VARCHAR(50) DEFAULT NULL AFTER staying_guest_email,
  ADD COLUMN IF NOT EXISTS staying_guest_note TEXT DEFAULT NULL AFTER staying_guest_phone;


-- Optional manual migration. The PHP helper also creates this table automatically.
CREATE TABLE IF NOT EXISTS booking_audit_logs (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_id INT UNSIGNED NOT NULL,
    payment_id INT UNSIGNED NULL,
    order_id VARCHAR(120) NULL,
    event_type VARCHAR(80) NOT NULL,
    event_title VARCHAR(160) NOT NULL,
    event_message TEXT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_booking_audit_booking_id (booking_id),
    KEY idx_booking_audit_event_type (event_type),
    KEY idx_booking_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS email_queue (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    related_type VARCHAR(40) NULL,
    related_id INT UNSIGNED NULL,
    recipient_email VARCHAR(190) NOT NULL,
    reply_to_email VARCHAR(190) NULL,
    subject VARCHAR(255) NOT NULL,
    body_html MEDIUMTEXT NOT NULL,
    email_type VARCHAR(80) NOT NULL,
    status ENUM('pending','processing','sent','failed') NOT NULL DEFAULT 'pending',
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 3,
    last_error TEXT NULL,
    available_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_at DATETIME NULL,
    sent_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_email_queue_job (related_type, related_id, email_type, recipient_email),
    KEY idx_email_queue_status_available (status, available_at, id),
    KEY idx_email_queue_related (related_type, related_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fix older email_queue tables that were created before the cron worker fields existed.
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS reply_to_email VARCHAR(190) NULL AFTER recipient_email;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS body_html MEDIUMTEXT NULL AFTER subject;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS max_attempts TINYINT UNSIGNED NOT NULL DEFAULT 3 AFTER attempts;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS locked_at DATETIME NULL AFTER available_at;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS sent_at DATETIME NULL AFTER locked_at;

ALTER TABLE bookings
MODIFY COLUMN status ENUM(
    'Pending',
    'Confirmed',
    'Checked In',
    'Checked Out',
    'Cancelled',
    'No Show'
) NOT NULL DEFAULT 'Pending';



CREATE TABLE IF NOT EXISTS external_calendar_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_id INT UNSIGNED NOT NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'booking.com',
  external_uid VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  summary VARCHAR(255) NULL,
  status VARCHAR(40) NULL,
  external_last_modified DATETIME NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_seen_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_provider_room_uid (provider, room_id, external_uid),
  KEY idx_external_room_dates (room_id, start_date, end_date, is_active),
  CONSTRAINT fk_external_calendar_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS external_calendar_sync_status (
  room_id INT UNSIGNED NOT NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'booking.com',
  last_sync_started_at DATETIME NULL,
  last_sync_completed_at DATETIME NULL,
  last_sync_status VARCHAR(30) NULL,
  last_sync_error TEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (room_id),
  CONSTRAINT fk_external_sync_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Run this once against the existing Jebal database.
-- It changes currency codes only. It intentionally does not convert amounts.
-- Update every room's numeric price in the admin dashboard immediately after running it.

START TRANSACTION;

ALTER TABLE rooms
    MODIFY currency VARCHAR(10) NOT NULL DEFAULT 'USD';

ALTER TABLE bookings
    MODIFY currency VARCHAR(10) NOT NULL DEFAULT 'USD';

ALTER TABLE payments
    MODIFY currency VARCHAR(10) NOT NULL DEFAULT 'USD';

ALTER TABLE invoices
    MODIFY currency VARCHAR(10) NOT NULL DEFAULT 'USD';

UPDATE rooms SET currency = 'USD';

COMMIT;

ALTER TABLE gallery_folders
ADD COLUMN sort_order INT UNSIGNED NOT NULL DEFAULT 1
AFTER status;

UPDATE gallery_folders
SET sort_order = id;

-- Run once before deploying the multi-room booking files.

CREATE TABLE IF NOT EXISTS booking_groups (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    booking_no VARCHAR(40) NULL,
    primary_booking_id INT UNSIGNED NULL,
    total_guests INT UNSIGNED NOT NULL,
    total_rooms INT UNSIGNED NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_booking_groups_booking_no (booking_no),
    KEY idx_booking_groups_primary_booking (primary_booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS booking_group_id BIGINT UNSIGNED NULL AFTER id,
    ADD COLUMN IF NOT EXISTS is_group_primary TINYINT(1) NOT NULL DEFAULT 0 AFTER booking_group_id;

ALTER TABLE bookings
    ADD INDEX IF NOT EXISTS idx_bookings_group_id (booking_group_id);

-- Step 1: central hotel contact and location details.
-- Import once in phpMyAdmin after replacing the application files.

INSERT INTO website_settings (setting_key, setting_value, updated_at) VALUES
('business_name', 'Jebal Guest House', NOW()),
('address', 'Old Church Road (near the RC School)\nUyarappulam\nAnnaicoddai\nJaffna\nSri Lanka', NOW()),
('phone', '+31 6 28324956', NOW()),
('reception_contact_number', '+94 77 951 8657', NOW()),
('whatsapp_reservation_number', '+94 77 951 8657', NOW())
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  updated_at = NOW();

INSERT IGNORE INTO website_settings (setting_key, setting_value, updated_at) VALUES
('email', 'info@jebalguesthouse.com', NOW()),
('map_embed_url', '', NOW()),
('google_maps_url', '', NOW());

-- Step 2: database-managed property amenities and nearby places.
-- Import this file once through phpMyAdmin.

CREATE TABLE IF NOT EXISTS property_amenities (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    is_available TINYINT(1) NOT NULL DEFAULT 0,
    is_visible TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nearby_places (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    distance DECIMAL(8,2) NOT NULL,
    distance_unit ENUM('m', 'km') NOT NULL DEFAULT 'km',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO property_amenities (name, is_available, is_visible)
SELECT seed.name, seed.is_available, seed.is_visible
FROM (
    SELECT 'Air Conditioning' AS name, 1 AS is_available, 0 AS is_visible
    UNION ALL SELECT 'Television', 1, 0
    UNION ALL SELECT 'Free Wi-Fi', 1, 0
    UNION ALL SELECT 'Attached Bathroom', 1, 0
    UNION ALL SELECT 'Swimming Pool', 0, 1
    UNION ALL SELECT 'Breakfast', 0, 1
    UNION ALL SELECT 'Lunch', 0, 1
    UNION ALL SELECT 'Dinner', 0, 1
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM property_amenities LIMIT 1);

INSERT INTO nearby_places (name, distance, distance_unit)
SELECT seed.name, seed.distance, seed.distance_unit
FROM (
    SELECT 'Nearby Beach' AS name, 0.00 AS distance, 'km' AS distance_unit
    UNION ALL SELECT 'Nearby Shop', 0.00, 'km'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM nearby_places LIMIT 1);

-- Revised Step 2: database amenity catalogue and per-room assignments.
-- Import once in phpMyAdmin after replacing the application files.

CREATE TABLE IF NOT EXISTS property_amenities (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    is_available TINYINT(1) NOT NULL DEFAULT 1,
    is_visible TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nearby_places (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    distance DECIMAL(8,2) NOT NULL,
    distance_unit ENUM('m', 'km') NOT NULL DEFAULT 'km',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE rooms
    ADD COLUMN IF NOT EXISTS show_unavailable_amenities TINYINT(1) NOT NULL DEFAULT 0 AFTER amenities;

CREATE TABLE IF NOT EXISTS room_amenities (
    room_id INT UNSIGNED NOT NULL,
    amenity_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, amenity_id),
    KEY idx_room_amenities_amenity (amenity_id),
    CONSTRAINT fk_room_amenities_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_room_amenities_amenity FOREIGN KEY (amenity_id) REFERENCES property_amenities(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO property_amenities (name, is_available, is_visible)
SELECT seed.name, 1, 0
FROM (
    SELECT 'Balcony' AS name
    UNION ALL SELECT 'Air Conditioning'
    UNION ALL SELECT 'Television'
    UNION ALL SELECT 'Free WiFi'
    UNION ALL SELECT 'Attached Bathroom'
    UNION ALL SELECT 'Guest Bathroom'
    UNION ALL SELECT 'Swimming Pool'
    UNION ALL SELECT 'Breakfast'
    UNION ALL SELECT 'Lunch'
    UNION ALL SELECT 'Dinner'
) seed
WHERE NOT EXISTS (
    SELECT 1 FROM property_amenities existing WHERE LOWER(existing.name) = LOWER(seed.name)
);

-- Preserve current JSON room amenities by converting matching names into relationships.
INSERT IGNORE INTO room_amenities (room_id, amenity_id)
SELECT r.id, a.id
FROM rooms r
INNER JOIN property_amenities a
    ON JSON_CONTAINS(COALESCE(r.amenities, JSON_ARRAY()), JSON_QUOTE(a.name));

-- Handle the earlier spelling used for Free Wi-Fi.
INSERT IGNORE INTO room_amenities (room_id, amenity_id)
SELECT r.id, a.id
FROM rooms r
INNER JOIN property_amenities a ON LOWER(REPLACE(a.name, '-', '')) = 'free wifi'
WHERE JSON_CONTAINS(COALESCE(r.amenities, JSON_ARRAY()), JSON_QUOTE('Free WiFi'))
   OR JSON_CONTAINS(COALESCE(r.amenities, JSON_ARRAY()), JSON_QUOTE('Free Wi-Fi'));

UPDATE property_amenities SET is_available = 1, is_visible = 0;

INSERT INTO nearby_places (name, distance, distance_unit)
SELECT seed.name, seed.distance, seed.distance_unit
FROM (
    SELECT 'Nearby Beach' AS name, 0.00 AS distance, 'km' AS distance_unit
    UNION ALL SELECT 'Nearby Shop', 0.00, 'km'
) seed
WHERE NOT EXISTS (SELECT 1 FROM nearby_places LIMIT 1);

-- Step 1: database-managed Office 365 mail accounts and routing.
-- Safe to run more than once on MySQL 8 / MariaDB 10.5+.

CREATE TABLE IF NOT EXISTS mail_accounts (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_name VARCHAR(120) NOT NULL,
    provider VARCHAR(30) NOT NULL DEFAULT 'office365',
    email_address VARCHAR(190) NOT NULL,
    smtp_username VARCHAR(190) NOT NULL,
    encrypted_password TEXT NOT NULL,
    from_name VARCHAR(190) NOT NULL,
    smtp_host VARCHAR(190) NOT NULL DEFAULT 'smtp.office365.com',
    smtp_port SMALLINT UNSIGNED NOT NULL DEFAULT 587,
    smtp_encryption VARCHAR(20) NOT NULL DEFAULT 'tls',
    is_enabled TINYINT(1) NOT NULL DEFAULT 0,
    connection_status VARCHAR(20) NOT NULL DEFAULT 'untested',
    last_tested_at DATETIME NULL,
    last_test_message VARCHAR(500) NULL,
    created_by INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_mail_accounts_email (email_address),
    KEY idx_mail_accounts_enabled (is_enabled),
    CONSTRAINT fk_mail_accounts_created_by FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mail_account_functions (
    mail_account_id INT UNSIGNED NOT NULL,
    function_key VARCHAR(60) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (mail_account_id, function_key),
    KEY idx_mail_account_functions_key (function_key),
    CONSTRAINT fk_mail_account_functions_account FOREIGN KEY (mail_account_id) REFERENCES mail_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mail_routing_rules (
    function_key VARCHAR(60) NOT NULL,
    sender_account_id INT UNSIGNED NULL,
    hotel_recipient_email VARCHAR(190) NULL,
    reply_to_email VARCHAR(190) NULL,
    send_customer_copy TINYINT(1) NOT NULL DEFAULT 1,
    send_hotel_copy TINYINT(1) NOT NULL DEFAULT 1,
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (function_key),
    KEY idx_mail_routing_sender (sender_account_id),
    CONSTRAINT fk_mail_routing_sender FOREIGN KEY (sender_account_id) REFERENCES mail_accounts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mail_settings_audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    admin_user_id INT UNSIGNED NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(40) NOT NULL,
    entity_id VARCHAR(80) NULL,
    change_summary VARCHAR(500) NOT NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_mail_audit_created (created_at),
    CONSTRAINT fk_mail_audit_admin FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO mail_routing_rules
    (function_key, hotel_recipient_email, send_customer_copy, send_hotel_copy, is_enabled)
VALUES
    ('booking', 'bookings@jebalguesthouse.com', 1, 1, 1),
    ('payment', 'bookings@jebalguesthouse.com', 1, 1, 1),
    ('contact', 'info@jebalguesthouse.com', 1, 1, 1),
    ('contact_auto_reply', NULL, 1, 0, 1),
    ('stay_reminder', 'admin@jebalguesthouse.com', 1, 0, 1),
    ('admin_alert', 'admin@jebalguesthouse.com', 0, 1, 1),
    ('test_email', 'admin@jebalguesthouse.com', 0, 1, 1)
ON DUPLICATE KEY UPDATE function_key = VALUES(function_key);

-- Promote the first active administrator so the protected mail settings page
-- is usable on installations that previously had only the legacy `admin` role.
UPDATE admin_users
SET role = 'super_admin'
WHERE id = (
    SELECT first_admin_id FROM (
        SELECT MIN(id) AS first_admin_id FROM admin_users WHERE is_active = 1
    ) AS active_admin
);

CREATE TABLE IF NOT EXISTS external_portal_links (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    portal_key VARCHAR(80) NOT NULL,
    title VARCHAR(120) NOT NULL,
    description VARCHAR(500) NULL,
    portal_url VARCHAR(1000) NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'other',
    is_enabled TINYINT(1) NOT NULL DEFAULT 1,
    is_system TINYINT(1) NOT NULL DEFAULT 0,
    created_by INT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_external_portal_key (portal_key),
    KEY idx_external_portal_enabled (is_enabled, title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO external_portal_links (portal_key, title, description, portal_url, category, is_enabled, is_system) VALUES
('google-business-profile', 'Google Business Profile', 'Manage the hotel profile, opening hours, photos and reviews shown on Google.', 'https://business.google.com/', 'business', 1, 1),
('booking-com-extranet', 'Booking.com Extranet', 'Manage Booking.com property information, availability and reservations.', 'https://admin.booking.com/', 'booking', 1, 1),
('microsoft-365-admin', 'Microsoft 365 Admin', 'Manage Office 365 users, licenses, domains and organization settings.', 'https://admin.microsoft.com/', 'email', 1, 1),
('outlook-webmail', 'Outlook Webmail', 'Open the Office 365 mailbox in Outlook on the web.', 'https://outlook.office.com/mail/', 'email', 1, 1),
('google-analytics', 'Google Analytics', 'Review website traffic and visitor reports.', 'https://analytics.google.com/', 'analytics', 1, 1),
('google-search-console', 'Google Search Console', 'Review Google search visibility, indexing and website issues.', 'https://search.google.com/search-console/', 'analytics', 1, 1),
('cpanel', 'cPanel', 'Open the hosting control panel. Change this URL if your hosting provider uses a different address.', 'https://jebalguesthouse.com:2083/', 'hosting', 1, 1)
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description);
