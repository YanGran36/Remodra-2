import { Express, Request, Response } from "express";
import { db } from "../../db";
import { timeclockEntries, timeclockEntryInsertSchema } from "../../shared/schema";
import * as sqliteSchema from "../../shared/schema-sqlite";

// Use SQLite schemas in development
const isLocalDev = process.env.NODE_ENV === 'development' && process.env.DATABASE_URL?.includes('sqlite');

// Conditionally use the appropriate schema and tables
const timeclockEntriesTable = isLocalDev ? sqliteSchema.timeclock_entries : timeclockEntries;
import { eq, desc, and, sql, asc, inArray } from "drizzle-orm";
import { z } from "zod";
import { differenceInHours, differenceInMinutes } from "date-fns";

// Helper to get the correct column object based on environment
function col(name: string) {
  if (isLocalDev) {
    switch (name) {
      case 'contractorId': return sqliteSchema.timeclock_entries.contractor_id;
      case 'employeeName': return sqliteSchema.timeclock_entries.employee_name;
      case 'jobType': return sqliteSchema.timeclock_entries.job_type;
      case 'clockInEntryId': return sqliteSchema.timeclock_entries.clock_in_entry_id;
      case 'hoursWorked': return sqliteSchema.timeclock_entries.hours_worked;
      case 'createdAt': return sqliteSchema.timeclock_entries.created_at;
      case 'timestamp': return sqliteSchema.timeclock_entries.timestamp;
      case 'date': return sqliteSchema.timeclock_entries.date;
      case 'location': return sqliteSchema.timeclock_entries.location;
      case 'notes': return sqliteSchema.timeclock_entries.notes;
      case 'type': return sqliteSchema.timeclock_entries.type;
      case 'viewerRole': return sqliteSchema.timeclock_entries.viewer_role;
      case 'id': return sqliteSchema.timeclock_entries.id;
      default: throw new Error('Unknown column: ' + name);
    }
  } else {
    switch (name) {
      case 'contractorId': return timeclockEntries.contractorId;
      case 'employeeName': return timeclockEntries.employeeName;
      case 'clockInEntryId': return timeclockEntries.clockInEntryId;
      case 'hoursWorked': return timeclockEntries.hoursWorked;
      case 'createdAt': return timeclockEntries.createdAt;
      case 'timestamp': return timeclockEntries.timestamp;
      case 'date': return timeclockEntries.date;
      case 'location': return timeclockEntries.location;
      case 'notes': return timeclockEntries.notes;
      case 'type': return timeclockEntries.type;
      case 'viewerRole': return timeclockEntries.viewerRole;
      case 'id': return timeclockEntries.id;
      default: throw new Error('Unknown column: ' + name);
    }
  }
}

// Helper to get the correct property from a row object
function rowField(entry: any, name: string) {
  if (isLocalDev) {
    switch (name) {
      case 'contractorId': return entry.contractor_id;
      case 'employeeName': return entry.employee_name;
      case 'jobType': return entry.job_type;
      case 'clockInEntryId': return entry.clock_in_entry_id;
      case 'hoursWorked': return entry.hours_worked;
      case 'createdAt': return entry.created_at;
      case 'timestamp': return entry.timestamp;
      case 'date': return entry.date;
      case 'location': return entry.location;
      case 'notes': return entry.notes;
      case 'type': return entry.type;
      case 'viewerRole': return entry.viewer_role;
      case 'id': return entry.id;
      default: throw new Error('Unknown row field: ' + name);
    }
  } else {
    switch (name) {
      case 'contractorId': return entry.contractorId;
      case 'employeeName': return entry.employeeName;
      case 'clockInEntryId': return entry.clockInEntryId;
      case 'hoursWorked': return entry.hoursWorked;
      case 'createdAt': return entry.createdAt;
      case 'timestamp': return entry.timestamp;
      case 'date': return entry.date;
      case 'location': return entry.location;
      case 'notes': return entry.notes;
      case 'type': return entry.type;
      case 'viewerRole': return entry.viewerRole;
      case 'id': return entry.id;
      default: throw new Error('Unknown row field: ' + name);
    }
  }
}

