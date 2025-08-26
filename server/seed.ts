import { db } from "./db";
import {
  company,
  role,
  port,
  city,
  user,
  bl,
  container,
  containerInBl,
  chatMessages,
} from "@shared/schema";

export async function seedDatabase() {
  try {
    // Clear existing data to ensure clean state
    console.log("Clearing existing data...");
    await db.delete(chatMessages);
    await db.delete(containerInBl);
    await db.delete(container);
    await db.delete(bl);
    await db.delete(user);
    await db.delete(city);
    await db.delete(port);
    await db.delete(role);
    await db.delete(company);

    console.log("Seeding database with new schema...");

    // ============================================================================
    // SEED ROLES
    // ============================================================================
    const sampleRoles = [
      { name: "Admin" },
      { name: "Medlog User" },
      { name: "MSC User" },
      { name: "Client User" },
    ];
    const insertedRoles = await db.insert(role).values(sampleRoles).returning();

    // ============================================================================
    // SEED COMPANIES
    // ============================================================================
    // Sample companies
    const sampleCompanies = [
      {
        id: 1,
        name: "ŠKODA AUTO",
        type: "Client",
        address: "Mladá Boleslav 293 01",
        city: "Mladá Boleslav",
        postalCode: "29301",
        country: "CZ",
        phone: "+420 326 811 111",
        email: "info@skoda-auto.cz",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 2,
        name: "TESCO",
        type: "Client",
        address: "Tesco House, Shire Park",
        city: "Welwyn Garden City",
        postalCode: "AL7 1GA",
        country: "GB",
        phone: "+44 1992 632 222",
        email: "info@tesco.com",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 3,
        name: "IKEA",
        type: "Client",
        address: "Älmhult 343 23",
        city: "Älmhult",
        postalCode: "34323",
        country: "SE",
        phone: "+46 476 19 7000",
        email: "info@ikea.com",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 4,
        name: "NTB",
        type: "Client",
        address: "Praha 110 00",
        city: "Praha",
        postalCode: "11000",
        country: "CZ",
        phone: "+420 224 123 456",
        email: "info@ntb.cz",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 5,
        name: "AUDI",
        type: "Client",
        address: "Ingolstadt 85045",
        city: "Ingolstadt",
        postalCode: "85045",
        country: "DE",
        phone: "+49 841 89 0",
        email: "info@audi.de",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 6,
        name: "MSC CZ",
        type: "MSC",
        address: "Praha 120 00",
        city: "Praha",
        postalCode: "12000",
        country: "CZ",
        phone: "+420 224 123 789",
        email: "info@msc.cz",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 7,
        name: "MSC SK",
        type: "MSC",
        address: "Bratislava 811 01",
        city: "Bratislava",
        postalCode: "81101",
        country: "SK",
        phone: "+421 2 123 456",
        email: "info@msc.sk",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 8,
        name: "ONE",
        type: "Carrier",
        address: "Tokyo 100-0001",
        city: "Tokyo",
        postalCode: "1000001",
        country: "JP",
        phone: "+81 3 1234 5678",
        email: "info@one-line.com",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 9,
        name: "Hapag-Lloyd",
        type: "Carrier",
        address: "Hamburg 20457",
        city: "Hamburg",
        postalCode: "20457",
        country: "DE",
        phone: "+49 40 3001 0",
        email: "info@hapag-lloyd.com",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 10,
        name: "Medlog",
        type: "Admin",
        address: "Praha 110 00",
        city: "Praha",
        postalCode: "11000",
        country: "CZ",
        phone: "+420 224 123 000",
        email: "info@medlog.cz",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
    ];
    const insertedCompanies = await db
      .insert(company)
      .values(sampleCompanies)
      .returning();

    // ============================================================================
    // SEED PORTS
    // ============================================================================
    // Sample ports
    const samplePorts = [
      {
        id: 1,
        name: "HAM CTA",
        city: "Hamburg",
        country: "DE",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 2,
        name: "BRV MSC",
        city: "Bratislava",
        country: "SK",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 3,
        name: "Koper",
        city: "Koper",
        country: "SI",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 4,
        name: "Rotterdam",
        city: "Rotterdam",
        country: "NL",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 5,
        name: "Antwerpen",
        city: "Antwerpen",
        country: "BE",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
    ];
    const insertedPorts = await db.insert(port).values(samplePorts).returning();

    // ============================================================================
    // SEED CITIES
    // ============================================================================
    // Sample cities
    const sampleCities = [
      {
        id: 1,
        name: "Mladá Boleslav Terminal",
        country: "CZ",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 2,
        name: "Gan",
        country: "SK",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 3,
        name: "Koper Terminal",
        country: "SI",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 4,
        name: "Praha Distribution",
        country: "CZ",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 5,
        name: "Ingolstadt",
        country: "DE",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
    ];
    const insertedCities = await db
      .insert(city)
      .values(sampleCities)
      .returning();

    // ============================================================================
    // SEED USERS
    // ============================================================================
    // Sample users - use the actual inserted role IDs
    const sampleUsers = [
      {
        id: 1,
        username: "medlog_admin",
        password: "password123",
        name: "Medlog Admin",
        email: "admin@medlog.cz",
        roleId: insertedRoles[0].id, // Admin
        companyId: 10, // Medlog
        defaultCarrier: null,
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 2,
        username: "msc_cz_user",
        password: "password123",
        name: "MSC CZ Import User",
        email: "user@msc.cz",
        roleId: insertedRoles[1].id, // Medlog User
        companyId: 6, // MSC CZ
        defaultCarrier: "MSC CZ",
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 3,
        username: "jan_novak",
        password: "password123",
        name: "Jan Novák",
        email: "jan.novak@skoda-auto.cz",
        roleId: insertedRoles[3].id, // Client User
        companyId: 1, // ŠKODA AUTO
        defaultCarrier: null,
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 4,
        username: "eva_svobodova",
        password: "password123",
        name: "Eva Svobodová",
        email: "eva.svobodova@tesco.com",
        roleId: insertedRoles[3].id, // Client User
        companyId: 2, // TESCO
        defaultCarrier: null,
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 5,
        username: "tomas_dvorak",
        password: "password123",
        name: "Tomáš Dvořák",
        email: "tomas.dvorak@ikea.com",
        roleId: insertedRoles[3].id, // Client User
        companyId: 3, // IKEA
        defaultCarrier: null,
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 6,
        username: "marie_cerna",
        password: "password123",
        name: "Marie Černá",
        email: "marie.cerna@ntb.cz",
        roleId: insertedRoles[3].id, // Client User
        companyId: 4, // NTB
        defaultCarrier: null,
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 7,
        username: "petr_prochazka",
        password: "password123",
        name: "Petr Procházka",
        email: "petr.prochazka@audi.de",
        roleId: insertedRoles[3].id, // Client User
        companyId: 5, // AUDI
        defaultCarrier: null,
        isActive: true,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
    ];
    const insertedUsers = await db.insert(user).values(sampleUsers).returning();

    // ============================================================================
    // SEED BL RECORDS
    // ============================================================================
    // Sample BLs
    const sampleBLs = [
      {
        id: 1,
        blNumber: "MEDU123456",
        direction: "Import",
        client: 1, // ŠKODA AUTO
        carrier: 6, // MSC CZ
        pic: 3, // Jan Novák
        eta: new Date("2025-01-25"),
        localPort: 1, // HAM CTA
        location: 1, // Mladá Boleslav Terminal
        medlogStatus: "Approved",
        carrierStatus: "MIPS Send",
        hasDangerous: false,
        hasDt: false,
        medlogBulb: "Green",
        carrierBulb: "Green",
        vessel: "MSC OSCAR",
        voyage: "123A",
        blNumberChange: true,
        picChange: true,
        clientChange: false,
        containerChange: true,
        directionChange: false,
        etaChange: true,
        hasDangerousChange: false,
        hasDtChange: false,
        localPortChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        locationChange: true,
        medlogBulbChange: false,
        carrierBulbChange: false,
        vesselChange: false,
        voyageChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 2,
        blNumber: "MSCU789012",
        direction: "Import",
        client: 2, // TESCO
        carrier: 7, // MSC SK
        pic: 4, // Eva Svobodová
        eta: new Date("2025-01-26"),
        localPort: 2, // BRV MSC
        location: 2, // Gan
        medlogStatus: "New",
        carrierStatus: "Pre-Order",
        hasDangerous: false,
        hasDt: false,
        medlogBulb: "Blue",
        carrierBulb: "Blue",
        vessel: "MSC GÜLSÜN",
        voyage: "456B",
        blNumberChange: false,
        picChange: false,
        clientChange: false,
        containerChange: false,
        directionChange: false,
        etaChange: false,
        hasDangerousChange: false,
        hasDtChange: false,
        localPortChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        locationChange: false,
        medlogBulbChange: false,
        carrierBulbChange: false,
        vesselChange: false,
        voyageChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 3,
        blNumber: "TCLU345678",
        direction: "Export",
        client: 3, // IKEA
        carrier: 8, // ONE
        pic: 5, // Tomáš Dvořák
        eta: new Date("2025-01-27"),
        localPort: 3, // Koper
        location: 3, // Koper Terminal
        medlogStatus: "Rejected",
        carrierStatus: "Do Not Release",
        hasDangerous: false,
        hasDt: false,
        medlogBulb: "Red",
        carrierBulb: "Red",
        vessel: "ONE HAMBURG",
        voyage: "789C",
        blNumberChange: false,
        picChange: false,
        clientChange: false,
        containerChange: false,
        directionChange: false,
        etaChange: false,
        hasDangerousChange: false,
        hasDtChange: false,
        localPortChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        locationChange: false,
        medlogBulbChange: false,
        carrierBulbChange: false,
        vesselChange: false,
        voyageChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 4,
        blNumber: "NTBG456789",
        direction: "Import",
        client: 4, // NTB
        carrier: 6, // MSC CZ
        pic: 6, // Marie Černá
        eta: new Date("2025-01-22"),
        localPort: 4, // Rotterdam
        location: 4, // Praha Distribution
        medlogStatus: "Approved",
        carrierStatus: "MIPS Send",
        hasDangerous: false,
        hasDt: false,
        medlogBulb: "Green",
        carrierBulb: "Green",
        vessel: "MSC OSCAR",
        voyage: "123A",
        blNumberChange: false,
        picChange: false,
        clientChange: false,
        containerChange: false,
        directionChange: false,
        etaChange: false,
        hasDangerousChange: false,
        hasDtChange: false,
        localPortChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        locationChange: false,
        medlogBulbChange: false,
        carrierBulbChange: false,
        vesselChange: false,
        voyageChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        id: 5,
        blNumber: "AUDI567890",
        direction: "Export",
        client: 5, // AUDI
        carrier: 9, // Hapag-Lloyd
        pic: 7, // Petr Procházka
        eta: new Date("2025-01-28"),
        localPort: 5, // Antwerpen
        location: 5, // Ingolstadt
        medlogStatus: "Changed",
        carrierStatus: "Cancelled",
        hasDangerous: false,
        hasDt: false,
        medlogBulb: "Yellow",
        carrierBulb: "Red",
        vessel: "HAPAG LLOYD",
        voyage: "012D",
        blNumberChange: false,
        picChange: false,
        clientChange: false,
        containerChange: false,
        directionChange: false,
        etaChange: false,
        hasDangerousChange: false,
        hasDtChange: false,
        localPortChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        locationChange: false,
        medlogBulbChange: false,
        carrierBulbChange: false,
        vesselChange: false,
        voyageChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
    ];
    const insertedBLs = await db.insert(bl).values(sampleBLs).returning();

    // ============================================================================
    // SEED CONTAINERS
    // ============================================================================
    // Sample containers
    const sampleContainers = [
      {
        containerIlu: "MSKU1234567",
        size: "40HC",
        weight: null,
        customs: null,
        hasDangerous: false,
        unloadDate: new Date("2025-01-25"),
        isDirectTruck: false,
        medlogStatus: "Approved",
        carrierStatus: "MIPS Send",
        medlogNote: null,
        carrierNote: null,
        isSentInMips: true,
        location: "Mladá Boleslav",
        zip: "29301",
        train: "MEH2531R5",
        trainDate: new Date("2025-01-25"),
        deliveryNotPossible: false,
        isActive: true,
        // Change tracking fields
        containerIluChange: false,
        sizeChange: false,

        weightChange: false,
        customsChange: true,
        hasDangerousChange: false,
        unloadDateChange: false,
        isDirectTruckChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        medlogNoteChange: false,
        carrierNoteChange: false,
        isSentInMipsChange: false,
        locationChange: false,
        zipChange: false,
        trainChange: true,
        trainDateChange: true,
        deliveryNotPossibleChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        containerIlu: "MSKU2345678",
        size: "20DV",
        weight: null,
        customs: null,
        hasDangerous: false,
        unloadDate: new Date("2025-01-25"),
        isDirectTruck: false,
        medlogStatus: "Approved",
        carrierStatus: "MIPS Send",
        medlogNote: null,
        carrierNote: null,
        isSentInMips: true,
        location: "Mladá Boleslav Terminal",
        zip: "29301",
        train: "MEH2531R1",
        trainDate: new Date("2025-01-25"),
        deliveryNotPossible: false,
        isActive: true,
        // Change tracking fields
        containerIluChange: false,
        sizeChange: false,

        weightChange: false,
        customsChange: false,
        hasDangerousChange: false,
        unloadDateChange: false,
        isDirectTruckChange: false,
        medlogStatusChange: true,
        carrierStatusChange: false,
        medlogNoteChange: false,
        carrierNoteChange: false,
        isSentInMipsChange: false,
        locationChange: true,
        zipChange: false,
        trainChange: false,
        trainDateChange: false,
        deliveryNotPossibleChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        containerIlu: "MSKU3456789",
        size: "40DV",
        weight: null,
        customs: null,
        hasDangerous: false,
        unloadDate: new Date("2025-01-26"),
        isDirectTruck: false,
        medlogStatus: "New",
        carrierStatus: "Pre-Order",
        medlogNote: null,
        carrierNote: null,
        isSentInMips: false,
        location: "Gan",
        zip: "81101",
        train: null,
        trainDate: null,
        deliveryNotPossible: true,
        isActive: true,
        // Change tracking fields
        containerIluChange: false,
        sizeChange: false,

        weightChange: false,
        customsChange: false,
        hasDangerousChange: true,
        unloadDateChange: false,
        isDirectTruckChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        medlogNoteChange: false,
        carrierNoteChange: true,
        isSentInMipsChange: false,
        locationChange: false,
        zipChange: false,
        trainChange: false,
        trainDateChange: false,
        deliveryNotPossibleChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        containerIlu: "TCLU4567890",
        size: "40HC",
        weight: null,
        customs: null,
        hasDangerous: false,
        unloadDate: new Date("2025-01-27"),
        isDirectTruck: false,
        medlogStatus: "Rejected",
        carrierStatus: "Do Not Release",
        medlogNote: null,
        carrierNote: null,
        isSentInMips: false,
        location: "Koper Terminal",
        zip: "6000",
        train: null,
        trainDate: null,
        deliveryNotPossible: false,
        isActive: true,
        // Change tracking fields
        containerIluChange: false,
        sizeChange: false,

        weightChange: false,
        customsChange: false,
        hasDangerousChange: false,
        unloadDateChange: false,
        isDirectTruckChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        medlogNoteChange: false,
        carrierNoteChange: false,
        isSentInMipsChange: false,
        locationChange: false,
        zipChange: false,
        trainChange: false,
        trainDateChange: false,
        deliveryNotPossibleChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        containerIlu: "TCLU5678901",
        size: "20DV",
        weight: null,
        customs: null,
        hasDangerous: false,
        unloadDate: new Date("2025-01-27"),
        isDirectTruck: false,
        medlogStatus: "Rejected",
        carrierStatus: "Do Not Release",
        medlogNote: null,
        carrierNote: null,
        isSentInMips: false,
        location: "Koper Terminal",
        zip: "6000",
        train: null,
        trainDate: null,
        deliveryNotPossible: false,
        isActive: true,
        // Change tracking fields
        containerIluChange: false,
        sizeChange: false,

        weightChange: false,
        customsChange: false,
        hasDangerousChange: false,
        unloadDateChange: false,
        isDirectTruckChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        medlogNoteChange: false,
        carrierNoteChange: false,
        isSentInMipsChange: false,
        locationChange: false,
        zipChange: false,
        trainChange: false,
        trainDateChange: false,
        deliveryNotPossibleChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        containerIlu: "TCLU6789012",
        size: "40HC",
        weight: null,
        customs: null,
        hasDangerous: false,
        unloadDate: new Date("2025-01-27"),
        isDirectTruck: false,
        medlogStatus: "Rejected",
        carrierStatus: "Do Not Release",
        medlogNote: null,
        carrierNote: null,
        isSentInMips: false,
        location: "Koper Terminal",
        zip: "6000",
        train: null,
        trainDate: null,
        deliveryNotPossible: false,
        isActive: true,
        // Change tracking fields
        containerIluChange: false,
        sizeChange: false,

        weightChange: false,
        customsChange: false,
        hasDangerousChange: false,
        unloadDateChange: false,
        isDirectTruckChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        medlogNoteChange: false,
        carrierNoteChange: false,
        isSentInMipsChange: false,
        locationChange: false,
        zipChange: false,
        trainChange: false,
        trainDateChange: false,
        deliveryNotPossibleChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        containerIlu: "NTBU7890123",
        size: "40HC",
        weight: null,
        customs: null,
        hasDangerous: false,
        unloadDate: new Date("2025-01-22"),
        isDirectTruck: false,
        medlogStatus: "Approved",
        carrierStatus: "MIPS Send",
        medlogNote: null,
        carrierNote: null,
        isSentInMips: true,
        location: "Praha Distribution",
        zip: "11000",
        train: "Train 456",
        trainDate: new Date("2025-01-22"),
        deliveryNotPossible: false,
        isActive: true,
        // Change tracking fields
        containerIluChange: false,
        sizeChange: false,

        weightChange: false,
        customsChange: false,
        hasDangerousChange: false,
        unloadDateChange: false,
        isDirectTruckChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        medlogNoteChange: false,
        carrierNoteChange: false,
        isSentInMipsChange: false,
        locationChange: false,
        zipChange: false,
        trainChange: true,
        trainDateChange: false,
        deliveryNotPossibleChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        containerIlu: "NTBU8901234",
        size: "20FT",
        weight: null,
        customs: null,
        hasDangerous: false,
        unloadDate: new Date("2025-01-22"),
        isDirectTruck: false,
        medlogStatus: "Approved",
        carrierStatus: "MIPS Send",
        medlogNote: null,
        carrierNote: null,
        isSentInMips: true,
        location: "Praha Distribution",
        zip: "11000",
        train: "Train 456",
        trainDate: new Date("2025-01-22"),
        deliveryNotPossible: false,
        isActive: true,
        // Change tracking fields
        containerIluChange: false,
        sizeChange: false,

        weightChange: false,
        customsChange: false,
        hasDangerousChange: false,
        unloadDateChange: false,
        isDirectTruckChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        medlogNoteChange: false,
        carrierNoteChange: false,
        isSentInMipsChange: false,
        locationChange: false,
        zipChange: false,
        trainChange: true,
        trainDateChange: false,
        deliveryNotPossibleChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
      {
        containerIlu: "AUDU9012345",
        size: "45HC",
        weight: null,
        customs: null,
        hasDangerous: false,
        unloadDate: new Date("2025-01-28"),
        isDirectTruck: false,
        medlogStatus: "Changed",
        carrierStatus: "Cancelled",
        medlogNote: null,
        carrierNote: null,
        isSentInMips: false,
        location: "Ingolstadt",
        zip: "85045",
        train: null,
        trainDate: null,
        deliveryNotPossible: false,
        isActive: true,
        // Change tracking fields
        containerIluChange: false,
        sizeChange: false,

        weightChange: false,
        customsChange: false,
        hasDangerousChange: false,
        unloadDateChange: false,
        isDirectTruckChange: false,
        medlogStatusChange: false,
        carrierStatusChange: false,
        medlogNoteChange: false,
        carrierNoteChange: false,
        isSentInMipsChange: false,
        locationChange: false,
        zipChange: false,
        trainChange: false,
        trainDateChange: false,
        deliveryNotPossibleChange: false,
        createdAt: new Date(),
        lastModifiedAt: new Date(),
      },
    ];
    const insertedContainers = await db
      .insert(container)
      .values(sampleContainers)
      .returning();

    // ============================================================================
    // SEED CONTAINER IN BL RELATIONSHIPS
    // ============================================================================
    // Sample containerInBl relationships - using actual inserted container IDs
    const sampleContainerInBls = [
      { blId: 1, containerId: insertedContainers[0].id }, // MEDU123456 - 2 containers (MSKU1234567)
      { blId: 1, containerId: insertedContainers[1].id }, //                          (MSKU2345678)
      { blId: 2, containerId: insertedContainers[2].id }, // MSCU789012 - 1 container (MSKU3456789)
      { blId: 3, containerId: insertedContainers[3].id }, // TCLU345678 - 3 containers (TCLU4567890)
      { blId: 3, containerId: insertedContainers[4].id }, //                          (TCLU5678901)
      { blId: 3, containerId: insertedContainers[5].id }, //                          (TCLU6789012)
      { blId: 4, containerId: insertedContainers[6].id }, // NTBG456789 - 2 containers (NTBU7890123)
      { blId: 4, containerId: insertedContainers[7].id }, //                          (NTBU8901234)
      { blId: 5, containerId: insertedContainers[8].id }, // AUDI567890 - 1 container (AUDU9012345)
    ];
    await db.insert(containerInBl).values(sampleContainerInBls);

    // ============================================================================
    // SEED CHAT MESSAGES
    // ============================================================================
    // Sample chat messages
    const sampleChatMessages = [
      {
        id: 1,
        blId: 1,
        user: 3, // Jan Novák
        message: "Container MSKU1234567 arrived at terminal",
        timestamp: new Date("2025-01-25T10:00:00Z"),
        isActive: true,
        createdAt: new Date("2025-01-25T10:00:00Z"),
        lastModifiedAt: new Date("2025-01-25T10:00:00Z"),
      },
      {
        id: 2,
        blId: 2,
        user: 4, // Eva Svobodová
        message: "Pre-order confirmed for MSCU789012",
        timestamp: new Date("2025-01-26T09:00:00Z"),
        isActive: true,
        createdAt: new Date("2025-01-26T09:00:00Z"),
        lastModifiedAt: new Date("2025-01-26T09:00:00Z"),
      },
    ];
    await db.insert(chatMessages).values(sampleChatMessages);

    console.log("Database seeded successfully with new schema!");
    console.log(
      `Created: ${insertedRoles.length} roles, ${insertedCompanies.length} companies, ${insertedPorts.length} ports, ${insertedCities.length} cities, ${insertedUsers.length} users, ${insertedBLs.length} BLs, ${insertedContainers.length} containers`,
    );
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
