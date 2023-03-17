export class AddressHelper {
    static getShortAddress(address: string): string {
        let addressArray = address.split(", ");
        return `${ addressArray[0] }, ${ addressArray[1] }`; 
    }
}