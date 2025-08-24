import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// NEW TABLES ACCORDING TO ERD
// ============================================================================

// Company table - stores information about companies (clients, carriers, etc.)
export const company = pgTable("company", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 500 }),
  contact: varchar("contact", { length: 255 }),
  type: varchar("type", { length: 100 }), // e.g., "Medlog", "MSC", "Client"
  createdBy: integer("created_by").references(() => user.id).nullable(),
  createdAt: timestamp("created_at").defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => user.id).nullable(),
  lastModifiedAt: timestamp("last_modified_at"),
});

// Role table - defines different user roles within the system
export const role = pgTable("role", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "Admin", "MSC User", "Medlog User"
});

// Port table - stores information about shipping ports
export const port = pgTable("port", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 100 }),
  address: varchar("address", { length: 500 }),
  createdBy: integer("created_by").references(() => user.id).nullable(),
  createdAt: timestamp("created_at").defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => user.id).nullable(),
  lastModifiedAt: timestamp("last_modified_at"),
});

// City table - stores information about cities
export const city = pgTable("city", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  state: varchar("state", { length: 100 }),
  postalCode: integer("postal_code"),
});

// ============================================================================
// RESTRUCTURED TABLES ACCORDING TO ERD
// ============================================================================

// User table - stores user account information (restructured according to ERD)
export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  password: varchar("password", { length: 255 }),
  role: integer("role").references(() => role.id).notNull(),
  office: varchar("office", { length: 100 }),
  company: integer("company").references(() => company.id),
  createdBy: integer("created_by").references(() => user.id).nullable(),
  createdAt: timestamp("created_at").defaultNow(),
  lastModifiedBy: integer("last_modified_by").references(() => user.id).nullable(),
  lastModifiedAt: timestamp("last_modified_at"),
});

// BL table - represents a Bill of Lading (restructured according to ERD)
export const bl = pgTable("bl", {
  id: serial("id").primaryKey(),
  blNumber: varchar("bl_number", { length: 100 }).notNull(),
  pic: integer("pic").references(() => user.id), // Person in Charge
  client: integer("client").references(() => company.id).notNull(),
  containerAmount: integer("container_amount").notNull(),
  direction: text("direction").notNull(), // 'Import' | 'Export'
  eta: timestamp("eta").notNull(), // Estimated Time of Arrival
  hasDangerous: boolean("has_dangerous").default(false),
  hasDt: boolean("has_dt").default(false), // Direct Transport
  localPort: integer("local_port").references(() => port.id),
  lockTime: timestamp("lock_time"),
  lockUser: varchar("lock_user", { length: 100 }),
  medlogStatus: varchar("medlog_status", { length: 100 }).notNull(),
  carrierStatus: varchar("carrier_status", { length: 100 }).notNull(),
  location: integer("location").references(() => city.id),
  medlogBulb: boolean("medlog_bulb").default(false),
  carrierBulb: boolean("carrier_bulb").default(false),
  voyage: varchar("voyage", { length: 100 }),
  vessel: varchar("vessel", { length: 255 }),
  carrier: integer("carrier").references(() => company.id),
  notifyEmail: varchar("notify_email", { length: 255 }),
  toBeNotified: boolean("to_be_notified").default(false),
  use: boolean("use").default(true),
  
  // Change tracking fields (boolean flags for each field)
  blNumberChange: boolean("bl_number_change").default(false),
  picChange: boolean("pic_change").default(false),
  clientChange: boolean("client_change").default(false),
  containerChange: boolean("container_change").default(false),
  directionChange: boolean("direction_change").default(false),
  etaChange: boolean("eta_change").default(false),
  hasDangerousChange: boolean("has_dangerous_change").default(false),
  hasDtChange: boolean("has_dt_change").default(false),
  localPortChange: boolean("local_port_change").default(false),
  medlogStatusChange: boolean("medlog_status_change").default(false),
  carrierStatusChange: boolean("carrier_status_change").default(false),
  locationChange: boolean("location_change").default(false),
  remotePortChange: boolean("remote_port_change").default(false),
  medlogBulbChange: boolean("medlog_bulb_change").default(false),
  carrierBulbChange: boolean("carrier_bulb_change").default(false),
  vesselChange: boolean("vessel_change").default(false),
  voyageChange: boolean("voyage_change").default(false),
});

