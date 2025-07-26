import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const blSummaries = pgTable("bl_summaries", {
  id: serial("id").primaryKey(),
  blNumber: text("bl_number").notNull().unique(),
  date: text("date").notNull(),
  client: text("client").notNull(),
  consignee: text("consignee").notNull(),
  destination: text("destination").notNull(),
  podPol: text("pod_pol").notNull(), // Port of Discharge/Port of Loading
  containerCount: integer("container_count").notNull(),
  type: text("type").notNull(), // 'Import' | 'Export'
  carrier: text("carrier"),
  carrierStatus: text("carrier_status").notNull(), // 'Pre-Order' | 'MIPS Send' | 'Do Not Release' | 'Cancelled'
  medlogStatus: text("medlog_status").notNull(), // 'New' | 'Approved' | 'Rejected' | 'Changed'
  trainScheduled: boolean("train_scheduled").default(false), // true = zelená ikonka, false = šedá ikonka
  weight: text("weight").notNull(),
  hasChanges: boolean("has_changes").default(false),
  lastChangedBy: text("last_changed_by"), // 'carrier' | 'medlog'
  lastChangedAt: timestamp("last_changed_at"),
  unseenChangesCarrier: integer("unseen_changes_carrier").default(0),
  unseenChangesMedlog: integer("unseen_changes_medlog").default(0),
  changedFields: text("changed_fields").array().default([]), // Array of field names that were changed
});

export const blDetails = pgTable("bl_details", {
  id: serial("id").primaryKey(),
  blNumber: text("bl_number").notNull().unique(),
  customerRef: text("customer_ref").notNull(),
  jobType: text("job_type").notNull(), // 'Import' | 'Export'
  status: text("status").notNull(),
  // Customer Info
  customerName: text("customer_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactPhone: text("contact_phone").notNull(),
  consigneeName: text("consignee_name").notNull(),
  // Vessel Info
  vesselName: text("vessel_name").notNull(),
  shippingLine: text("shipping_line").notNull(),
  eta: text("eta").notNull(),
  availability: text("availability").notNull(),
  storageStart: text("storage_start").notNull(),
  // Delivery Info
  fromLocation: text("from_location").notNull(),
  fromAddress: text("from_address").notNull(),
  fromZone: text("from_zone").notNull(),
  toLocation: text("to_location").notNull(),
  toAddress: text("to_address").notNull(),
  toZone: text("to_zone").notNull(),
  hoursOfOperation: text("hours_of_operation").notNull(),
});

export const containers = pgTable("containers", {
  id: serial("id").primaryKey(),
  blNumber: text("bl_number").notNull(),
  jobNumber: text("job_number").notNull(),
  containerNumber: text("container_number").notNull(),
  size: text("size").notNull(),
  containerType: text("container_type").notNull(),
  dateTime: text("date_time"), // Changed from weight to dateTime
  status: text("status").notNull(),
  sealNumber: text("seal_number"),
  temperature: integer("temperature"),
  routeStep: text("route_step").notNull(), // Current step: 'W' | 'D' | 'C' | 'R'
  unloadAddress: text("unload_address"), // Changed from transporter to unloadAddress
  // Change tracking fields
  lastChangedBy: text("last_changed_by"),
  lastChangedAt: text("last_changed_at"),
  changedFields: text("changed_fields").array(),
});

export const insertBLSummarySchema = createInsertSchema(blSummaries).omit({
  id: true,
  hasChanges: true,
});

export const insertBLDetailSchema = createInsertSchema(blDetails).omit({
  id: true,
});

export const insertContainerSchema = createInsertSchema(containers).omit({
  id: true,
});

export type BLSummary = typeof blSummaries.$inferSelect;
export type InsertBLSummary = z.infer<typeof insertBLSummarySchema>;
export type BLDetail = typeof blDetails.$inferSelect;
export type InsertBLDetail = z.infer<typeof insertBLDetailSchema>;
export type Container = typeof containers.$inferSelect;
export type InsertContainer = z.infer<typeof insertContainerSchema>;

// Keep existing user schema for consistency
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
