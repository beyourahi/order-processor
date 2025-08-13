import type { CourierProcessor, SteadFastOrder, UserInfo } from "../../../types";

export class SteadFastProcessor implements CourierProcessor<SteadFastOrder> {
  processOrders(data: string[][], user: UserInfo): SteadFastOrder[] {
    return data.map(entry => ({
      Invoice: user.merchant_id || "",
      Name: entry[0] || "",
      Address: `${entry[1] || ""}, ${entry[2] || ""}`,
      Phone: entry[3] || "",
      Amount: entry[4] || "",
      Note: entry[5] || "",
      "Contact Name": user.name || "",
      "Contact Phone": user.phone || ""
    }));
  }
}