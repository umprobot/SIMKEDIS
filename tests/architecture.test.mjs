import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("contains public service, admin authentication, and API surfaces", async () => {
  const [home, admin, auth, requestApi, kirApi, usersApi, driverStatusApi] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/admin/page.tsx", root), "utf8"),
    readFile(new URL("app/auth.ts", root), "utf8"),
    readFile(new URL("app/api/requests/route.ts", root), "utf8"),
    readFile(new URL("app/api/kir/route.ts", root), "utf8"),
    readFile(new URL("app/api/users/route.ts", root), "utf8"),
    readFile(new URL("app/api/drivers/[id]/route.ts", root), "utf8"),
  ]);
  assert.match(home, /Ajukan kendaraan/);
  assert.match(home, /PublicRequestForm/);
  assert.match(admin, /requirePortalUser/);
  assert.match(admin, /initialTab/);
  assert.match(auth, /@clerk\/nextjs\/server/);
  assert.match(requestApi, /createLoanRequest/);
  assert.match(kirApi, /createKirRecord/);
  assert.match(kirApi, /getOperatorUser/);
  assert.match(usersApi, /getAdminUser/);
  assert.match(usersApi, /createManagedDriver/);
  assert.match(auth, /publicMetadata/);
  assert.match(auth, /DEFAULT_DRIVERS/);
  assert.match(driverStatusApi, /getAdminUser/);
  assert.match(driverStatusApi, /updateDriverStatus/);
});

test("uses a lazy Neon client and initializes all core tables", async () => {
  const database = await readFile(new URL("db/queries.ts", root), "utf8");
  assert.match(database, /@neondatabase\/serverless/);
  assert.match(database, /process\.env\.DATABASE_URL/);
  for (const table of ["vehicles", "loan_requests", "drivers", "maintenance_records", "fuel_records", "kir_records"]) {
    assert.match(database, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  await assert.rejects(access(new URL(".env", root)));
});