// Helper to set the correct property on a row object
function setRowField(entry: any, name: string, value: any) {
  if (isLocalDev) {
    switch (name) {
      case 'contractorId': entry.contractor_id = value; break;
      case 'employeeName': entry.employee_name = value; break;
      case 'jobType': entry.job_type = value; break;
      case 'clockInEntryId': entry.clock_in_entry_id = value; break;
      case 'hoursWorked': entry.hours_worked = value; break;
      case 'createdAt': entry.created_at = value; break;
      case 'timestamp': entry.timestamp = value; break;
      case 'date': entry.date = value; break;
      case 'location': entry.location = value; break;
      case 'notes': entry.notes = value; break;
      case 'type': entry.type = value; break;
      case 'viewerRole': entry.viewer_role = value; break;
      case 'id': entry.id = value; break;
      default: throw new Error('Unknown row field: ' + name);
    }
  } else {
    switch (name) {
      case 'contractorId': entry.contractorId = value; break;
      case 'employeeName': entry.employeeName = value; break;
      case 'clockInEntryId': entry.clockInEntryId = value; break;
      case 'hoursWorked': entry.hoursWorked = value; break;
      case 'createdAt': entry.createdAt = value; break;
      case 'timestamp': entry.timestamp = value; break;
      case 'date': entry.date = value; break;
      case 'location': entry.location = value; break;
      case 'notes': entry.notes = value; break;
      case 'type': entry.type = value; break;
      case 'viewerRole': entry.viewerRole = value; break;
      case 'id': entry.id = value; break;
      default: throw new Error('Unknown row field: ' + name);
    }
  }
}

