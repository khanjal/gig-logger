import { IName } from "@interfaces/name.interface";

export class NameHelper {
    static sortNameAsc(names: IName[]): IName[] {
        names.sort((a,b) => a.name.localeCompare(b.name));

        return names;
    }
}