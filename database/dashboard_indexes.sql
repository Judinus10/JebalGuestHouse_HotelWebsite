-- No schema redesign is required for dashboard statistics.
-- These indexes are safe performance additions for the current bookings, enquiries, and payments tables.
-- If an index already exists, do not add the duplicate index again.

ALTER TABLE `bookings`
  ADD INDEX `idx_bookings_status_dates` (`status`, `check_in_date`, `check_out_date`),
  ADD INDEX `idx_bookings_created_at` (`created_at`),
  ADD INDEX `idx_bookings_payment_status_created` (`payment_status`, `created_at`),
  ADD INDEX `idx_bookings_room_status` (`room_name`, `status`);

ALTER TABLE `enquiries`
  ADD INDEX `idx_enquiries_status_created` (`status`, `created_at`);

ALTER TABLE `payments`
  ADD INDEX `idx_payments_status_created` (`status`, `created_at`),
  ADD INDEX `idx_payments_booking_status` (`booking_id`, `status`);