// Container table - stores detailed information about individual shipping containers
export const container = pgTable("container", {
  id: serial("id").primaryKey(),
  containerIlu: varchar("container_ilu", { length: 100 }).notNull(), // Container identification number
  type: varchar("type", { length: 50 }).notNull(), // e.g., 20GP, 40HC
  weight: decimal("weight", { precision: 10, scale: 2 }),
  customs: varchar("customs", { length: 100 }),
  isDangerous: boolean("is_dangerous").default(false),
  deliveryDate: timestamp("delivery_date"),
  isDirectTruck: boolean("is_direct_truck").default(false),
  medlogStatus: varchar("medlog_status", { length: 100 }).notNull(),
  carrierStatus: varchar("carrier_status", { length: 100 }).notNull(),
  medlogNote: text("medlog_note"),
  carrierNote: text("carrier_note"),
  isSentInMips: boolean("is_sent_in_mips").default(false),
  location: varchar("location", { length: 255 }),
  zip: varchar("zip", { length: 20 }),
  train: varchar("train", { length: 100 }),
  trainDate: timestamp("train_date"),
  deliveryNotPossible: boolean("delivery_not_possible").default(false),
  use: boolean("use").default(true),
  
  // Change tracking fields (boolean flags for each field)
  containerIluChange: boolean("container_ilu_change").default(false),
  typeChange: boolean("type_change").default(false),
  weightChange: boolean("weight_change").default(false),
  customsChange: boolean("customs_change").default(false),
  isDangerousChange: boolean("is_dangerous_change").default(false),
  deliveryDateChange: boolean("delivery_date_change").default(false),
  isDirectTruckChange: boolean("is_direct_truck_change").default(false),
  medlogStatusChange: boolean("medlog_status_change").default(false),
  mscStatusChange: boolean("msc_status_change").default(false),
  medlogNoteChange: boolean("medlog_note_change").default(false),
  mscNoteChange: boolean("msc_note_change").default(false),
  isSentInMipsChange: boolean("is_sent_in_mips_change").default(false),
  locationChange: boolean("location_change").default(false),
  zipChange: boolean("zip_change").default(false),
  trainChange: boolean("train_change").default(false),
  trainDateChange: boolean("train_date_change").default(false),
  deliveryNotPossibleChange: integer("delivery_not_possible_change").default(0), // Note: this is integer in ERD
});

// Container in BL junction table - links BL records to container records (M:N relationship)
export const containerInBl = pgTable("container_in_bl", {
  id: serial("id").primaryKey(),
  blId: integer("bl_id").notNull().references(() => bl.id),
  containerId: varchar("container_id", { length: 100 }).notNull().references(() => container.containerIlu),
});

// Chat messages table - stores chat messages related to a specific BL
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  blId: integer("bl_id").references(() => bl.id).notNull(),
  user: integer("user").references(() => user.id).notNull(),
  message: text("message").notNull(),
  sent: timestamp("sent").notNull().defaultNow(),
});

// ============================================================================
// SCHEMAS AND TYPES
// ============================================================================

// Insert schemas
export const insertCompanySchema = createInsertSchema(company).omit({
  id: true,
  createdAt: true,
  lastModifiedAt: true,
});

export const insertRoleSchema = createInsertSchema(role).omit({
  id: true,
});

export const insertPortSchema = createInsertSchema(port).omit({
  id: true,
  createdAt: true,
  lastModifiedAt: true,
});

export const insertCitySchema = createInsertSchema(city).omit({
  id: true,
});

export const insertUserSchema = createInsertSchema(user).omit({
  id: true,
  createdAt: true,
  lastModifiedAt: true,
});

export const insertBlSchema = createInsertSchema(bl).omit({
  id: true,
});

export const insertContainerSchema = createInsertSchema(container).omit({
  id: true,
});

export const insertContainerInBlSchema = createInsertSchema(containerInBl).omit({
  id: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  sent: true,
});

// Export types
export type Company = typeof company.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Role = typeof role.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export type Port = typeof port.$inferSelect;
export type InsertPort = z.infer<typeof insertPortSchema>;

export type City = typeof city.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;

export type User = typeof user.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BL = typeof bl.$inferSelect;
export type InsertBL = z.infer<typeof insertBlSchema>;

export type Container = typeof container.$inferSelect;
export type InsertContainer = z.infer<typeof insertContainerSchema>;

export type ContainerInBl = typeof containerInBl.$inferSelect;
export type InsertContainerInBl = z.infer<typeof insertContainerInBlSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Legacy type aliases for backward compatibility during transition
export type BLSummary = BL;
export type InsertBLSummary = InsertBL;
export type BLDetail = BL;
export type InsertBLDetail = InsertBL;
