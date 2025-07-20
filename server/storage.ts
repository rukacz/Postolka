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
  
  // BL Summary methods
  getAllBLSummaries(): Promise<BLSummary[]>;
  getBLSummary(blNumber: string): Promise<BLSummary | undefined>;
  createBLSummary(bl: InsertBLSummary): Promise<BLSummary>;
  updateBLSummary(blNumber: string, bl: Partial<BLSummary>): Promise<BLSummary | undefined>;
  
  // BL Detail methods
  getBLDetail(blNumber: string): Promise<BLDetail | undefined>;
  createBLDetail(bl: InsertBLDetail): Promise<BLDetail>;
  updateBLDetail(blNumber: string, bl: Partial<BLDetail>): Promise<BLDetail | undefined>;
  
  // Container methods
  getContainersByBL(blNumber: string): Promise<Container[]>;
  createContainer(container: InsertContainer): Promise<Container>;
  updateContainer(id: number, container: Partial<Container>): Promise<Container | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private blSummaries: Map<string, BLSummary>;
  private blDetails: Map<string, BLDetail>;
  private containers: Map<number, Container>;
  private currentUserId: number;
  private currentContainerId: number;

  constructor() {
    this.users = new Map();
    this.blSummaries = new Map();
    this.blDetails = new Map();
    this.containers = new Map();
    this.currentUserId = 1;
    this.currentContainerId = 1;
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    // Sample BL Summaries
    const sampleBLSummaries = [
      {
        blNumber: "MEDU123456",
        date: "2025-01-22", 
        client: "ŠKODA AUTO",
        consignee: "ALICE FREIGHT",
        destination: "Hamburg",
        containerCount: 2,
        type: "Import" as const,
        carrier: "Cargo Partner",
        status: "In Progress" as const,
        priority: "low" as const,
        weight: "48,000 kg"
      },
      {
        blNumber: "MSCU789012",
        date: "2025-01-23",
        client: "TESCO CZECH", 
        consignee: "TESCO STORES",
        destination: "Bremerhaven",
        containerCount: 1,
        type: "Import" as const,
        carrier: "Czech Rail",
        status: "Attention Required" as const,
        priority: "medium" as const,
        weight: "25,400 kg"
      },
      {
        blNumber: "TCLU345678",
        date: "2025-01-25",
        client: "IKEA CZ",
        consignee: "IKEA STORES", 
        destination: "Koper",
        containerCount: 3,
        type: "Export" as const,
        carrier: null,
        status: "Draft" as const,
        priority: "high" as const,
        weight: "73,950 kg"
      },
      {
        blNumber: "NTBG456789",
        date: "2025-01-20",
        client: "NTB GLOBAL",
        consignee: "NTB SOLUTIONS",
        destination: "Rotterdam", 
        containerCount: 2,
        type: "Import" as const,
        carrier: "MSC",
        status: "Delivered" as const,
        priority: "low" as const,
        weight: "49,400 kg"
      },
      {
        blNumber: "AUDI567890",
        date: "2025-01-24",
        client: "AUDI AG",
        consignee: "AUDI PARTS",
        destination: "Antwerp",
        containerCount: 1,
        type: "Export" as const, 
        carrier: "Hapag-Lloyd",
        status: "Confirmed" as const,
        priority: "medium" as const,
        weight: "22,300 kg"
      }
    ];

    for (const bl of sampleBLSummaries) {
      await this.createBLSummary(bl);
    }

    // Sample BL Details
    const sampleBLDetail = {
      blNumber: "MEDU123456",
      customerRef: "SS001546", 
      jobType: "Import" as const,
      status: "In Progress",
      customerName: "ŠKODA AUTO",
      contactName: "MARTIN NOVAK",
      contactPhone: "420 326 811 111",
      consigneeName: "ALICE FREIGHT",
      vesselName: "MSC MAYA/0142E",
      shippingLine: "MSC",
      eta: "22/01/2025",
      availability: "23/01/2025 08:00",
      storageStart: "25/01/2025",
      fromLocation: "Port of Hamburg",
      fromAddress: "Waltershof Terminal, Hamburg 21129",
      fromZone: "Zone A",
      toLocation: "ŠKODA AUTO Mladá Boleslav",
      toAddress: "Václava Klementa 869, 293 60 Mladá Boleslav",
      toZone: "Zone 2",
      hoursOfOperation: "07:00 - 15:00"
    };

    await this.createBLDetail(sampleBLDetail);

    // Sample Containers
    const sampleContainers = [
      {
        blNumber: "MEDU123456",
        jobNumber: "MEDU123456-1",
        containerNumber: "COSU1044551",
        size: "20",
        containerType: "DV",
        weight: 24000,
        status: "In Progress",
        routeStep: "D" as const,
        sealNumber: "SEL123456",
        temperature: null,
        transporter: "Upline"
      },
      {
        blNumber: "MEDU123456", 
        jobNumber: "MEDU123456-2",
        containerNumber: "COSU9004547",
        size: "40",
        containerType: "HC", 
        weight: 24000,
        status: "In Progress",
        routeStep: "C" as const,
        sealNumber: "SEL789012",
        temperature: null,
        transporter: "Medlog MEL"
      }
    ];

    for (const container of sampleContainers) {
      await this.createContainer(container);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // BL Summary methods
  async getAllBLSummaries(): Promise<BLSummary[]> {
    return Array.from(this.blSummaries.values());
  }

  async getBLSummary(blNumber: string): Promise<BLSummary | undefined> {
    return this.blSummaries.get(blNumber);
  }

  async createBLSummary(bl: InsertBLSummary): Promise<BLSummary> {
    const id = this.blSummaries.size + 1;
    const blSummary: BLSummary = { 
      ...bl, 
      id, 
      hasChanges: false,
      carrier: bl.carrier ?? null
    };
    this.blSummaries.set(bl.blNumber, blSummary);
    return blSummary;
  }

  async updateBLSummary(blNumber: string, bl: Partial<BLSummary>): Promise<BLSummary | undefined> {
    const existing = this.blSummaries.get(blNumber);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...bl };
    this.blSummaries.set(blNumber, updated);
    return updated;
  }

  // BL Detail methods
  async getBLDetail(blNumber: string): Promise<BLDetail | undefined> {
    return this.blDetails.get(blNumber);
  }

  async createBLDetail(bl: InsertBLDetail): Promise<BLDetail> {
    const id = this.blDetails.size + 1;
    const blDetail: BLDetail = { ...bl, id };
    this.blDetails.set(bl.blNumber, blDetail);
    return blDetail;
  }

  async updateBLDetail(blNumber: string, bl: Partial<BLDetail>): Promise<BLDetail | undefined> {
    const existing = this.blDetails.get(blNumber);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...bl };
    this.blDetails.set(blNumber, updated);
    return updated;
  }

  // Container methods
  async getContainersByBL(blNumber: string): Promise<Container[]> {
    return Array.from(this.containers.values()).filter(
      container => container.blNumber === blNumber
    );
  }

  async createContainer(container: InsertContainer): Promise<Container> {
    const id = this.currentContainerId++;
    const newContainer: Container = { 
      ...container, 
      id, 
      sealNumber: container.sealNumber ?? null,
      temperature: container.temperature ?? null
    };
    this.containers.set(id, newContainer);
    return newContainer;
  }

  async updateContainer(id: number, container: Partial<Container>): Promise<Container | undefined> {
    const existing = this.containers.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...container };
    this.containers.set(id, updated);
    return updated;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
    const [summary] = await db
      .insert(blSummaries)
      .values(bl)
      .returning();
    return summary;
  }

  async updateBLSummary(blNumber: string, bl: Partial<BLSummary>): Promise<BLSummary | undefined> {
    const [summary] = await db
      .update(blSummaries)
      .set(bl)
      .where(eq(blSummaries.blNumber, blNumber))
      .returning();
    return summary || undefined;
  }

  // BL Detail methods
  async getBLDetail(blNumber: string): Promise<BLDetail | undefined> {
    const [detail] = await db.select().from(blDetails).where(eq(blDetails.blNumber, blNumber));
    return detail || undefined;
  }

  async createBLDetail(bl: InsertBLDetail): Promise<BLDetail> {
    const [detail] = await db
      .insert(blDetails)
      .values(bl)
      .returning();
    return detail;
  }

  async updateBLDetail(blNumber: string, bl: Partial<BLDetail>): Promise<BLDetail | undefined> {
    const [detail] = await db
      .update(blDetails)
      .set(bl)
      .where(eq(blDetails.blNumber, blNumber))
      .returning();
    return detail || undefined;
  }

  // Container methods
  async getContainersByBL(blNumber: string): Promise<Container[]> {
    return await db.select().from(containers).where(eq(containers.blNumber, blNumber));
  }

  async createContainer(container: InsertContainer): Promise<Container> {
    const [newContainer] = await db
      .insert(containers)
      .values(container)
      .returning();
    return newContainer;
  }

  async updateContainer(id: number, container: Partial<Container>): Promise<Container | undefined> {
    const [updated] = await db
      .update(containers)
      .set(container)
      .where(eq(containers.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
