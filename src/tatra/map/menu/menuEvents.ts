export class menuEvents {

    public static dispatchEvent (event_id:string, detail : any) {
        document.dispatchEvent(new CustomEvent(event_id, {
            detail: detail,
        }));
    }
}