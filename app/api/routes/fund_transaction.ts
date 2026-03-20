import { createCrudRoutes } from "@/api/helpers/createCrudRoutes";
import {
  FundTransactionSchema,
  CreateFundTransactionSchema,
  UpdateFundTransactionSchema,
  FundTransactionSummarySchema,
} from "@/api/schemas/fund_transaction";

export const fundTransactionRoutes = createCrudRoutes({
  tableName: "fund_transaction",
  tag: "FundTransaction",
  entitySchema: FundTransactionSchema,
  createSchema: CreateFundTransactionSchema,
  updateSchema: UpdateFundTransactionSchema,
  summarySchema: FundTransactionSummarySchema,
});