export function registerTimeclockRoutes(app: Express) {
  // Register Clock In
  app.post("/api/timeclock/clock-in", async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user && req.user.id;
      console.log('DEBUG - req.user:', req.user);
      console.log('DEBUG - contractorId:', contractorId);
      if (!contractorId) {
        console.error('Missing contractorId for clock-in:', req.user);
        return res.status(400).json({ errors: [{ message: 'Missing contractorId (user not authenticated properly)' }] });
      }

      // Location is optional - use provided location or default
      const location = req.body.location || req.body.location || "Location not available";

      // Prepare data for SQLite (convert timestamp to Unix timestamp)
      let dataToInsert;
      if (isLocalDev) {
        // Map to snake_case for SQLite
        dataToInsert = {
          contractor_id: contractorId,
          employee_name: req.body.employeeName,
          job_type: req.body.jobType,
          type: "IN",
          timestamp: Date.now(),
          date: req.body.date || new Date().toISOString().split('T')[0],
          location: req.body.location,
          notes: req.body.notes,
          viewer_role: "all", // Workers always use "all" - access control is handled by contractor
          created_at: Date.now(),
        };
      } else {
        // Use camelCase for PostgreSQL
        dataToInsert = {
          ...req.body,
          contractorId,
          type: "IN", // Fixed type as clock in
          timestamp: Date.now(), // Use current Unix timestamp for SQLite
          date: req.body.date || new Date().toISOString().split('T')[0], // Ensure date is provided
          viewerRole: req.body.viewerRole || "all", // Default to "all" if not specified
          createdAt: Date.now(), // Add created_at field
        };
      }
      
      // Accept both camelCase and snake_case for employee name
      const employeeName = req.body.employeeName || req.body.employee_name;
      if (!employeeName || employeeName.length < 2) {
        return res.status(400).json({ errors: [{ message: "Employee name must be at least 2 characters" }] });
      }
      
      const date = req.body.date || req.body.date;
      if (!date) {
        return res.status(400).json({ errors: [{ message: "Date is required" }] });
      }

      // Insert into database
      const [entry] = await db
        .insert(timeclockEntriesTable)
        .values(dataToInsert)
        .returning();

      return res.status(201).json(entry);
    } catch (error) {
      console.error("Error registering clock in:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Register Clock Out
  app.post("/api/timeclock/clock-out", async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user.id;
      const { employeeName, date } = req.body;

      // Location is optional - use provided location or default
      const location = req.body.location || req.body.location || "Location not available";

      // Find the most recent clock in entry for this employee
      const [latestClockIn] = await db
        .select()
        .from(timeclockEntriesTable)
        .where(
          and(
            eq(col('contractorId'), contractorId),
            eq(col('employeeName'), employeeName),
            eq(col('type'), "IN"),
            // Look for clock-in entries without an associated clock-out
            sql`NOT EXISTS (
              SELECT 1 FROM timeclock_entries t2 
              WHERE t2.clock_in_entry_id = timeclock_entries.id
            )`
          )
        )
        .orderBy(desc(col('timestamp')))
        .limit(1);

      // Calculate hours worked if found a clock in entry
      let hoursWorked = null;
      let clockInEntryId = null;
      let clockInTimestamp = null;
      if (latestClockIn) {
        clockInTimestamp = rowField(latestClockIn, 'timestamp');
        const clockInTime = new Date(clockInTimestamp);
        const clockOutTime = new Date();
        // Calculate hours worked (with 2 decimal precision)
        const totalMinutes = differenceInMinutes(clockOutTime, clockInTime);
        hoursWorked = parseFloat((totalMinutes / 60).toFixed(2));
        clockInEntryId = rowField(latestClockIn, 'id');
      }

      // Prepare data for SQLite (convert timestamp to Unix timestamp)
      let dataToInsert;
      if (isLocalDev) {
        // Map to snake_case for SQLite
        dataToInsert = {
          contractor_id: contractorId,
          employee_name: req.body.employeeName,
          job_type: req.body.jobType,
          type: "OUT",
          clock_in_entry_id: clockInEntryId,
          hours_worked: hoursWorked ? hoursWorked.toString() : null,
          timestamp: Date.now(),
          date: req.body.date || new Date().toISOString().split('T')[0],
          location: req.body.location,
          notes: req.body.notes,
          viewer_role: "all", // Workers always use "all" - access control is handled by contractor
          created_at: Date.now(),
        };
      } else {
        // Use camelCase for PostgreSQL
        dataToInsert = {
          ...req.body,
          contractorId,
          type: "OUT", // Fixed type as clock out
          clockInEntryId, // Link to the corresponding clock in entry
          hoursWorked: hoursWorked ? hoursWorked.toString() : null, // Convert to string for validation
          timestamp: Date.now(), // Use current Unix timestamp for SQLite
          date: req.body.date || new Date().toISOString().split('T')[0], // Ensure date is provided
          viewerRole: req.body.viewerRole || "all", // Default to "all" if not specified
          createdAt: Date.now(), // Add created_at field
        };
      }

      // Manual validation - check the correct field names based on environment
      const employeeNameToValidate = isLocalDev ? dataToInsert.employee_name : dataToInsert.employeeName;
      const dateToValidate = isLocalDev ? dataToInsert.date : dataToInsert.date;
      const locationToValidate = isLocalDev ? dataToInsert.location : dataToInsert.location;
      
      if (!employeeNameToValidate || employeeNameToValidate.length < 2) {
        return res.status(400).json({ errors: [{ message: "Employee name must be at least 2 characters" }] });
      }
      if (!dateToValidate) {
        return res.status(400).json({ errors: [{ message: "Date is required" }] });
      }



      // Insert into database
      const [entry] = await db
        .insert(timeclockEntriesTable)
        .values(dataToInsert)
        .returning();

      return res.status(201).json(entry);
    } catch (error) {
      console.error("Error registering clock out:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Helper function to check if user can view a timeclock entry
  function canViewEntry(user: any, entry: any): boolean {
    const userRole = user.role || 'contractor';
    const viewerRole = rowField(entry, 'viewerRole') || 'all';
    const employeeName = rowField(entry, 'employeeName');
    
    // Owner can see everything
    if (userRole === 'owner') return true;
    
    // Manager can see entries marked as 'all', 'manager', or their own entries
    if (userRole === 'manager') {
      return viewerRole === 'all' || viewerRole === 'manager' || employeeName === user.first_name + ' ' + user.last_name;
    }
    
    // Regular contractors can see entries marked as 'all' or their own entries
    if (userRole === 'contractor') {
      return viewerRole === 'all' || employeeName === user.first_name + ' ' + user.last_name;
    }
    
    // Employees can only see their own entries or entries marked as 'all'
    return viewerRole === 'all' || employeeName === user.first_name + ' ' + user.last_name;
  }

  // Get recent entries (last 10) with access control
  app.get("/api/timeclock/recent", async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user.id;

      // Get last 20 entries to filter by access control
      const entries = await db
        .select()
        .from(timeclockEntriesTable)
        .where(eq(col('contractorId'), contractorId))
        .orderBy(desc(col('timestamp')))
        .limit(20);

      // Filter entries based on user permissions
      const filteredEntries = entries.filter(entry => canViewEntry(req.user, entry));

      // Return only the first 10 filtered entries
      const recentEntries = filteredEntries.slice(0, 10);

      return res.status(200).json(recentEntries);
    } catch (error) {
      console.error("Error getting recent entries:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all entries (paginated)
  app.get("/api/timeclock/entries", async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;

      // Get paginated entries
      const entries = await db
        .select()
        .from(timeclockEntriesTable)
        .where(eq(col('contractorId'), contractorId))
        .orderBy(desc(col('timestamp')))
        .limit(pageSize)
        .offset(offset);
      
      // Add working hours information where available
      const enhancedEntries = entries.map(entry => {
        return entry;
      });

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(timeclockEntriesTable)
        .where(eq(col('contractorId'), contractorId));

      // Return data with pagination info
      return res.status(200).json({
        entries: enhancedEntries,
        pagination: {
          total: count,
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        },
      });
    } catch (error) {
      console.error("Error getting entries:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get hours summary report by employee and day (for business owner only)
  app.get("/api/timeclock/report", async (req: Request, res: Response) => {
    try {
      // Verify user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const contractorId = req.user.id;
      
      // Get ALL entries for this contractor
      let allEntries = await db
        .select()
        .from(timeclockEntriesTable)
        .where(
          eq(col('contractorId'), contractorId)
        )
        .orderBy(col('date'), desc(col('timestamp')));
      
      // Map each entry to add employeeName property
      allEntries = allEntries.map(entry => ({
        ...entry,
        employeeName: entry.employee_name || entry.employeeName || rowField(entry, 'employeeName'),
      }));
      
      // Debug: Log the first entry to see the structure
      if (allEntries.length > 0) {
        console.log("DEBUG - First entry structure:", JSON.stringify(allEntries[0], null, 2));
        console.log("DEBUG - employeeName field:", allEntries[0].employeeName);
        console.log("DEBUG - employee_name field:", (allEntries[0] as any).employee_name);
      }
      
      // Use mapped allEntries for further processing
      let clockOutEntries = allEntries.filter(entry => rowField(entry, 'type') === "OUT");
      let clockInEntriesAll = allEntries.filter(entry => rowField(entry, 'type') === "IN");
      // Map employeeName for all arrays
      clockOutEntries = clockOutEntries.map(entry => ({ ...entry, employeeName: entry.employee_name || entry.employeeName }));
      clockInEntriesAll = clockInEntriesAll.map(entry => ({ ...entry, employeeName: entry.employee_name || entry.employeeName }));
      
      // Create a map of all clock-in entries for easy lookup
      const clockInMap = {};
      clockInEntriesAll.forEach(entry => {
        clockInMap[rowField(entry, 'id')] = entry;
      });
      
      // Get all clockInEntryIds referenced from clock-out entries
      const clockInIdsReferenced = clockOutEntries
        .map(entry => rowField(entry, 'clockInEntryId'))
        .filter(Boolean);
      
      // Find clock-in entries that don't have a corresponding clock-out (still clocked in)
      let standaloneClockIns = clockInEntriesAll.filter(entry => 
        !clockInIdsReferenced.includes(rowField(entry, 'id'))
      );
      standaloneClockIns = standaloneClockIns.map(entry => ({ ...entry, employeeName: entry.employee_name || entry.employeeName }));
      
      // Recalcular horas para todas las entradas de clock-out
      for (const outEntry of clockOutEntries) {
        if (rowField(outEntry, 'clockInEntryId')) {
          const inEntry = clockInMap[rowField(outEntry, 'clockInEntryId')];
          if (inEntry) {
            const clockInTime = new Date(rowField(inEntry, 'timestamp'));
            const clockOutTime = new Date(rowField(outEntry, 'timestamp'));
            
            // Calcular minutos y convertir a horas (con 2 decimales)
            const totalMinutes = differenceInMinutes(clockOutTime, clockInTime);
            const hoursWorked = parseFloat((totalMinutes / 60).toFixed(2));
            
            // Actualizar entrada con horas calculadas
            setRowField(outEntry, 'hoursWorked', hoursWorked);
            console.log(`Recalculated hours for ${rowField(outEntry, 'employeeName')}: ${hoursWorked} hours (${totalMinutes} minutes)`);
          }
        }
      }
      
      // Combine all entries for processing - including standalone clock-ins
      const entries = [...clockOutEntries, ...standaloneClockIns];
      
      console.log(`Found ${entries.length} total entries for report (${clockOutEntries.length} clock-outs and ${standaloneClockIns.length} active clock-ins)`);
      
      // Group by date and employee name to get daily totals
      const dailyReport = {};
      
      // Track weekly hours by employee (reset each Monday)
      const weeklyHours = {};
      
      // Function to get the week start date (Monday) for a given date
      const getWeekStartDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const day = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
        const diff = day === 0 ? 6 : day - 1; // Adjust for Monday as start of week
        const monday = new Date(date);
        monday.setDate(date.getDate() - diff);
        return monday.toISOString().split('T')[0];
      };
      
      // Function to get the ISO week number for a date
      const getWeekNumber = (dateStr: string) => {
        const date = new Date(dateStr);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      };
      
      // Función para asegurar que un valor es numérico
      const ensureNumber = (value: any): number => {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };
      
      for (const entry of entries) {
        // Formato de fecha compatible con ambos tipos de datos (Date o string)
        const dateKey = typeof rowField(entry, 'date') === 'string' ? rowField(entry, 'date') : rowField(entry, 'date').toISOString().split('T')[0];
        // Use entry.employeeName directly since it's mapped above
        const employeeName = entry.employeeName || 'Unknown Employee';
        const weekStartDate = getWeekStartDate(dateKey);
        const weekNumber = getWeekNumber(dateKey);
        const yearWeekKey = `${new Date(dateKey).getFullYear()}-W${weekNumber}`;
        
        // Initialize daily report structure
        if (!dailyReport[dateKey]) {
          dailyReport[dateKey] = {};
        }
        
        if (!dailyReport[dateKey][employeeName]) {
          dailyReport[dateKey][employeeName] = {
            totalHours: 0,
            entries: [],
            weeklyHours: 0,
            weekStartDate,
            yearWeekKey,
            weekNumber
          };
        }
        
        // Initialize weekly hours tracking
        if (!weeklyHours[yearWeekKey]) {
          weeklyHours[yearWeekKey] = {
            startDate: weekStartDate,
            year: new Date(dateKey).getFullYear(),
            weekNumber,
            employees: {}
          };
        }
        
        if (!weeklyHours[yearWeekKey].employees[employeeName]) {
          weeklyHours[yearWeekKey].employees[employeeName] = 0;
        }
        
        // Si es una entrada de tipo OUT
        if (rowField(entry, 'type') === "OUT") {
          // Debug de la entrada completa para ver qué contiene
          console.log("PROCESSING ENTRY:", JSON.stringify(entry, null, 2));
          
          // Parse hours worked using our safe ensureNumber function
          const hoursWorked = ensureNumber(rowField(entry, 'hoursWorked'));
          
          console.log(`Processing entry for ${employeeName}: hours worked = ${hoursWorked}`);
          
          // Get corresponding clock in entry
          const clockInEntry = rowField(entry, 'clockInEntryId') ? clockInMap[rowField(entry, 'clockInEntryId')] : null;
          
          // Add clock in entry first with matching timestamps
          if (clockInEntry) {
            const timestamp = rowField(clockInEntry, 'timestamp');
            dailyReport[dateKey][employeeName].entries.push({
              id: rowField(clockInEntry, 'id'),
              type: 'IN',
              timestamp: timestamp,
              location: rowField(clockInEntry, 'location'),
              notes: rowField(clockInEntry, 'notes') || "",
              isClockIn: true,
              // Incluir hora exacta para mostrar en detalles
              entryTime: timestamp
            });
          }
          
          // Siempre actualizar las horas totales, incluso si es 0
          const safeHoursWorked = ensureNumber(hoursWorked);
          
          // Actualizar con precaución, asegurando que los valores son numéricos
          dailyReport[dateKey][employeeName].totalHours = ensureNumber(dailyReport[dateKey][employeeName].totalHours) + safeHoursWorked;
          
          // Update weekly hours total - siempre actualizar
          // Nos aseguramos de que el valor en weeklyHours también sea numérico antes de sumar
          const currentWeeklyHours = ensureNumber(weeklyHours[yearWeekKey].employees[employeeName]);
          weeklyHours[yearWeekKey].employees[employeeName] = currentWeeklyHours + safeHoursWorked;
          
          console.log(`Updated weekly hours for ${employeeName} to ${weeklyHours[yearWeekKey].employees[employeeName]} (+${safeHoursWorked})`);
          dailyReport[dateKey][employeeName].weeklyHours = weeklyHours[yearWeekKey].employees[employeeName];
          
          // Guardar hora del Clock Out
          const outTimestamp = rowField(entry, 'timestamp');
          
          dailyReport[dateKey][employeeName].entries.push({
            id: rowField(entry, 'id'),
            type: 'OUT',
            clockInEntryId: rowField(entry, 'clockInEntryId'),
            hoursWorked,
            timestamp: outTimestamp,
            entryTime: outTimestamp, // Incluir hora exacta para mostrar
            location: rowField(entry, 'location'),
            notes: rowField(entry, 'notes') || "",
            isClockOut: true
          });
        } 
        // Si es una entrada de tipo IN que no tiene salida
        else {
          // Agregar la entrada directamente (todavía está en clock-in)
          const inTimestamp = rowField(entry, 'timestamp');
          
          dailyReport[dateKey][employeeName].entries.push({
            id: rowField(entry, 'id'),
            type: 'IN',
            timestamp: inTimestamp,
            entryTime: inTimestamp, // Incluir hora exacta para mostrar
            location: rowField(entry, 'location'),
            notes: rowField(entry, 'notes') || "",
            isClockIn: true
          });
        }
      }
      
      // Debug para ver qué está pasando con los datos
      console.log("Weekly hours data:", JSON.stringify(weeklyHours, null, 2));
      
      // Format the response with additional weekly summary
      const formattedResponse = {
        dailyReport,
        weeklyReport: weeklyHours
      };
      
      return res.status(200).json(formattedResponse);
    } catch (error) {
      console.error("Error generating hours report:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
}