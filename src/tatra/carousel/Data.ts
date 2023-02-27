export class Image {
    public image        : string = '';
    public label        : string | null = null;
    public date         : string | null = null;
    public offsetY      : string | null = null;
    public url          : string | null = null;
}

export class Data {
    public list : Array <Image> = [];
}