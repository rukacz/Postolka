import { 
  company, type Company, type InsertCompany,
  role, type Role, type InsertRole,
  port, type Port, type InsertPort,
  city, type City, type InsertCity,
  user, type User, type InsertUser,
  bl, type BL, type InsertBL,
  container, type Container, type InsertContainer,
  containerInBl, type ContainerInBl, type InsertContainerInBl,
  chatMessages, type ChatMessage, type InsertChatMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, inArray } from "drizzle-orm";

export interface IStorage {
  // ============================================================================
  // COMPANY METHODS
  // ============================================================================
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByName(name: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<Company>): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  getCompaniesByType(type: string): Promise<Company[]>;
  
  // ============================================================================
  // ROLE METHODS
  // ============================================================================
  getRole(id: number): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  getAllRoles(): Promise<Role[]>;
  
  // ============================================================================
  // PORT METHODS
  // ============================================================================
  getPort(id: number): Promise<Port | undefined>;
  getPortByName(name: string): Promise<Port | undefined>;
  createPort(port: InsertPort): Promise<Port>;
  updatePort(id: number, port: Partial<Port>): Promise<Port | undefined>;
  getAllPorts(): Promise<Port[]>;
  
  // ============================================================================
  // CITY METHODS
  // ============================================================================
  getCity(id: number): Promise<City | undefined>;
  getCityByName(name: string): Promise<City | undefined>;
  createCity(city: InsertCity): Promise<City>;
  updateCity(id: number, city: Partial<City>): Promise<City | undefined>;
  getAllCities(): Promise<City[]>;
  
  // ============================================================================
  // USER METHODS
  // ============================================================================
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserWithRoleAndCompany(username: string): Promise<(User & { roleName: string; companyType: string }) | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByCompany(companyId: number): Promise<User[]>;
  getUsersByRole(roleId: number): Promise<User[]>;
  
  // ============================================================================
  // BL METHODS
  // ============================================================================
  getBL(id: number): Promise<BL | undefined>;
  getBLByNumber(blNumber: string): Promise<BL | undefined>;
  createBL(bl: InsertBL): Promise<BL>;
  updateBL(id: number, bl: Partial<BL>): Promise<BL | undefined>;
  getAllBLs(): Promise<BL[]>;
  getBLsByCarrier(carrierId: number): Promise<BL[]>;
  getBLsByClient(clientId: number): Promise<BL[]>;
  getBLsByDirection(direction: 'Import' | 'Export'): Promise<BL[]>;
  getBLsByStatus(medlogStatus: string, carrierStatus: string): Promise<BL[]>;
  
  // ============================================================================
  // CONTAINER METHODS
  // ============================================================================
  getContainer(id: string): Promise<Container | undefined>;
  getContainerByIlu(containerIlu: string): Promise<Container | undefined>;
  createContainer(container: InsertContainer): Promise<Container>;
  updateContainer(id: string, container: Partial<Container>): Promise<Container | undefined>;
  getAllContainers(): Promise<Container[]>;
  getContainersByBL(blNumber: string): Promise<Container[]>;
  getContainersByStatus(medlogStatus: string, carrierStatus: string): Promise<Container[]>;
  updateContainerNote(id: string, group: 'carrier' | 'medlog', note: string): Promise<Container | undefined>;
  updateContainerHazardous(id: string, hazardous: boolean): Promise<Container | undefined>;
  deleteContainer(id: string): Promise<boolean>;
  
  // ============================================================================
  // CONTAINER IN BL METHODS
  // ============================================================================
  getContainerInBL(id: number): Promise<ContainerInBl | undefined>;
  createContainerInBL(containerInBl: InsertContainerInBl): Promise<ContainerInBl>;
  deleteContainerInBL(id: number): Promise<boolean>;
  getContainersForBL(blId: number): Promise<ContainerInBl[]>;
  getBLsForContainer(containerId: string): Promise<ContainerInBl[]>;
  
  // ============================================================================
  // CHAT MESSAGE METHODS
  // ============================================================================
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesByBL(blId: number): Promise<ChatMessage[]>;
  getAllChatMessages(): Promise<ChatMessage[]>;
  
