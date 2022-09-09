export class quickSearch {

    public static readonly EVENT_QUICK_SEARCH   = "quick_search";
    public static isMap : boolean               = false;
    
    public static submit(path: string) {
        if (quickSearch.isMap) {
            document.dispatchEvent(new CustomEvent(quickSearch.EVENT_QUICK_SEARCH));
        } else {
            location.href= path + '#tool:location';
        }
    }
}
