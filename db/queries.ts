import { neon } from "@neondatabase/serverless";

export type Vehicle = {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  category: string;
  body_type: string | null;
  year: number | null;
  displacement: number | null;
  chassis_number: string | null;
  engine_number: string | null;
  assignee: string | null;
  usage: string | null;
  status: string;
  tax_due_date: string | null;
  tax_amount: number;
  plate_renewal_year: number | null;
  notes: string | null;
};

export type LoanRequest = {
  id: string;
  applicant_name: string;
  unit: string;
  contact_phone: string | null;
  purpose: string;
  event_date: string;
  event_time: string;
  destination: string;
  status: string;
  vehicle_id: string | null;
  admin_note: string | null;
  created_at: string;
};

export type Driver = {
  id: string;
  name: string;
  nip: string | null;
  position: string | null;
  unit: string | null;
  license_number: string | null;
  license_type: string | null;
  license_expiry: string | null;
  phone: string | null;
  photo_url: string | null;
  address: string | null;
  assigned_vehicle: string | null;
  status: string;
};

export type MaintenanceRecord = {
  id: string;
  vehicle_id: string;
  plate_number: string;
  vehicle_name: string;
  service_date: string;
  service_type: string;
  status: string;
  odometer: number;
  cost: number;
  vendor: string | null;
  notes: string | null;
};

export type FuelRecord = {
  id: string;
  vehicle_id: string;
  plate_number: string;
  vehicle_name: string;
  fill_date: string;
  fuel_type: string;
  station: string | null;
  liters: number;
  price_per_liter: number;
  odometer: number;
  receipt_url: string | null;
  total_cost: number;
};

export type KirRecord = {
  id: string;
  vehicle_id: string;
  plate_number: string;
  test_number: string;
  chassis_number: string | null;
  engine_number: string | null;
  vehicle_type: string;
  brand_model: string;
  vehicle_year: number | null;
  test_result: string;
  last_test_date: string;
  valid_until: string;
  driver_name: string | null;
  vehicle_status: string;
  vehicle_location: string | null;
  next_test_date: string;
  remaining_days: number;
  status_category: "Aman" | "Warning" | "Kedaluwarsa";
};

type DashboardData = {
  stats: { vehicles: number; available: number; service: number; pending: number; taxDue: number };
  vehicles: Vehicle[];
  requests: LoanRequest[];
  drivers: Driver[];
  maintenance: MaintenanceRecord[];
  fuelRecords: FuelRecord[];
  kirRecords: KirRecord[];
};

let client: ReturnType<typeof neon> | null = null;
let initialization: Promise<void> | null = null;

function db() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL belum dikonfigurasi");
  client ??= neon(connectionString);
  return client;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function ensureDatabase() {
  if (initialization) return initialization;
  initialization = initialize().catch((error) => {
    initialization = null;
    throw error;
  });
  return initialization;
}

