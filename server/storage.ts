import { 
  users, type User, type InsertUser,
  blSummaries, type BLSummary, type InsertBLSummary,
  blDetails, type BLDetail, type InsertBLDetail,
  containers, type Container, type InsertContainer
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // BL Summary methods
  getAllBLSummaries(): Promise<BLSummary[]>;
  getBLSummary(blNumber: string): Promise<BLSummary | undefined>;
  createBLSummary(bl: InsertBLSummary): Promise<BLSummary>;
  updateBLSummary(blNumber: string, bl: Partial<BLSummary>): Promise<BLSummary | undefined>;
  acknowledgeChanges(blNumber: string, userGroup: 'carrier' | 'medlog'): Promise<BLSummary | undefined>;
  
  // BL Detail methods
  getBLDetail(blNumber: string): Promise<BLDetail | undefined>;
  createBLDetail(bl: InsertBLDetail): Promise<BLDetail>;
  updateBLDetail(blNumber: string, bl: Partial<BLDetail>): Promise<BLDetail | undefined>;
  
  // Container methods
  getAllContainers(): Promise<Container[]>;
  getContainersByBL(blNumber: string): Promise<Container[]>;
  createContainer(container: InsertContainer): Promise<Container>;
  updateContainer(id: number, container: Partial<Container>): Promise<Container | undefined>;
  updateContainerNote(id: number, group: 'carrier' | 'medlog', note: string): Promise<Container | undefined>;
  updateContainerHazardous(id: number, hazardous: boolean): Promise<Container | undefined>;
  getContainer(id: number): Promise<Container | undefined>;
  deleteContainer(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // BL Summary methods
  async getAllBLSummaries(): Promise<BLSummary[]> {
    return await db.select().from(blSummaries);
  }

  async getBLSummary(blNumber: string): Promise<BLSummary | undefined> {
    const [summary] = await db.select().from(blSummaries).where(eq(blSummaries.blNumber, blNumber));
    return summary || undefined;
  }

  async createBLSummary(bl: InsertBLSummary): Promise<BLSummary> {
    const [newBL] = await db.insert(blSummaries).values(bl).returning();
    return newBL;
  }

  async updateBLSummary(blNumber: string, updates: Partial<BLSummary>): Promise<BLSummary | undefined> {
    const [updated] = await db
      .update(blSummaries)
      .set(updates)
      .where(eq(blSummaries.blNumber, blNumber))
      .returning();
    return updated || undefined;
  }

  async acknowledgeChanges(blNumber: string, userGroup: 'carrier' | 'medlog'): Promise<BLSummary | undefined> {
    const resetField = userGroup === 'carrier' ? 'unseenChangesCarrier' : 'unseenChangesMedlog';
    const [updated] = await db
      .update(blSummaries)
      .set({
        hasChanges: false,
        lastChangedBy: null,
        lastChangedAt: null,
        changedFields: [],
        [resetField]: 0
      })
      .where(eq(blSummaries.blNumber, blNumber))
      .returning();
    return updated || undefined;
  }

  // BL Detail methods
  async getBLDetail(blNumber: string): Promise<BLDetail | undefined> {
    const [detail] = await db.select().from(blDetails).where(eq(blDetails.blNumber, blNumber));
    return detail || undefined;
  }

  async createBLDetail(bl: InsertBLDetail): Promise<BLDetail> {
    const [newBLDetail] = await db.insert(blDetails).values(bl).returning();
    return newBLDetail;
  }

  async updateBLDetail(blNumber: string, updates: Partial<BLDetail>): Promise<BLDetail | undefined> {
    const [updated] = await db
      .update(blDetails)
      .set(updates)
      .where(eq(blDetails.blNumber, blNumber))
      .returning();
    return updated || undefined;
  }

  // Container methods
  async getAllContainers(): Promise<Container[]> {
    return await db.select().from(containers);
  }

  async getContainersByBL(blNumber: string): Promise<Container[]> {
    return await db.select().from(containers).where(eq(containers.blNumber, blNumber));
  }

  async createContainer(container: InsertContainer): Promise<Container> {
    const [newContainer] = await db.insert(containers).values(container).returning();
    return newContainer;
  }

  async updateContainer(id: number, updates: Partial<Container>): Promise<Container | undefined> {
    const [updated] = await db
      .update(containers)
      .set(updates)
      .where(eq(containers.id, id))
      .returning();
    return updated || undefined;
  }

  async updateContainerNote(id: number, group: 'carrier' | 'medlog', note: string): Promise<Container | undefined> {
    const updateData = group === 'carrier' 
      ? { carrierNote: note }
      : { medlogNote: note };
      
    const [updated] = await db
      .update(containers)
      .set(updateData)
      .where(eq(containers.id, id))
      .returning();
    return updated || undefined;
  }

  async updateContainerHazardous(id: number, hazardous: boolean): Promise<Container | undefined> {
    const [updatedContainer] = await db
      .update(containers)
      .set({ dangerousCargo: hazardous })
      .where(eq(containers.id, id))
      .returning();
    
    return updatedContainer || undefined;
  }

  async getContainer(id: number): Promise<Container | undefined> {
    const [container] = await db.select().from(containers).where(eq(containers.id, id));
    return container || undefined;
  }

  async deleteContainer(id: number): Promise<boolean> {
    const result = await db.delete(containers).where(eq(containers.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();