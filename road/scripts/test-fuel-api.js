/**
 * Fuel module smoke test (requires API + DB).
 * Usage: node scripts/test-fuel-api.js
 * Optional: API_URL=http://localhost:3201 node scripts/test-fuel-api.js
 */
const API = process.env.API_URL || "http://localhost:3201";

async function req(method, path, body) {
  const res = await fetch(`${API}/api/fuel${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) throw new Error(`${method} ${path}: ${json.message || res.status}`);
  return json.data;
}

async function main() {
  console.log("Fuel API smoke test →", API);

  const dash = await req("GET", "/dashboard");
  console.log("✓ dashboard stock=", dash.current_stock);

  const supplier = await req("POST", "/suppliers", {
    name: `Test Supplier ${Date.now()}`,
    phone: "99001122",
    status: "active",
  });
  console.log("✓ supplier", supplier.id);

  const tank = await req("POST", "/tanks", {
    name: `Test Tank ${Date.now()}`,
    capacity: 5000,
    current_stock: 0,
    min_stock: 100,
    fuel_type: "diesel",
    status: "active",
    location: "Test",
  });
  console.log("✓ tank", tank.id);

  const purchase = await req("POST", "/purchases", {
    purchase_date: new Date().toISOString().slice(0, 10),
    supplier_id: supplier.id,
    tank_id: tank.id,
    fuel_type: "diesel",
    quantity: 1000,
    unit_price: 3500,
    invoice_number: "INV-TEST-1",
  });
  console.log("✓ purchase", purchase.id, "qty", purchase.quantity);

  const tankAfter = await req("GET", `/tanks/${tank.id}`);
  if (Number(tankAfter.current_stock) !== 1000) {
    throw new Error(`Expected stock 1000, got ${tankAfter.current_stock}`);
  }
  console.log("✓ stock increased to", tankAfter.current_stock);

  let createdIssueIds = [];
  try {
    await req("POST", "/issues", {
      equipment_id: 999999,
      tank_id: tank.id,
      quantity: 50,
      fuel_type: "diesel",
      issue_date: new Date().toISOString().slice(0, 10),
    });
  } catch (e) {
    // May fail if equipment FK constraint — try listing equipment
    const eqRes = await fetch(`${API}/api/equipment`).then((r) => r.json());
    const eqs = eqRes.success ? (Array.isArray(eqRes.data) ? eqRes.data : eqRes.data?.rows || []) : [];
    if (!eqs.length) {
      console.log("⚠ skip issue test (no equipment in DB)");
    } else {
      const issue1 = await req("POST", "/issues", {
        equipment_id: eqs[0].id,
        tank_id: tank.id,
        quantity: 50,
        fuel_type: "diesel",
        odometer: 1000,
        issue_date: new Date().toISOString().slice(0, 10),
      });
      console.log("✓ issue", issue1.id);
      createdIssueIds.push(issue1.id);

      const issue2 = await req("POST", "/issues", {
        equipment_id: eqs[0].id,
        tank_id: tank.id,
        quantity: 40,
        fuel_type: "diesel",
        odometer: 1200,
        issue_date: new Date().toISOString().slice(0, 10),
      });
      createdIssueIds.push(issue2.id);
      const cons = await req("GET", "/consumptions");
      console.log("✓ consumptions", cons.length, "rate sample", cons[0]?.consumption_rate);
      console.log("✓ issue flow ok");
    }
  }

  try {
    await req("POST", "/issues", {
      equipment_id: 1,
      tank_id: tank.id,
      quantity: 999999,
      fuel_type: "diesel",
    });
    throw new Error("Should have blocked over-issue");
  } catch (e) {
    if (String(e.message).includes("Should have")) throw e;
    console.log("✓ over-issue blocked:", e.message);
  }

  // Reverse issues first so purchase delete can restore full qty
  for (const id of createdIssueIds.reverse()) {
    await req("DELETE", `/issues/${id}`);
  }
  if (createdIssueIds.length) console.log("✓ issues deleted (stock restored)");

  await req("DELETE", `/purchases/${purchase.id}`);
  console.log("✓ purchase deleted (stock reversed)");

  await req("DELETE", `/tanks/${tank.id}`);
  await req("DELETE", `/suppliers/${supplier.id}`);
  console.log("✓ cleanup done");

  const reports = await req("GET", "/reports?type=tank");
  console.log("✓ reports tanks=", reports.tank_balance?.length ?? 0);
  console.log("\nAll fuel smoke tests passed.");
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
