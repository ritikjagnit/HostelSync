/**
 * Domain entity models for HostelSync.
 *
 * <p>Implemented Core Entities (Phase 2B):
 * <ul>
 *   <li>{@link com.hostelsync.backend.entity.User} - Authentication credentials, roles, and active status</li>
 *   <li>{@link com.hostelsync.backend.entity.Student} - Academic profile linked to a User account</li>
 *   <li>{@link com.hostelsync.backend.entity.Hostel} - Hostel block definitions (Boys/Girls hostels)</li>
 *   <li>{@link com.hostelsync.backend.entity.Room} - Room inventory with floor, capacity, and hostel reference</li>
 *   <li>{@link com.hostelsync.backend.entity.RoomAllocation} - Student room assignment and lifecycle status</li>
 * </ul>
 *
 * <p>Planned Entities for Future Phases:
 * <ul>
 *   <li>GatePass - Digital leave and exit requests (Phase 4)</li>
 *   <li>Complaint - Maintenance and grievance tickets (Phase 4)</li>
 *   <li>FeeReceipt - Fee collection and verification records (Phase 4)</li>
 * </ul>
 */
package com.hostelsync.backend.entity;
