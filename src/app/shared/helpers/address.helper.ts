export class AddressHelper {
    static getShortAddress(address: string): string {
        if (address) {
            let addressArray = address.split(", ");
            return `${ addressArray[0] }, ${ addressArray[1] }`; 
        }
        
        return "";
    }
}