import { IService } from "@interfaces/service.interface";

export class ServiceModel implements IService {
    id: number = 0;
    bonus: number = 0;
    cash: number = 0;
    pay: number = 0;
    service: string = "";
    tip: number = 0;
    total: number = 0;
    visits: number = 0;
}