  // ============================================================================
  // COMPLEX QUERY METHODS
  // ============================================================================
  getBLWithContainers(blId: number): Promise<{ bl: BL; containers: Container[] } | undefined>;
  getBLWithDetails(blId: number): Promise<{ bl: BL; containers: Container[]; chatMessages: ChatMessage[] } | undefined>;
  searchBLs(query: string): Promise<BL[]>;
  getDashboardData(): Promise<{ totalBLs: number; totalContainers: number; recentBLs: BL[] }>;
  // BL Detail methods
  getBLDetail(blNumber: string): Promise<BLDetail | undefined>;
}

export class DatabaseStorage implements IStorage {
  // ============================================================================
  // COMPANY METHODS
  // ============================================================================
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(company).where(eq(company.id, id));
    return company || undefined;
  }

  async getCompanyByName(name: string): Promise<Company | undefined> {
    const [company] = await db.select().from(company).where(eq(company.name, name));
    return company || undefined;
  }

  async createCompany(companyData: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(company).values(companyData).returning();
    return newCompany;
  }

  async updateCompany(id: number, companyData: Partial<Company>): Promise<Company | undefined> {
    const [updated] = await db
      .update(company)
      .set(companyData)
      .where(eq(company.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(company);
  }

  async getCompaniesByType(type: string): Promise<Company[]> {
    return await db.select().from(company).where(eq(company.type, type));
  }

  // ============================================================================
  // ROLE METHODS
  // ============================================================================
  async getRole(id: number): Promise<Role | undefined> {
    const [role] = await db.select().from(role).where(eq(role.id, id));
    return role || undefined;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const [role] = await db.select().from(role).where(eq(role.name, name));
    return role || undefined;
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(role).values(roleData).returning();
    return newRole;
  }

  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(role);
  }

  // ============================================================================
  // PORT METHODS
  // ============================================================================
  async getPort(id: number): Promise<Port | undefined> {
    const [port] = await db.select().from(port).where(eq(port.id, id));
    return port || undefined;
  }

  async getPortByName(name: string): Promise<Port | undefined> {
    const [port] = await db.select().from(port).where(eq(port.name, name));
    return port || undefined;
  }

  async createPort(portData: InsertPort): Promise<Port> {
    const [newPort] = await db.insert(port).values(portData).returning();
    return newPort;
  }

  async updatePort(id: number, portData: Partial<Port>): Promise<Port | undefined> {
    const [updated] = await db
      .update(port)
      .set(portData)
      .where(eq(port.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllPorts(): Promise<Port[]> {
    return await db.select().from(port);
  }

  // ============================================================================
  // CITY METHODS
  // ============================================================================
  async getCity(id: number): Promise<City | undefined> {
    const [city] = await db.select().from(city).where(eq(city.id, id));
    return city || undefined;
  }

  async getCityByName(name: string): Promise<City | undefined> {
    const [city] = await db.select().from(city).where(eq(city.name, name));
    return city || undefined;
  }

  async createCity(cityData: InsertCity): Promise<City> {
    const [newCity] = await db.insert(city).values(cityData).returning();
    return newCity;
  }

  async updateCity(id: number, cityData: Partial<City>): Promise<City | undefined> {
    const [updated] = await db
      .update(city)
      .set(cityData)
      .where(eq(city.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllCities(): Promise<City[]> {
    return await db.select().from(city);
  }

  // ============================================================================
  // USER METHODS
  // ============================================================================
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(user).where(eq(user.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(user).where(eq(user.username, username));
    return user || undefined;
  }

  async getUserWithRoleAndCompany(username: string): Promise<(User & { roleName: string; companyType: string }) | undefined> {
    const [result] = await db
      .select({
        user: user,
        roleName: role.name,
        companyType: company.type
      })
      .from(user)
      .leftJoin(role, eq(user.roleId, role.id))
      .leftJoin(company, eq(user.companyId, company.id))
      .where(eq(user.username, username));

    if (!result) return undefined;

    return {
      ...result.user,
      roleName: result.roleName || 'Unknown',
      companyType: result.companyType || 'Unknown'
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(user).where(eq(user.email, email));
    return user || undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [newUser] = await db.insert(user).values(userData).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(user)
      .set(userData)
      .where(eq(user.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(user);
  }

  async getUsersByCompany(companyId: number): Promise<User[]> {
    return await db.select().from(user).where(eq(user.companyId, companyId));
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    return await db.select().from(user).where(eq(user.roleId, roleId));
  }

  // ============================================================================
  // BL METHODS
  // ============================================================================
  async getBL(id: number): Promise<BL | undefined> {
    const [bl] = await db.select().from(bl).where(eq(bl.id, id));
    return bl || undefined;
  }

  async getBLByNumber(blNumber: string): Promise<BL | undefined> {
    const [bl] = await db.select().from(bl).where(eq(bl.blNumber, blNumber));
    return bl || undefined;
  }

  async createBL(blData: InsertBL): Promise<BL> {
    const [newBL] = await db.insert(bl).values(blData).returning();
    return newBL;
  }

  async updateBL(id: number, blData: Partial<BL>): Promise<BL | undefined> {
    const [updated] = await db
      .update(bl)
      .set(blData)
      .where(eq(bl.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllBLs(): Promise<BL[]> {
    return await db.select().from(bl).orderBy(desc(bl.createdAt));
  }

  async getBLsByCarrier(carrierId: number): Promise<BL[]> {
    return await db.select().from(bl).where(eq(bl.carrier, carrierId));
  }

  async getBLsByClient(clientId: number): Promise<BL[]> {
    return await db.select().from(bl).where(eq(bl.client, clientId));
  }

  async getBLsByDirection(direction: 'Import' | 'Export'): Promise<BL[]> {
    return await db.select().from(bl).where(eq(bl.direction, direction));
  }

  async getBLsByStatus(medlogStatus: string, carrierStatus: string): Promise<BL[]> {
    return await db.select().from(bl).where(
      and(eq(bl.medlogStatus, medlogStatus), eq(bl.carrierStatus, carrierStatus))
    );
  }

  // ============================================================================
  // CONTAINER METHODS
  // ============================================================================
  async getContainer(id: string): Promise<Container | undefined> {
    const [container] = await db.select().from(container).where(eq(container.id, id));
    return container || undefined;
  }

  async getContainerByIlu(containerIlu: string): Promise<Container | undefined> {
    const [container] = await db.select().from(container).where(eq(container.containerIlu, containerIlu));
    return container || undefined;
  }

  async createContainer(containerData: InsertContainer): Promise<Container> {
    const [newContainer] = await db.insert(container).values(containerData).returning();
    return newContainer;
  }

  async updateContainer(id: string, containerData: Partial<Container>): Promise<Container | undefined> {
    const [updated] = await db
      .update(container)
      .set(containerData)
      .where(eq(container.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllContainers(): Promise<Container[]> {
    return await db.select().from(container);
  }

  async getContainersByBL(blNumber: string): Promise<Container[]> {
    // First find BL by number to get its ID
    const blRecord = await this.getBLByNumber(blNumber);
    if (!blRecord) return [];
    
    // Get containers through junction table using BL ID
    const containerIds = await db
      .select({ containerId: containerInBl.containerId })
      .from(containerInBl)
      .where(eq(containerInBl.blId, blRecord.id));
    
    if (containerIds.length === 0) return [];
    
    // Get all containers for this BL using IN clause
    const containerIdList = containerIds.map(c => c.containerId);
    const containers = await db
      .select()
      .from(container)
      .where(inArray(container.id, containerIdList));
    
    return containers;
  }

  async getContainersByStatus(medlogStatus: string, carrierStatus: string): Promise<Container[]> {
    return await db.select().from(container).where(
      and(eq(container.medlogStatus, medlogStatus), eq(container.carrierStatus, carrierStatus))
    );
  }

  async updateContainerNote(id: string, group: 'carrier' | 'medlog', note: string): Promise<Container | undefined> {
    const updateData = group === 'carrier' 
      ? { carrierNote: note }
      : { medlogNote: note };
      
    const [updated] = await db
      .update(container)
      .set(updateData)
      .where(eq(container.id, id))
      .returning();
    return updated || undefined;
  }

  async updateContainerHazardous(id: string, hazardous: boolean): Promise<Container | undefined> {
    const [updatedContainer] = await db
      .update(container)
      .set({ hasDangerous: hazardous })
      .where(eq(container.id, id))
      .returning();
    
    return updatedContainer || undefined;
  }

  async deleteContainer(id: string): Promise<boolean> {
    const result = await db.delete(container).where(eq(container.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // ============================================================================
  // CONTAINER IN BL METHODS
  // ============================================================================
  async getContainerInBL(id: number): Promise<ContainerInBl | undefined> {
    const [containerInBl] = await db.select().from(containerInBl).where(eq(containerInBl.id, id));
    return containerInBl || undefined;
  }

  async createContainerInBL(containerInBlData: InsertContainerInBl): Promise<ContainerInBl> {
    const [newContainerInBl] = await db.insert(containerInBl).values(containerInBlData).returning();
    return newContainerInBl;
  }

  async deleteContainerInBL(id: number): Promise<boolean> {
    const result = await db.delete(containerInBl).where(eq(containerInBl.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getContainersForBL(blId: number): Promise<ContainerInBl[]> {
    return await db.select().from(containerInBl).where(eq(containerInBl.blId, blId));
  }

  async getBLsForContainer(containerId: string): Promise<ContainerInBl[]> {
    return await db.select().from(containerInBl).where(eq(containerInBl.containerId, containerId));
  }

  // ============================================================================
  // CHAT MESSAGE METHODS
  // ============================================================================
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const [message] = await db.select().from(chatMessages).where(eq(chatMessages.id, id));
    return message || undefined;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db.insert(chatMessages).values(message).returning();
    return newMessage;
  }

  async getChatMessagesByBL(blId: number): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.blId, blId)).orderBy(asc(chatMessages.timestamp));
  }

  async getAllChatMessages(): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).orderBy(desc(chatMessages.timestamp));
  }

  // ============================================================================
  // COMPLEX QUERY METHODS
  // ============================================================================
  async getBLWithContainers(blId: number): Promise<{ bl: BL; containers: Container[] } | undefined> {
    const blRecord = await this.getBL(blId);
    if (!blRecord) return undefined;

    const containers = await this.getContainersByBL(blRecord.blNumber);
    return { bl: blRecord, containers };
  }

  async getBLWithDetails(blId: number): Promise<{ bl: BL; containers: Container[]; chatMessages: ChatMessage[] } | undefined> {
    const blWithContainers = await this.getBLWithContainers(blId);
    if (!blWithContainers) return undefined;

    const chatMessages = await this.getChatMessagesByBL(blId);
    return { ...blWithContainers, chatMessages };
  }

  async searchBLs(query: string): Promise<BL[]> {
    // Simple search by BL number or vessel
    return await db.select().from(bl).where(
      or(
        eq(bl.blNumber, query),
        eq(bl.vessel, query)
      )
    );
  }

  async getDashboardData(): Promise<{ totalBLs: number; totalContainers: number; recentBLs: BL[] }> {
    const allBLs = await db.select().from(bl);
    const allContainers = await db.select().from(container);
    const recentBLs = await db.select().from(bl).orderBy(desc(bl.createdAt)).limit(5);

    return {
      totalBLs: allBLs.length,
      totalContainers: allContainers.length,
      recentBLs
    };
  }

  // BL Detail methods
  async getBLDetail(blNumber: string): Promise<BLDetail | undefined> {
    const [blRecord] = await db.select().from(bl).where(eq(bl.blNumber, blNumber));
    
    if (!blRecord) return undefined;
    
    // Get related data
    const [clientCompany] = await db.select().from(company).where(eq(company.id, blRecord.client));
    const [carrierCompany] = await db.select().from(company).where(eq(company.id, blRecord.carrier));
    const [picUser] = await db.select().from(user).where(eq(user.id, blRecord.pic));
    const [localPortData] = await db.select().from(port).where(eq(port.id, blRecord.localPort));
    const [locationData] = await db.select().from(city).where(eq(city.id, blRecord.location));
    
    // Get containers for this BL
    const containerInBls = await db.select().from(containerInBl).where(eq(containerInBl.blId, blRecord.id));
    const containerIds = containerInBls.map(cib => cib.containerId);
    const containers = await db.select().from(container).where(inArray(container.id, containerIds));
    
    // Construct BLDetail object with proper typing
    const blDetail: BLDetail = {
      ...blRecord,
      // Related data as additional properties
      clientCompany: clientCompany || undefined,
      carrierCompany: carrierCompany || undefined,
      picUser: picUser || undefined,
      localPort: localPortData || undefined,
      location: locationData || undefined,
      containers: containers || []
    } as BLDetail;
    
    return blDetail;
  }
}

export const storage = new DatabaseStorage();