async function initialize() {
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    plate_number TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    category TEXT NOT NULL,
    body_type TEXT,
    year INTEGER,
    displacement DOUBLE PRECISION,
    chassis_number TEXT,
    engine_number TEXT,
    bpkb_number TEXT,
    assignee TEXT,
    usage TEXT,
    status TEXT NOT NULL DEFAULT 'Tersedia',
    tax_due_date DATE,
    tax_amount BIGINT DEFAULT 0,
    plate_renewal_year INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS vehicles_category_idx ON vehicles(category)`;
  await sql`CREATE INDEX IF NOT EXISTS vehicles_status_idx ON vehicles(status)`;
  await sql`CREATE TABLE IF NOT EXISTS loan_requests (
    id TEXT PRIMARY KEY,
    applicant_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    contact_phone TEXT,
    purpose TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    destination TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Menunggu Persetujuan',
    vehicle_id TEXT REFERENCES vehicles(id) ON DELETE SET NULL,
    admin_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS loan_requests_status_idx ON loan_requests(status)`;
  await sql`CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    assigned_vehicle TEXT,
    status TEXT NOT NULL DEFAULT 'Tersedia',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS nip TEXT`;
  await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS position TEXT`;
  await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS unit TEXT`;
  await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number TEXT`;
  await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_type TEXT`;
  await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_expiry DATE`;
  await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS photo_url TEXT`;
  await sql`ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address TEXT`;
  await sql`CREATE TABLE IF NOT EXISTS maintenance_records (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    service_type TEXT NOT NULL,
    odometer INTEGER DEFAULT 0,
    cost BIGINT DEFAULT 0,
    vendor TEXT,
    notes TEXT,
    next_service_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Diajukan'`;
  await sql`CREATE INDEX IF NOT EXISTS maintenance_vehicle_idx ON maintenance_records(vehicle_id)`;
  await sql`CREATE TABLE IF NOT EXISTS fuel_records (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    fill_date DATE NOT NULL,
    fuel_type TEXT NOT NULL,
    station TEXT,
    liters DOUBLE PRECISION NOT NULL DEFAULT 0,
    price_per_liter BIGINT NOT NULL DEFAULT 0,
    odometer INTEGER NOT NULL DEFAULT 0,
    receipt_url TEXT,
    total_cost BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS fuel_vehicle_idx ON fuel_records(vehicle_id)`;
  await sql`CREATE INDEX IF NOT EXISTS fuel_date_idx ON fuel_records(fill_date)`;
  await sql`CREATE TABLE IF NOT EXISTS kir_records (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    plate_number TEXT NOT NULL,
    test_number TEXT NOT NULL,
    chassis_number TEXT,
    engine_number TEXT,
    vehicle_type TEXT NOT NULL,
    brand_model TEXT NOT NULL,
    vehicle_year INTEGER,
    test_result TEXT NOT NULL,
    last_test_date DATE NOT NULL,
    valid_until DATE NOT NULL,
    driver_name TEXT,
    vehicle_status TEXT NOT NULL DEFAULT 'Operasional',
    vehicle_location TEXT,
    next_test_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS kir_vehicle_idx ON kir_records(vehicle_id)`;
  await sql`CREATE INDEX IF NOT EXISTS kir_valid_until_idx ON kir_records(valid_until)`;

  const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM vehicles` as unknown as Array<{ total: number }>;
  if (total === 0) await seedDemoData();
}

async function seedDemoData() {
  const sql = db();
  const vehicles = [
    ["veh-001", "AB 10•• XX", "Toyota", "Camry Hybrid", "Kendaraan Jabatan", "Sedan", 2020, 2.494, "Sekretariat", "Pendukung Jabatan", "Tersedia", "2026-09-18", 4200000, 2028],
    ["veh-002", "AB 70•• XX", "Hino", "Bus", "Layanan Tamu", "Bus", 2013, 4.009, "Pool Kendaraan", "Pelayanan Tamu", "Dipakai", "2026-08-21", 3850000, 2027],
    ["veh-003", "AB 16•• XX", "Toyota", "Innova", "Layanan Tamu", "Mini Bus", 2015, 1.998, "Pool Kendaraan", "Pelayanan Tamu", "Tersedia", "2026-08-12", 2750000, 2027],
    ["veh-004", "AB 13•• XX", "Toyota", "Avanza", "Operasional Biro", "Mini Bus", 2014, 1.495, "Biro Umum", "Operasional Administrasi", "Servis", "2026-11-02", 2200000, 2029],
    ["veh-005", "AB 23•• XX", "Honda", "NF125", "Roda Dua", "Sepeda Motor", 2013, 0.125, "Unit Kerja", "Operasional Harian", "Tersedia", "2026-08-08", 485000, 2028],
    ["veh-006", "AB 29•• XX", "Honda", "Supra X", "Roda Dua", "Sepeda Motor", 2015, 0.125, "Pool Kendaraan", "Operasional Harian", "Tersedia", "2026-10-14", 510000, 2027],
  ] as const;

  for (const vehicle of vehicles) {
    await sql`INSERT INTO vehicles (
      id, plate_number, brand, model, category, body_type, year, displacement,
      assignee, usage, status, tax_due_date, tax_amount, plate_renewal_year, notes
    ) VALUES (
      ${vehicle[0]}, ${vehicle[1]}, ${vehicle[2]}, ${vehicle[3]}, ${vehicle[4]}, ${vehicle[5]},
      ${vehicle[6]}, ${vehicle[7]}, ${vehicle[8]}, ${vehicle[9]}, ${vehicle[10]}, ${vehicle[11]},
      ${vehicle[12]}, ${vehicle[13]}, 'Data contoh; ganti dengan data terverifikasi.'
    ) ON CONFLICT (id) DO NOTHING`;
  }
  await sql`INSERT INTO drivers (id, name, assigned_vehicle, status)
    VALUES ('drv-001', 'Pengemudi Pool A', 'AB 70•• XX', 'Bertugas'),
           ('drv-002', 'Pengemudi Pool B', 'AB 16•• XX', 'Tersedia')
    ON CONFLICT (id) DO NOTHING`;
  await sql`INSERT INTO loan_requests (
      id, applicant_name, unit, purpose, event_date, event_time, destination, status
    ) VALUES (
      'req-demo-001', 'Pemohon Contoh', 'Biro Umum', 'Koordinasi lapangan',
      '2026-08-08', '09:00', 'Kompleks Kepatihan', 'Menunggu Persetujuan'
    ) ON CONFLICT (id) DO NOTHING`;
}

export async function getPublicStats() {
  await ensureDatabase();
  const [row] = await db()`SELECT
    COUNT(*)::int AS vehicles,
    COUNT(*) FILTER (WHERE status = 'Tersedia')::int AS available,
    (SELECT COUNT(*)::int FROM loan_requests WHERE status = 'Menunggu Persetujuan') AS pending
    FROM vehicles` as unknown as Array<{ vehicles: number; available: number; pending: number }>;
  return row;
}

export async function getPublicData() {
  await ensureDatabase();
  const sql = db();
  const [stats, vehicles, drivers] = await Promise.all([
    getPublicStats(),
    sql`SELECT id, plate_number, brand, model, category, body_type, year, displacement,
      chassis_number, engine_number,
      assignee, usage, status, tax_due_date::text, tax_amount::int, plate_renewal_year, notes
      FROM vehicles WHERE status = 'Tersedia' ORDER BY brand, model` as unknown as Promise<Vehicle[]>,
    sql`SELECT id, name, nip, position, unit, license_number, license_type,
      license_expiry::text, phone, photo_url, address, assigned_vehicle, status FROM drivers
      WHERE status = 'Tersedia' ORDER BY name` as unknown as Promise<Driver[]>,
  ]);
  return { stats, vehicles, drivers };
}

export async function getDashboardData(): Promise<DashboardData> {
  await ensureDatabase();
  const sql = db();
  const [vehicles, requests, drivers, maintenance, fuelRecords, kirRecords, totals] = await Promise.all([
    sql`SELECT id, plate_number, brand, model, category, body_type, year, displacement,
      chassis_number, engine_number,
      assignee, usage, status, tax_due_date::text, tax_amount::int, plate_renewal_year, notes
      FROM vehicles ORDER BY category, brand, model` as unknown as Promise<Vehicle[]>,
    sql`SELECT id, applicant_name, unit, contact_phone, purpose, event_date::text,
      event_time::text, destination, status, vehicle_id, admin_note, created_at::text
      FROM loan_requests ORDER BY created_at DESC` as unknown as Promise<LoanRequest[]>,
    sql`SELECT id, name, nip, position, unit, license_number, license_type,
      license_expiry::text, phone, photo_url, address, assigned_vehicle, status
      FROM drivers ORDER BY name` as unknown as Promise<Driver[]>,
    sql`SELECT m.id, m.vehicle_id, v.plate_number, CONCAT(v.brand, ' ', v.model) AS vehicle_name,
      m.service_date::text, m.service_type, m.status, m.odometer, m.cost::int, m.vendor, m.notes
      FROM maintenance_records m JOIN vehicles v ON v.id = m.vehicle_id
      ORDER BY m.service_date DESC, m.created_at DESC` as unknown as Promise<MaintenanceRecord[]>,
    sql`SELECT f.id, f.vehicle_id, v.plate_number, CONCAT(v.brand, ' ', v.model) AS vehicle_name,
      f.fill_date::text, f.fuel_type, f.station, f.liters::float8, f.price_per_liter::int,
      f.odometer, f.receipt_url, f.total_cost::int
      FROM fuel_records f JOIN vehicles v ON v.id = f.vehicle_id
      ORDER BY f.fill_date DESC, f.created_at DESC` as unknown as Promise<FuelRecord[]>,
    sql`SELECT id, vehicle_id, plate_number, test_number, chassis_number, engine_number,
      vehicle_type, brand_model, vehicle_year, test_result, last_test_date::text,
      valid_until::text, driver_name, vehicle_status, vehicle_location,
      next_test_date::text, (valid_until - CURRENT_DATE)::int AS remaining_days,
      CASE
        WHEN valid_until < CURRENT_DATE THEN 'Kedaluwarsa'
        WHEN valid_until <= CURRENT_DATE + 30 THEN 'Warning'
        ELSE 'Aman'
      END AS status_category
      FROM kir_records ORDER BY valid_until, created_at DESC` as unknown as Promise<KirRecord[]>,
    sql`SELECT COUNT(*)::int AS vehicles,
      COUNT(*) FILTER (WHERE status = 'Tersedia')::int AS available,
      COUNT(*) FILTER (WHERE status = 'Servis')::int AS service,
      COUNT(*) FILTER (WHERE tax_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30)::int AS tax_due
      FROM vehicles` as unknown as Promise<Array<{ vehicles: number; available: number; service: number; tax_due: number }>>,
  ]);
  return {
    stats: {
      vehicles: totals[0]?.vehicles ?? 0,
      available: totals[0]?.available ?? 0,
      service: totals[0]?.service ?? 0,
      pending: requests.filter((request) => request.status === "Menunggu Persetujuan").length,
      taxDue: totals[0]?.tax_due ?? 0,
    },
    vehicles,
    requests,
    drivers,
    maintenance,
    fuelRecords,
    kirRecords,
  };
}

export async function createLoanRequest(input: Record<string, unknown>) {
  const required = ["applicantName", "unit", "purpose", "eventDate", "eventTime", "destination"];
  for (const field of required) {
    if (typeof input[field] !== "string" || !input[field].trim()) throw new Error(`Kolom ${field} wajib diisi`);
  }
  await ensureDatabase();
  const id = `REQ-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db()`INSERT INTO loan_requests (
    id, applicant_name, unit, contact_phone, purpose, event_date, event_time, destination
  ) VALUES (
    ${id}, ${String(input.applicantName)}, ${String(input.unit)}, ${input.contactPhone ? String(input.contactPhone) : null},
    ${String(input.purpose)}, ${String(input.eventDate)}, ${String(input.eventTime)}, ${String(input.destination)}
  )`;
  return { id, status: "Menunggu Persetujuan" };
}

export async function updateRequest(id: string, input: Record<string, unknown>) {
  const status = String(input.status || "");
  if (!["Menunggu Persetujuan", "Disetujui", "Ditolak"].includes(status)) throw new Error("Status permohonan tidak valid");
  await ensureDatabase();
  await db()`UPDATE loan_requests SET status = ${status}, vehicle_id = ${input.vehicleId ? String(input.vehicleId) : null},
    admin_note = ${input.adminNote ? String(input.adminNote) : null}, updated_at = NOW() WHERE id = ${id}`;
}

export async function createVehicle(input: Record<string, unknown>) {
  for (const field of ["plateNumber", "brand", "model", "category"]) {
    if (typeof input[field] !== "string" || !input[field].trim()) throw new Error(`Kolom ${field} wajib diisi`);
  }
  await ensureDatabase();
  const id = `VEH-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db()`INSERT INTO vehicles (
    id, plate_number, brand, model, category, body_type, year, displacement, assignee,
    usage, status, tax_due_date, tax_amount, plate_renewal_year, notes
  ) VALUES (
    ${id}, ${String(input.plateNumber)}, ${String(input.brand)}, ${String(input.model)}, ${String(input.category)},
    ${input.bodyType ? String(input.bodyType) : null}, ${Number(input.year) || null}, ${Number(input.displacement) || null},
    ${input.assignee ? String(input.assignee) : null}, ${input.usage ? String(input.usage) : null},
    ${String(input.status || "Tersedia")}, ${input.taxDueDate ? String(input.taxDueDate) : null},
    ${Number(input.taxAmount) || 0}, ${Number(input.plateRenewalYear) || null}, ${input.notes ? String(input.notes) : null}
  )`;
  return { id };
}

export async function createDriver(input: Record<string, unknown>) {
  if (typeof input.name !== "string" || !input.name.trim()) throw new Error("Nama pengemudi wajib diisi");
  const status = String(input.status || "Aktif");
  if (!["Aktif", "Tersedia", "Bertugas", "Tidak Aktif", "Libur"].includes(status)) throw new Error("Status pengemudi tidak valid");
  const photoUrl = input.photoUrl ? String(input.photoUrl).trim() : null;
  if (photoUrl) {
    try {
      const parsed = new URL(photoUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      throw new Error("URL foto harus berupa alamat http atau https yang valid");
    }
  }
  await ensureDatabase();
  const id = `DRV-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db()`INSERT INTO drivers (
    id, name, nip, position, unit, license_number, license_type, license_expiry,
    phone, photo_url, address, status
  ) VALUES (
    ${id}, ${String(input.name).trim()}, ${input.nip ? String(input.nip).trim() : null},
    ${input.position ? String(input.position).trim() : null}, ${input.unit ? String(input.unit).trim() : null},
    ${input.licenseNumber ? String(input.licenseNumber).trim() : null}, ${input.licenseType ? String(input.licenseType) : null},
    ${input.licenseExpiry ? String(input.licenseExpiry) : null}, ${input.phone ? String(input.phone).trim() : null},
    ${photoUrl}, ${input.address ? String(input.address).trim() : null}, ${status}
  )`;
  return { id };
}

export async function createMaintenanceRecord(input: Record<string, unknown>) {
  for (const field of ["vehicleId", "serviceDate", "serviceType"]) {
    if (typeof input[field] !== "string" || !input[field].trim()) throw new Error(`Kolom ${field} wajib diisi`);
  }
  const status = String(input.status || "Diajukan");
  if (!["Diajukan", "Dijadwalkan", "Dikerjakan", "Selesai", "Dibatalkan"].includes(status)) throw new Error("Status pemeliharaan tidak valid");
  const odometer = Math.max(0, Math.trunc(Number(input.odometer) || 0));
  const cost = Math.max(0, Math.trunc(Number(input.cost) || 0));
  await ensureDatabase();
  const id = `MNT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db()`INSERT INTO maintenance_records (
    id, vehicle_id, service_date, service_type, status, odometer, cost, vendor, notes
  ) VALUES (
    ${id}, ${String(input.vehicleId)}, ${String(input.serviceDate)}, ${String(input.serviceType)},
    ${status}, ${odometer}, ${cost}, ${input.vendor ? String(input.vendor).trim() : null},
    ${input.notes ? String(input.notes).trim() : null}
  )`;
  return { id };
}

export async function updateDriverStatus(id: string, input: Record<string, unknown>) {
  const status = String(input.status || "");
  if (!["Tersedia", "Bertugas"].includes(status)) throw new Error("Status pengemudi tidak valid");
  await ensureDatabase();
  const result = await db()`UPDATE drivers SET status = ${status}, updated_at = NOW() WHERE id = ${id} RETURNING id` as unknown as Array<{ id: string }>;
  if (result.length === 0) throw new Error("Pengemudi tidak ditemukan");
  return { id, status };
}

export async function createFuelRecord(input: Record<string, unknown>) {
  for (const field of ["vehicleId", "fillDate", "fuelType"]) {
    if (typeof input[field] !== "string" || !input[field].trim()) throw new Error(`Kolom ${field} wajib diisi`);
  }
  const liters = Math.max(0, Number(input.liters) || 0);
  const pricePerLiter = Math.max(0, Math.trunc(Number(input.pricePerLiter) || 0));
  const odometer = Math.max(0, Math.trunc(Number(input.odometer) || 0));
  const totalCost = Math.round(liters * pricePerLiter);
  const receiptUrl = input.receiptUrl ? String(input.receiptUrl).trim() : null;
  if (receiptUrl) {
    try {
      const parsed = new URL(receiptUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      throw new Error("URL bukti struk harus berupa alamat http atau https yang valid");
    }
  }
  await ensureDatabase();
  const id = `BBM-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db()`INSERT INTO fuel_records (
    id, vehicle_id, fill_date, fuel_type, station, liters, price_per_liter,
    odometer, receipt_url, total_cost
  ) VALUES (
    ${id}, ${String(input.vehicleId)}, ${String(input.fillDate)}, ${String(input.fuelType)},
    ${input.station ? String(input.station).trim() : null}, ${liters}, ${pricePerLiter},
    ${odometer}, ${receiptUrl}, ${totalCost}
  )`;
  return { id, totalCost };
}

export async function createKirRecord(input: Record<string, unknown>) {
  for (const field of ["vehicleId", "plateNumber", "testNumber", "vehicleType", "brandModel", "testResult", "lastTestDate", "validUntil"]) {
    if (typeof input[field] !== "string" || !input[field].trim()) throw new Error(`Kolom ${field} wajib diisi`);
  }
  const testResult = String(input.testResult);
  if (!["Lulus", "Tidak Lulus"].includes(testResult)) throw new Error("Status hasil uji tidak valid");
  const vehicleStatus = String(input.vehicleStatus || "Operasional");
  if (!["Operasional", "Cadangan", "Rusak"].includes(vehicleStatus)) throw new Error("Status kendaraan tidak valid");
  const lastTestDate = String(input.lastTestDate);
  const validUntil = String(input.validUntil);
  if (validUntil < lastTestDate) throw new Error("Masa berlaku KIR tidak boleh sebelum tanggal uji terakhir");
  const vehicleYear = Number(input.vehicleYear);
  if (vehicleYear && (vehicleYear < 1900 || vehicleYear > 2100)) throw new Error("Tahun kendaraan tidak valid");
  await ensureDatabase();
  const id = `KIR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  await db()`INSERT INTO kir_records (
    id, vehicle_id, plate_number, test_number, chassis_number, engine_number,
    vehicle_type, brand_model, vehicle_year, test_result, last_test_date, valid_until,
    driver_name, vehicle_status, vehicle_location, next_test_date
  ) VALUES (
    ${id}, ${String(input.vehicleId)}, ${String(input.plateNumber).trim()}, ${String(input.testNumber).trim()},
    ${input.chassisNumber ? String(input.chassisNumber).trim() : null},
    ${input.engineNumber ? String(input.engineNumber).trim() : null},
    ${String(input.vehicleType).trim()}, ${String(input.brandModel).trim()}, ${vehicleYear || null},
    ${testResult}, ${lastTestDate}, ${validUntil},
    ${input.driverName ? String(input.driverName).trim() : null}, ${vehicleStatus},
    ${input.vehicleLocation ? String(input.vehicleLocation).trim() : null}, ${validUntil}
  )`;
  return { id, nextTestDate: validUntil };
}

export async function updateVehicle(id: string, input: Record<string, unknown>) {
  const status = String(input.status || "Tersedia");
  if (!["Tersedia", "Dipakai", "Servis", "Tidak Aktif"].includes(status)) throw new Error("Status kendaraan tidak valid");
  await ensureDatabase();
  await db()`UPDATE vehicles SET
    plate_number = ${String(input.plateNumber)}, brand = ${String(input.brand)}, model = ${String(input.model)},
    category = ${String(input.category)}, body_type = ${input.bodyType ? String(input.bodyType) : null},
    year = ${Number(input.year) || null}, assignee = ${input.assignee ? String(input.assignee) : null},
    usage = ${input.usage ? String(input.usage) : null}, status = ${status},
    tax_due_date = ${input.taxDueDate ? String(input.taxDueDate) : null}, tax_amount = ${Number(input.taxAmount) || 0},
    plate_renewal_year = ${Number(input.plateRenewalYear) || null}, notes = ${input.notes ? String(input.notes) : null},
    updated_at = NOW() WHERE id = ${id}`;
}

export async function deleteVehicle(id: string) {
  await ensureDatabase();
  await db()`DELETE FROM vehicles WHERE id = ${id}`;
}
