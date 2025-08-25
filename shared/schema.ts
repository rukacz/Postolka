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
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 10 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  type: varchar("type", { length: 100 }), // e.g., "Medlog", "MSC", "Client"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
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
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 10 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastModifiedAt: timestamp("last_modified_at"),
});

// City table - stores information about cities
export const city = pgTable("city", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 10 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastModifiedAt: timestamp("last_modified_at"),
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
  roleId: integer("role_id").references(() => role.id).notNull(),
  companyId: integer("company_id").references(() => company.id),
  defaultCarrier: varchar("default_carrier", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastModifiedAt: timestamp("last_modified_at"),
});

// BL table - represents a Bill of Lading (restructured according to ERD)
export const bl = pgTable("bl", {
  id: serial("id").primaryKey(),
  blNumber: varchar("bl_number", { length: 100 }).notNull(),
  direction: text("direction").notNull(), // 'Import' | 'Export'
  client: integer("client").references(() => company.id).notNull(),
  carrier: integer("carrier").references(() => company.id),
  pic: integer("pic").references(() => user.id), // Person in Charge
  eta: timestamp("eta").notNull(), // Estimated Time of Arrival
  localPort: integer("local_port").references(() => port.id),
  location: integer("location").references(() => city.id),
  medlogStatus: varchar("medlog_status", { length: 100 }).notNull(),
  carrierStatus: varchar("carrier_status", { length: 100 }).notNull(),
  hasDangerous: boolean("has_dangerous").default(false),
  hasDt: boolean("has_dt").default(false), // Direct Transport
  medlogBulb: varchar("medlog_bulb", { length: 50 }).default('Blue'),
  carrierBulb: varchar("carrier_bulb", { length: 50 }).default('Blue'),
  vessel: varchar("vessel", { length: 255 }),
  voyage: varchar("voyage", { length: 100 }),
  
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
  medlogBulbChange: boolean("medlog_bulb_change").default(false),
  carrierBulbChange: boolean("carrier_bulb_change").default(false),
  vesselChange: boolean("vessel_change").default(false),
  voyageChange: boolean("voyage_change").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastModifiedAt: timestamp("last_modified_at"),
});

// Container table - stores detailed information about individual shipping containers
export const container = pgTable("container", {
  id: varchar("id", { length: 100 }).primaryKey(), // Changed from serial to varchar to match seed data
  containerIlu: varchar("container_ilu", { length: 100 }).notNull(), // Container identification number
  size: varchar("size", { length: 50 }), // e.g., 20GP, 40HC
  type: varchar("type", { length: 50 }).notNull(), // e.g., GP, DV
  weight: decimal("weight", { precision: 10, scale: 2 }),
  customs: varchar("customs", { length: 100 }),
  hasDangerous: boolean("has_dangerous").default(false),
  unloadDate: timestamp("unload_date"),
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
  isActive: boolean("is_active").default(true),
  
  // Change tracking fields (boolean flags for each field)
  containerIluChange: boolean("container_ilu_change").default(false),
  sizeChange: boolean("size_change").default(false),
  typeChange: boolean("type_change").default(false),
  weightChange: boolean("weight_change").default(false),
  customsChange: boolean("customs_change").default(false),
  hasDangerousChange: boolean("has_dangerous_change").default(false),
  unloadDateChange: boolean("unload_date_change").default(false),
  isDirectTruckChange: boolean("is_direct_truck_change").default(false),
  medlogStatusChange: boolean("medlog_status_change").default(false),
  carrierStatusChange: boolean("carrier_status_change").default(false),
  medlogNoteChange: boolean("medlog_note_change").default(false),
  carrierNoteChange: boolean("carrier_note_change").default(false),
  isSentInMipsChange: boolean("is_sent_in_mips_change").default(false),
  locationChange: boolean("location_change").default(false),
  zipChange: boolean("zip_change").default(false),
  trainChange: boolean("train_change").default(false),
  trainDateChange: boolean("train_date_change").default(false),
  deliveryNotPossibleChange: boolean("delivery_not_possible_change").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  lastModifiedAt: timestamp("last_modified_at"),
});

// Container in BL junction table - links BL records to container records (M:N relationship)
export const containerInBl = pgTable("container_in_bl", {
  id: serial("id").primaryKey(),
  blId: integer("bl_id").notNull().references(() => bl.id),
  containerId: varchar("container_id", { length: 100 }).notNull().references(() => container.id), // Changed to reference container.id
});

// Chat messages table - stores chat messages related to a specific BL
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  blId: integer("bl_id").references(() => bl.id).notNull(),
  user: integer("user").references(() => user.id).notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastModifiedAt: timestamp("last_modified_at"),
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

export const insertContainerSchema = createInsertSchema(container);

export const insertContainerInBlSchema = createInsertSchema(containerInBl).omit({
  id: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
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

// Extended types with joined data
export interface BLWithDetails extends BL {
  clientCompany?: Company;
  carrierCompany?: Company;
  picUser?: User;
  localPort?: Port;
  locationCity?: City;
  containers?: Container[];
  lastChatMessage?: string;
  lastChatAuthor?: string;
  unreadChatCount?: number;
}

// Legacy type aliases for backward compatibility during transition
export type BLSummary = BL;
export type InsertBLSummary = InsertBL;
export type BLDetail = BLWithDetails;
export type InsertBLDetail = InsertBL;
