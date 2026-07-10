module.exports = (app) => {
  const router = require("express").Router();
  const ctrl = require("../controllers/finance.controller");

  router.get("/dashboard", ctrl.dashboard);
  router.get("/reports", ctrl.reports);

  router.get("/accounts", ctrl.listAccounts);
  router.post("/accounts", ctrl.createAccount);
  router.get("/accounts/:id", ctrl.getAccount);
  router.put("/accounts/:id", ctrl.updateAccount);
  router.delete("/accounts/:id", ctrl.deleteAccount);

  router.get("/contracts", ctrl.listContracts);
  router.post("/contracts", ctrl.createContract);
  router.get("/contracts/:id", ctrl.getContract);
  router.put("/contracts/:id", ctrl.updateContract);
  router.delete("/contracts/:id", ctrl.deleteContract);

  router.get("/invoices", ctrl.listInvoices);
  router.post("/invoices", ctrl.createInvoice);
  router.get("/invoices/:id", ctrl.getInvoice);
  router.put("/invoices/:id", ctrl.updateInvoice);
  router.delete("/invoices/:id", ctrl.deleteInvoice);

  router.get("/payments", ctrl.listPayments);
  router.post("/payments", ctrl.createPayment);
  router.get("/payments/:id", ctrl.getPayment);
  router.put("/payments/:id", ctrl.updatePayment);
  router.delete("/payments/:id", ctrl.deletePayment);

  router.get("/budgets", ctrl.listBudgets);
  router.post("/budgets", ctrl.createBudget);
  router.get("/budgets/:id", ctrl.getBudget);
  router.put("/budgets/:id", ctrl.updateBudget);
  router.delete("/budgets/:id", ctrl.deleteBudget);

  router.get("/expenses", ctrl.listExpenses);
  router.post("/expenses", ctrl.createExpense);
  router.get("/expenses/:id", ctrl.getExpense);
  router.put("/expenses/:id", ctrl.updateExpense);
  router.delete("/expenses/:id", ctrl.deleteExpense);
  router.post("/expenses/:id/approve", ctrl.approveExpense);

  router.get("/vat-entries", ctrl.listVat);
  router.post("/vat-entries", ctrl.createVat);
  router.get("/vat-entries/:id", ctrl.getVat);
  router.put("/vat-entries/:id", ctrl.updateVat);
  router.delete("/vat-entries/:id", ctrl.deleteVat);

  app.use("/api/finance", router);
};
