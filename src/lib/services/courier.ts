import { Courier } from "../../types";
import type { CourierProcessor, OrderType, UserInfo } from "../../types";
import { PathaoProcessor } from "./processors/pathao";
import { SteadFastProcessor } from "./processors/steadfast";
import { prepareSteadFastOrderData, preparePathaoOrderData } from "../data/processors";

export class CourierService {
  private static readonly processors = new Map<Courier, CourierProcessor<OrderType>>([
    [Courier.SteadFast, new SteadFastProcessor()],
    [Courier.Pathao, new PathaoProcessor()]
  ]);

  static processOrders(
    courierType: Courier,
    rawData: string[][],
    user: UserInfo
  ): OrderType[] {
    const processor = this.processors.get(courierType);
    if (!processor) {
      throw new Error(`No processor found for courier: ${courierType}`);
    }

    const preparedData = courierType === Courier.SteadFast 
      ? prepareSteadFastOrderData(rawData) 
      : preparePathaoOrderData(rawData);

    return processor.processOrders(preparedData, user);
  }
}