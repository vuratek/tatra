export class events {
    public static readonly EVENT_DATE_UPDATE       : string = "date_update";
    public static readonly EVENT_LAYERS_UPDATE     : string = "layers_update";

    public static updateDate () {
        document.dispatchEvent(new CustomEvent(events.EVENT_DATE_UPDATE));
    }
    public static layersDate () {
        document.dispatchEvent(new CustomEvent(events.EVENT_LAYERS_UPDATE));
    }

}