import {LayerInfo} from '.';
export class keyword {
    public static hasKeyword (keyword:string, li:LayerInfo) : boolean {
        if (! keyword) { return true; }
        let arr = keyword.toLowerCase().split(' ');
        let found = false;
        let count = 0;
        let hasLayer = false;
        for (let i=0; i<arr.length; i++) {
            if (li.label && li.label.toLowerCase().indexOf(arr[i]) >=0) {
                count++;
            } 
        }
        if (count == arr.length) {
            found = true;
        }
/*        if (! found) {
            count = 0;
            for (let i=0; i<arr.length; i++) {
                if (item.name.toLowerCase().indexOf(arr[i]) >=0) {
                    count++;
                } 
            }
        }*/
        if (count == arr.length) {
            found = true;
        }
        return found;
    }
}